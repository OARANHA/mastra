'use client'

import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { ConversationsChart } from '@/components/dashboard/ConversationsChart'
import { TopIntentsCard } from '@/components/dashboard/TopIntentsCard'

export default function DashboardPage() {
  const clinicId = 'test-clinic-1' // In production, get from auth/session

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe as métricas da sua clínica em tempo real
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="mb-6">
          <MetricsCards clinicId={clinicId} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ConversationsChart clinicId={clinicId} />
          <TopIntentsCard clinicId={clinicId} />
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 Dados em Tempo Real
          </h3>
          <p className="text-gray-600">
            Os dados são atualizados automaticamente a cada 30 segundos.
            Última atualização: agora
          </p>
        </div>
      </div>
    </div>
  )
}
