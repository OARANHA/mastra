// src/integrations/baileys.ts
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  proto
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const prisma = new PrismaClient()

const CONNECTION_STATE = new Map<string, WASocket>()

export async function createBaileysConnection(clinicId: string) {
  const { state, saveCreds } = await useMultiFileAuthState(`./auth/${clinicId}`)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false, // QR será exibido na UI via Redis
    syncFullHistory: false,
    markOnlineOnConnect: true,
    browser: ['VoiceForge', 'Chrome', '115.0.0.0'],
  })

  // Salvar credentials atualizadas
  sock.ev.on('creds.update', saveCreds)

  // Monitorar conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // QR Code gerado - salvar no Redis pra UI buscar
    if (qr) {
      await redis.setex(`qr:${clinicId}`, 60, qr) // Expira em 60s
      await prisma.event.create({
        data: {
          clinicId,
          type: 'qr_generated',
          metadata: { expires_in: 60 }
        }
      })
    }

    // Conexão fechada
    if (connection === 'close') {
      const reasonCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = reasonCode !== DisconnectReason.loggedOut

      await prisma.event.create({
        data: {
          clinicId,
          type: 'connection_closed',
          metadata: { reason_code: reasonCode, should_reconnect: shouldReconnect }
        }
      })

      CONNECTION_STATE.delete(clinicId)

      if (shouldReconnect) {
        // Reconectar automaticamente
        setTimeout(() => createBaileysConnection(clinicId), 5000)
      }
    }

    // Conexão aberta
    if (connection === 'open') {
      CONNECTION_STATE.set(clinicId, sock)
      await redis.set(`connected:${clinicId}`, 'true')
      
      await prisma.clinic.update({
        where: { id: clinicId },
        data: { onboardedAt: new Date() }
      })

      await prisma.event.create({
        data: {
          clinicId,
          type: 'connection_opened',
          metadata: { timestamp: new Date().toISOString() }
        }
      })
    }
  })

  // Receber mensagens
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid!.replace('@s.whatsapp.net', '')
    const messageBody = msg.message.conversation || msg.message.extendedTextMessage?.text || ''

    if (!messageBody) return

    // Salvar mensagem recebida
    await prisma.message.create({
      data: {
        conversation: {
          connectOrCreate: {
            where: { 
              clinicId_patientPhone: {
                clinicId,
                patientPhone: from
              }
            },
            create: {
              clinicId,
              patientPhone: from,
              channel: 'whatsapp',
              status: 'active',
              score: 50
            }
          }
        },
        role: 'user',
        content: messageBody,
        metadata: {
          baileys_message_id: msg.key.id,
          timestamp: msg.messageTimestamp
        }
      }
    })

    // Disparar webhook Next.js
    const response = await fetch('http://localhost:3000/api/whatsapp/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId,
        from,
        message: messageBody,
        timestamp: new Date().toISOString()
      })
    })

    const result = await response.json()

    // Se teve resposta do agent, enviar
    if (result.response) {
      await sendMessageToWhatsApp(clinicId, from, result.response)
    }
  })

  return sock
}

export async function sendMessageToWhatsApp(clinicId: string, to: string, message: string) {
  const sock = CONNECTION_STATE.get(clinicId)
  if (!sock) {
    throw new Error(`WhatsApp not connected for clinic ${clinicId}`)
  }

  try {
    await sock.sendMessage(to, { text: message }, { timeout: 10000 })
    
    await prisma.event.create({
      data: {
        clinicId,
        type: 'message_sent',
        metadata: { to, length: message.length }
      }
    })

    return { success: true }
  } catch (error: any) {
    await prisma.event.create({
      data: {
        clinicId,
        type: 'message_failed',
        metadata: { to, error: error.message }
      }
    })

    return { success: false, error }
  }
}

export async function sendTemplateMessage(clinicId: string, to: string, template: string, variables: Record<string, string>) {
  const templates: Record<string, string> = {
    sales_offer: `Oi {{nome}}! 🎉\n\nTenho uma oferta especial: {{offer}}\n\nInteresse? Responda SIM para detalhes.`,
    scheduling_confirm: `Agendado! ✅\n\n📅 {{date}}\n🕐 {{time}}\n📍 {{location}}\n\nEnviaremos lembrete 1h antes.`,
    followup: `Oi {{nome}}! Notei que visitou {{page}}.\n\nPosso tirar dúvidas? 😊`,
    scheduling_slots: `Perfeito! Temos horários disponíveis:\n\n1️⃣ {{slot1}}\n2️⃣ {{slot2}}\n3️⃣ {{slot3}}\n\nQual prefere?`,
    objection_handling: `Entendo sua preocupação com {{topic}}. Posso explicar melhor sobre {{benefit}}?`
  }

  let msg = templates[template as keyof typeof templates]
  if (!msg) {
    msg = template // Fallback pra mensagem customizada
  }

  // Substituir variáveis
  Object.entries(variables).forEach(([key, val]) => {
    msg = msg.replace(`{{${key}}}`, val)
  })

  return sendMessageToWhatsApp(clinicId, to, msg)
}

export async function getQRCode(clinicId: string) {
  const qr = await redis.get(`qr:${clinicId}`)
  const connected = await redis.get(`connected:${clinicId}`) === 'true'
  return { qr, connected }
}

export async function disconnectBaileys(clinicId: string) {
  const sock = CONNECTION_STATE.get(clinicId)
  if (sock) {
    sock.endAllConnections()
    CONNECTION_STATE.delete(clinicId)
    await redis.del(`connected:${clinicId}`)
    await redis.del(`qr:${clinicId}`)
  }
}

export function getConnection(clinicId: string): WASocket | undefined {
  return CONNECTION_STATE.get(clinicId)
}
