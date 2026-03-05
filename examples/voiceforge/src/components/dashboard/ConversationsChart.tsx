'use client'

import useSWR from 'swr'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function ConversationsChart({ clinicId = 'test-clinic-1' }: { clinicId?: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/daily?clinicId=${clinicId}&days=7`,
    fetcher,
    { refreshInterval: 60000 }
  )

  if (error) {
    return <div className="text-center text-red-600 p-4">❌ Erro ao carregar gráfico</div>
  }

  if (isLoading) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Carregando gráfico...</span>
      </div>
    )
  }

  const chartData = data?.daily || []

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Sem dados disponíveis</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversas por Dia (Últimos 7 dias)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="conversations" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="Conversas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
