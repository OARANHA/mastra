import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test clinic
  const clinic = await prisma.clinic.upsert({
    where: { id: 'test-clinic-1' },
    update: {},
    create: {
      id: 'test-clinic-1',
      name: 'Clínica Sorriso',
      phone: '+5511999999999',
      betaEnabled: true,
      config: {
        doctorName: 'Dr. Carlos',
        basePrice: '150',
        convenios: ['Unimed', 'SulAmérica', 'Amil']
      }
    }
  })

  console.log('✅ Clinic created:', clinic.name)

  // Create 20 conversations (last 7 days)
  const intents = ['agendamento', 'agendamento', 'agendamento', 'agendamento', 'agendamento', 'agendamento', 'agendamento', 'agendamento', 'preco', 'preco', 'preco', 'preco', 'preco', 'convenio', 'convenio', 'convenio', 'emergencia', 'emergencia', 'outros', 'outros']
  
  const now = new Date()
  const conversations = []

  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 7)
    const createdAt = new Date(now)
    createdAt.setDate(createdAt.getDate() - daysAgo)
    createdAt.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60))

    const conversation = await prisma.conversation.create({
      data: {
        clinicId: clinic.id,
        patientPhone: `+55119888877${String(i).padStart(2, '0')}`,
        patientName: `Paciente ${i + 1}`,
        channel: 'whatsapp',
        status: i < 15 ? 'active' : 'escalated',
        score: 70 + Math.floor(Math.random() * 30),
        createdAt,
        messages: {
          create: [
            {
              role: 'user',
              content: `Mensagem do paciente ${i + 1}`,
              createdAt
            },
            {
              role: 'assistant',
              content: `Resposta do assistente ${i + 1}`,
              metadata: { intent: intents[i], confidence: 0.8 + Math.random() * 0.15 },
              createdAt: new Date(createdAt.getTime() + 30000 + Math.random() * 90000) // 30s-2min later
            }
          ]
        }
      }
    })

    conversations.push(conversation)

    // Create appointments for some conversations
    if (i < 12) {
      const appointmentDate = new Date(createdAt)
      appointmentDate.setDate(appointmentDate.getDate() + 1 + Math.floor(Math.random() * 3))
      
      await prisma.appointment.create({
        data: {
          conversationId: conversation.id,
          datetime: appointmentDate,
          service: ['Limpeza', 'Canal', 'Clareamento', 'Consulta'][Math.floor(Math.random() * 4)],
          status: 'confirmed',
          convenio: ['Unimed', 'SulAmérica', 'Particular'][Math.floor(Math.random() * 3)],
          value: 150 + Math.random() * 200
        }
      })
    }
  }

  console.log('✅ Created 20 conversations with messages')
  console.log('✅ Created 12 appointments')

  // Summary
  const conversationCount = await prisma.conversation.count({ where: { clinicId: clinic.id } })
  const appointmentCount = await prisma.appointment.count({ 
    where: { conversation: { clinicId: clinic.id }, status: 'confirmed' } 
  })

  console.log(`\n📊 Summary:`)
  console.log(`   Conversations: ${conversationCount}`)
  console.log(`   Appointments: ${appointmentCount}`)
  console.log(`   Revenue: R$ ${appointmentCount * 150}`)
  console.log(`   ROI: ${(appointmentCount * 150 / 297).toFixed(2)}x`)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
