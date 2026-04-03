import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { Download } from 'lucide-react'
import { formatDate, formatMoney, ORDER_STATUS_CONFIG } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

function exportCSV(rows, filename) {
  const headers = ['Folio', 'OT Cliente', 'Cliente', 'Sucursal', 'Descripcion', 'Estatus Interno', 'Status Tririga', 'Adelantos', 'Monto Autorizado', 'Saldo Pendiente', 'Dias Abierta', 'Fecha Alta']
  const escapeCSV = (value) => {
    const text = value == null ? '' : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }

  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push([
      escapeCSV(row.folio),
      escapeCSV(row.ot_cliente || ''),
      escapeCSV(row.cliente_nombre || ''),
      escapeCSV(row.cliente_final_nombre || ''),
      escapeCSV(row.descripcion || ''),
      escapeCSV(ORDER_STATUS_CONFIG[row.estatus]?.label || row.estatus || ''),
      escapeCSV(row.estatus_tririga || ''),
      escapeCSV(row.total_adelantos || 0),
      escapeCSV(row.monto_autorizado || 0),
      escapeCSV(row.saldo_pendiente || 0),
      escapeCSV(row.dias_abierta || 0),
      escapeCSV(formatDate(row.created_at)),
    ].join(','))
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ReporteOrdenesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reportes/ordenes').then(setData).catch(() => toast.error('Error al cargar')).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return null

  const statusOrder = ['levantamiento', 'cotizado', 'autorizado', 'en_proceso', 'terminado', 'facturado', 'cobrado', 'cancelado']
  const allRows = statusOrder.flatMap(status => data.detalle?.[status] || [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estado de Órdenes</h1>
        <button onClick={() => exportCSV(allRows, 'reporte-ordenes.csv')} className="btn-secondary flex items-center gap-2 w-fit">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {statusOrder.map(s => {
          const cfg = ORDER_STATUS_CONFIG[s]
          const count = data.pipeline?.[s] ?? 0
          return (
            <div key={s} className={`stat-card ${cfg.dot.replace('bg-', 'border-')}`}>
              <p className="text-xs text-gray-500 uppercase">{cfg.label}</p>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Detail by status */}
      {statusOrder.map(s => {
        const ordenes = data.detalle?.[s] || []
        if (ordenes.length === 0) return null
        const cfg = ORDER_STATUS_CONFIG[s]
        return (
          <div key={s} className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cfg.dot}`} />
              {cfg.label} ({ordenes.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header">Folio</th>
                    <th className="table-header">OT Cliente</th>
                    <th className="table-header">Cliente</th>
                    <th className="table-header">Sucursal</th>
                    <th className="table-header">Descripción</th>
                    <th className="table-header">Status Tririga</th>
                    <th className="table-header">Adelantos</th>
                    <th className="table-header">Monto</th>
                    <th className="table-header">Saldo</th>
                    <th className="table-header">Días</th>
                    <th className="table-header">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordenes.map(o => {
                    const days = o.dias_abierta || 0
                    const dayClass = days > 30 ? 'text-red-600 font-bold' : days > 14 ? 'text-yellow-600 font-medium' : ''
                    return (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">
                          <Link to={`/ordenes/${o.id}`} className="text-primary-600 hover:underline">{o.folio}</Link>
                        </td>
                        <td className="table-cell">{o.ot_cliente || '—'}</td>
                        <td className="table-cell">{o.cliente_nombre}</td>
                        <td className="table-cell">{o.cliente_final_nombre || '—'}</td>
                        <td className="table-cell max-w-[200px] truncate">{o.descripcion}</td>
                        <td className="table-cell">{o.estatus_tririga || '—'}</td>
                        <td className="table-cell">{formatMoney(o.total_adelantos || 0)}</td>
                        <td className="table-cell">{o.monto_autorizado ? formatMoney(o.monto_autorizado) : '—'}</td>
                        <td className="table-cell">{o.monto_autorizado ? formatMoney(o.saldo_pendiente || 0) : '—'}</td>
                        <td className={`table-cell ${dayClass}`}>{days}d</td>
                        <td className="table-cell">{formatDate(o.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
