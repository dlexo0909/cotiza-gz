import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { formatMoney } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { DollarSign, TrendingUp, FileText, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReporteIngresosPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => { loadReport() }, [year, month, clienteId])

  async function loadReport() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ year })
      if (month) params.append('month', month)
      if (clienteId) params.append('cliente_id', clienteId)
      const result = await api.get(`/reportes/ingresos?${params}`)
      setData(result)
    } catch { toast.error('Error al cargar reporte') }
    finally { setLoading(false) }
  }

  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporte de Ingresos</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-field">Año</label>
            <select value={year} onChange={e => setYear(e.target.value)} className="input-field">
              {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Mes</label>
            <select value={month} onChange={e => setMonth(e.target.value)} className="input-field">
              <option value="">Todos</option>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Cliente</label>
            <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="input-field">
              <option value="">Todos</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : !data ? null : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard title="Cotizaciones cobradas" value={data.resumen?.cobradas ?? 0} icon={FileText} color="border-blue-500 text-blue-600" />
            <StatCard title="Ingreso real" value={formatMoney(data.resumen?.ingreso_real ?? 0)} icon={DollarSign} color="border-green-500 text-green-600" />
            <StatCard title="Comisión" value={formatMoney(data.resumen?.comision ?? 0)} icon={TrendingUp} color="border-purple-500 text-purple-600" />
            <StatCard title="Total facturado" value={formatMoney(data.resumen?.total_facturado ?? 0)} icon={CreditCard} color="border-orange-500 text-orange-600" />
          </div>

          {data.mensual?.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-lg font-semibold mb-4">Desglose mensual</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Mes</th>
                      <th className="table-header text-right">Cobradas</th>
                      <th className="table-header text-right">Ingreso Real</th>
                      <th className="table-header text-right">Comisión</th>
                      <th className="table-header text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.mensual.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{months[m.mes - 1]}</td>
                        <td className="table-cell text-right">{m.cobradas}</td>
                        <td className="table-cell text-right text-green-600">{formatMoney(m.ingreso_real)}</td>
                        <td className="table-cell text-right">{formatMoney(m.comision)}</td>
                        <td className="table-cell text-right font-medium">{formatMoney(m.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.detalle?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Detalle de cobros</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="table-header">Folio</th>
                      <th className="table-header">Cliente</th>
                      <th className="table-header">Factura</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header text-right">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.detalle.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="table-cell font-medium">{d.folio}</td>
                        <td className="table-cell">{d.cliente_nombre}</td>
                        <td className="table-cell">{d.numero_factura || '—'}</td>
                        <td className="table-cell text-right">{formatMoney(d.total)}</td>
                        <td className="table-cell text-right text-green-600">{formatMoney(d.ingreso_real)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`stat-card ${color.split(' ')[0]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={`text-xl font-bold mt-1 ${color.split(' ')[1]}`}>{value}</p>
        </div>
        <Icon className={`w-7 h-7 ${color.split(' ')[1]} opacity-30`} />
      </div>
    </div>
  )
}
