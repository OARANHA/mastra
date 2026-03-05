'use client'

import useSWR from 'swr'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const INTENT_COLORS: Record<string, string> = {
  agendamento: '#3b82f6', // blue
  preco: '#22c55e', // green
  convenio: '#a855f7', // purple
  emergencia: '#ef4444', // red
  informacao: '#f59e0b', // orange
  outros: '#6b7280' // gray
}

export function TopIntentsCard({ clinicId = 'test-clinic-1' }: { clinicId?: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/metrics?clinicId=${clinicId}&period=week`,
    fetcher,
    { refreshInterval: 60000 }
  )

  if (error) {
    return <div className="text-center text-red-600 p-4">❌ Erro ao carregar intenções</div>
  }

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Carregando intenções...</span>
      </div>
    )
  }

  const topIntents = data?.topIntents || []

  if (!topIntents || topIntents.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Sem intenções disponíveis</span>
      </div>
    )
  }

  const chartData = topIntents.map(item => ({
    intent: item.intent.length > 12 ? item.intent.substring(0, 12) + '...' : item.intent,
    fullIntent: item.intent,
    count: item.count,
    color: INTENT_COLORS[item.intent] || '#6b7280'
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Intenções dos Pacientes</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="intent" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {topIntents.slice(0, 5).map((item: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: INTENT_COLORS[item.intent] || '#6b7280' }}
              />
              <span className="capitalize">{item.intent}</span>
            </div>
            <span className="font-semibold">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
