// src/app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, differenceInSeconds } from 'date-fns'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinicId')
    const period = searchParams.get('period') || 'week'

    if (!clinicId) return NextResponse.json({ error: 'Missing clinicId' }, { status: 400 })

    const now = new Date()
    let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date

    if (period === 'month') {
      currentStart = startOfMonth(now)
      currentEnd = endOfMonth(now)
      previousStart = startOfMonth(subMonths(now, 1))
      previousEnd = endOfMonth(subMonths(now, 1))
    } else {
      currentStart = startOfWeek(now)
      currentEnd = endOfWeek(now)
      previousStart = startOfWeek(subWeeks(now, 1))
      previousEnd = endOfWeek(subWeeks(now, 1))
    }

    const [currentConversations, previousConversations, currentAppointments, previousAppointments] = await Promise.all([
      prisma.conversation.count({ where: { clinicId, createdAt: { gte: currentStart, lte: currentEnd } } }),
      prisma.conversation.count({ where: { clinicId, createdAt: { gte: previousStart, lte: previousEnd } } }),
      prisma.appointment.count({ where: { conversation: { clinicId }, status: 'confirmed', createdAt: { gte: currentStart, lte: currentEnd } } }),
      prisma.appointment.count({ where: { conversation: { clinicId }, status: 'confirmed', createdAt: { gte: previousStart, lte: previousEnd } } })
    ])

    const appointmentValue = 150
    const currentRevenue = currentAppointments * appointmentValue
    const previousRevenue = previousAppointments * appointmentValue
    const cost = 297
    const currentRoi = currentRevenue / cost
    const previousRoi = previousRevenue / cost

    const messages = await prisma.message.findMany({
      where: { conversation: { clinicId }, createdAt: { gte: currentStart } },
      orderBy: { createdAt: 'asc' }
    })

    let totalResponseTime = 0, responseCount = 0
    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const diff = differenceInSeconds(messages[i + 1].createdAt, messages[i].createdAt)
        if (diff > 0 && diff < 300) { totalResponseTime += diff; responseCount++ }
      }
    }
    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0

    const allMessages = await prisma.message.findMany({
      where: { conversation: { clinicId }, role: 'assistant', createdAt: { gte: currentStart } }
    })
    const intentCounts: Record<string, number> = {}
    allMessages.forEach(msg => {
      const metadata = msg.metadata as any
      if (metadata?.intent) {
        const intent = typeof metadata.intent === 'string' ? metadata.intent : metadata.intent.type
        if (intent) intentCounts[intent] = (intentCounts[intent] || 0) + 1
      }
    })
    const topIntents = Object.entries(intentCounts).map(([intent, count]) => ({ intent, count })).sort((a, b) => b.count - a.count).slice(0, 5)

    return NextResponse.json({
      conversations: { current: currentConversations, previous: previousConversations, growth: previousConversations > 0 ? Math.round(((currentConversations - previousConversations) / previousConversations) * 100) : 0 },
      appointments: { current: currentAppointments, previous: previousAppointments, growth: previousAppointments > 0 ? Math.round(((currentAppointments - previousAppointments) / previousAppointments) * 100) : 0 },
      roi: { revenue: currentRevenue, previousRevenue, cost, multiple: Math.round(currentRoi * 100) / 100, previousMultiple: Math.round(previousRoi * 100) / 100 },
      avgResponseTime,
      topIntents,
      period,
      lastUpdated: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[Dashboard Metrics] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// Helper function for daily breakdown
export async function getDailyConversations(clinicId: string, days: number = 7) {
  const dailyData = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const count = await prisma.conversation.count({
      where: {
        clinicId,
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    })
    
    dailyData.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count,
      fullDate: date.toISOString()
    })
  }
  
  return dailyData
}

export async function getDailyAppointments(clinicId: string, days: number = 7) {
  const dailyData = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    const count = await prisma.appointment.count({
      where: {
        conversation: { clinicId },
        status: 'confirmed',
        datetime: {
          gte: date,
          lt: nextDate
        }
      }
    })
    
    dailyData.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count,
      revenue: count * 150
    })
  }
  
  return dailyData
}
