'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface MetricsData {
  conversations?: { current: number; previous: number; growth: number }
  appointments?: { current: number; previous: number; growth: number }
  roi?: { revenue: number; multiple: number }
  avgResponseTime?: number
  isLoading?: boolean
  error?: any
}

export function MetricsCards({ clinicId = 'test-clinic-1' }: { clinicId?: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/metrics?clinicId=${clinicId}&period=week`,
    fetcher,
    { refreshInterval: 30000 }
  )

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-4 text-center text-red-600 p-4">
          ❌ Erro ao carregar dados do dashboard
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  const metrics: MetricsData = data || {}
  const conversations = metrics.conversations?.current || 0
  const appointments = metrics.appointments?.current || 0
  const roi = metrics.roi?.multiple || 0
  const responseTime = metrics.avgResponseTime || 0

  const growthColor = (growth: number) => growth >= 0 ? 'text-green-600' : 'text-red-600'
  const growthIcon = (growth: number) => growth >= 0 ? '📈' : '📉'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Conversas */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Conversas (7 dias)</div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{conversations}</div>
        <div className={`text-sm ${growthColor(metrics.conversations?.growth || 0)}`}>
          {growthIcon(metrics.conversations?.growth || 0)} {metrics.conversations?.growth || 0}% vs período anterior
        </div>
      </div>

      {/* Agendamentos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Agendamentos</div>
        <div className="text-3xl font-bold text-gray-900 mb-2">{appointments}</div>
        <div className={`text-sm ${growthColor(metrics.appointments?.growth || 0)}`}>
          {growthIcon(metrics.appointments?.growth || 0)} {metrics.appointments?.growth || 0}% vs período anterior
        </div>
      </div>

      {/* ROI */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">ROI</div>
        <div className="text-3xl font-bold text-green-600 mb-2">{roi.toFixed(2)}x</div>
        <div className="text-sm text-gray-600">
          R$ {metrics.roi?.revenue || 0} de receita
        </div>
      </div>

      {/* Tempo de Resposta */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-2">Tempo Médio</div>
        <div className="text-3xl font-bold text-blue-600 mb-2">{responseTime}s</div>
        <div className="text-sm text-gray-600">
          Resposta por mensagem
        </div>
      </div>
    </div>
  )
}
