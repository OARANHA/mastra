// src/lib/qwen.ts
import { Intent, IntentType, ConversationContext, QwenResponse } from '@/types/intent'
import { generateTemplateResponse, TemplateVariables } from '@/lib/templates'
import { getAvailableSlots, getProcedureDetails } from '@/lib/scheduling'

const QWEN_API_KEY = process.env.QWEN_API_KEY

function detectIntentKeywords(message: string): Intent {
  const lower = message.toLowerCase()
  if (lower.includes('agendar') || lower.includes('marcar') || lower.includes('fazer canal') || lower.includes('limpeza') || lower.includes('clareamento')) return { type: 'agendamento', confidence: 0.9, entities: {} }
  if (lower.includes('preço') || lower.includes('custa') || lower.includes('valor')) return { type: 'preco', confidence: 0.85, entities: {} }
  if (lower.includes('convênio') || lower.includes('unimed')) return { type: 'convenio', confidence: 0.9, entities: {} }
  if (lower.includes('dor') || lower.includes('urgência')) return { type: 'emergencia', confidence: 0.95, entities: { urgency: 'high' } }
  return { type: 'outros', confidence: 0.5, entities: {} }
}

export async function detectIntent(message: string): Promise<Intent> {
  if (!QWEN_API_KEY || QWEN_API_KEY === 'sk-xxx') {
    console.log('[Qwen] Mock mode')
    return detectIntentKeywords(message)
  }
  return detectIntentKeywords(message)
}

export async function generateResponse(intent: Intent, context: ConversationContext, clinicData?: { name?: string; config?: any }, message?: string): Promise<string> {
  if (intent.type === 'agendamento' && message) {
    const { procedure, priceRange, duration } = getProcedureDetails(message)
    const slots = getAvailableSlots(clinicData?.name || 'test', procedure?.name)
    const slot1 = slots[0] ? `${slots[0].time}h` : '14:00'
    const slot2 = slots[1] ? `${slots[1].time}h` : '16:00'
    const slot3 = slots[2] ? `${slots[2].time}h` : '18:00'
    const variables: TemplateVariables = { clinicName: clinicData?.name || 'Nossa Clínica', doctorName: clinicData?.config?.doctorName || 'Carlos', procedureName: procedure?.name || 'consulta', procedureDuration: duration.toString(), procedurePriceRange: priceRange, slot1, slot2, slot3, availableSlots: slots.map(s => `🔹 ${s.time}h`).join('\n') }
    return generateTemplateResponse(intent.type, variables)
  }
  const variables: TemplateVariables = { clinicName: clinicData?.name || 'Nossa Clínica', doctorName: clinicData?.config?.doctorName || 'Carlos', procedure: intent.entities.procedure, convenioName: intent.entities.insurance || 'Unimed', basePrice: '150', convenios: 'Unimed, SulAmérica, Amil', horarios: 'Segunda a Sexta, 8h às 19h', address: 'Rua das Flores, 123', emergencySlot: '16:00', availableSlots: '1️⃣ Amanhã 14:00\n2️⃣ Sexta 10:00\n3️⃣ Sexta 16:00' }
  return generateTemplateResponse(intent.type, variables)
}

export function calculateScore(intent: Intent): number { let score = 50; switch (intent.type) { case 'agendamento': score += 30; break; case 'preco': score += 20; break; case 'emergencia': score += 25; break; case 'convenio': score += 15; break; } score += (intent.confidence - 0.5) * 20; if (intent.entities.urgency === 'high') score += 15; return Math.max(0, Math.min(100, Math.round(score))) }

export function shouldEscalate(intent: Intent, score: number): boolean { if (intent.type === 'emergencia') return true; if (intent.confidence < 0.6) return true; if (score > 80) return true; return false }

export async function processMessage(message: string, context: ConversationContext, clinicData?: { name?: string; config?: any }): Promise<QwenResponse> { const intent = await detectIntent(message); const response = await generateResponse(intent, context, clinicData, message); const score = calculateScore(intent); const shouldEsc = shouldEscalate(intent, score); return { intent, response, score, shouldEscalate: shouldEsc } }
