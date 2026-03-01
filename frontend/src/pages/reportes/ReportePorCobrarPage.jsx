import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ReportePorCobrarPage() {
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => { loadReport() }, [clienteId])

  async function loadReport() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (clienteId) params.append('cliente_id', clienteId)
      const result = await api.get(`/reportes/por-cobrar?${params}`)
      setData(result)
    } catch { toast.error('Error al cargar reporte') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cuentas por Cobrar</h1>
      <div className="card mb-6">
        <label className="label-field">Filtrar por cliente</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="input-field w-64">
          <option value="">Todos</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : !data ? null : (
        <>
          {data.resumen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="stat-card border-orange-500">
                <p className="text-xs text-gray-500 uppercase">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{data.resumen.pendientes}</p>
              </div>
              <div className="stat-card border-blue-500">
                <p className="text-xs text-gray-500 uppercase">Total por cobrar</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatMoney(data.resumen.total_por_cobrar)}</p>
              </div>
              <div className="stat-card border-green-500">
                <p className="text-xs text-gray-500 uppercase">Ingreso esperado</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatMoney(data.resumen.ingreso_esperado)}</p>
              </div>
            </div>
          )}

          {(data.items || []).map(group => (
            <div key={group.cliente_id} className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">{group.cliente_nombre}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Folio</th>
                      <th className="table-header">Orden</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header text-right">Ingreso</th>
                      <th className="table-header">Factura</th>
                      <th className="table-header">Días pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.cotizaciones.map(c => {
                      const days = c.dias_pendiente || 0
                      const dayClass = days > 45 ? 'text-red-600 font-bold' : days > 30 ? 'text-yellow-600 font-medium' : ''
                      return (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">
                            <Link to={`/cotizaciones/${c.id}`} className="text-primary-600 hover:underline">{c.folio}</Link>
                          </td>
                          <td className="table-cell">{c.orden_folio}</td>
                          <td className="table-cell text-right">{formatMoney(c.total)}</td>
                          <td className="table-cell text-right text-green-600">{formatMoney(c.ingreso_real)}</td>
                          <td className="table-cell">{c.numero_factura || '—'}</td>
                          <td className={`table-cell ${dayClass}`}>{days}d</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
