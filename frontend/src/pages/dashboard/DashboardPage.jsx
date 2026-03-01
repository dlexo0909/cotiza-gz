import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { formatMoney, formatDate, ORDER_STATUS_CONFIG, QUOTE_STATUS_CONFIG } from '../../utils/helpers'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { ClipboardList, FileText, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [pendingQuotes, setPendingQuotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [statsData, ordersData, quotesData] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-orders'),
        api.get('/dashboard/pending-quotes'),
      ])
      setStats(statsData)
      setRecentOrders(ordersData)
      setPendingQuotes(quotesData)
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Órdenes activas"
          value={stats?.ordenes_activas ?? 0}
          icon={ClipboardList}
          color="border-blue-500"
          textColor="text-blue-600"
        />
        <StatCard
          title="Cotizaciones pendientes"
          value={stats?.cotizaciones_pendientes ?? 0}
          icon={FileText}
          color="border-yellow-500"
          textColor="text-yellow-600"
        />
        <StatCard
          title="Ingreso del mes"
          value={formatMoney(stats?.ingreso_mes ?? 0)}
          icon={DollarSign}
          color="border-green-500"
          textColor="text-green-600"
        />
        <StatCard
          title="Comisión del mes"
          value={formatMoney(stats?.comision_mes ?? 0)}
          icon={TrendingUp}
          color="border-purple-500"
          textColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Últimas órdenes</h2>
            <Link to="/ordenes" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin órdenes recientes</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/ordenes/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm text-gray-900">{order.folio}</span>
                    <p className="text-xs text-gray-500">{order.cliente_nombre}</p>
                  </div>
                  <StatusBadge status={order.estatus} config={ORDER_STATUS_CONFIG} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pending Quotes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Cotizaciones pendientes</h2>
            <Link to="/cotizaciones" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pendingQuotes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin cotizaciones pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingQuotes.map((q) => (
                <Link
                  key={q.id}
                  to={`/cotizaciones/${q.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm text-gray-900">{q.folio}</span>
                    <p className="text-xs text-gray-500">{formatMoney(q.total)}</p>
                  </div>
                  <StatusBadge status={q.estatus} config={QUOTE_STATUS_CONFIG} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, textColor }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${textColor} opacity-30`} />
      </div>
    </div>
  )
}
