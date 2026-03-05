import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { startOfDay, subDays } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinicId') || 'test-clinic-1'
    const days = parseInt(searchParams.get('days') || '7')

    const dailyData = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(now, i))
      const nextDate = startOfDay(subDays(now, i - 1))

      const [conversations, appointments] = await Promise.all([
        prisma.conversation.count({
          where: { clinicId, createdAt: { gte: date, lt: nextDate } }
        }),
        prisma.appointment.count({
          where: {
            conversation: { clinicId },
            status: 'confirmed',
            datetime: { gte: date, lt: nextDate }
          }
        })
      ])

      dailyData.push({
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: date.toISOString(),
        conversations,
        appointments,
        revenue: appointments * 150
      })
    }

    return NextResponse.json({ daily: dailyData, period: 'week' })
  } catch (error: any) {
    console.error('[Dashboard Daily] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
