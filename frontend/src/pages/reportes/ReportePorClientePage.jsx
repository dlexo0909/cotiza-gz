import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { formatMoney } from '../../utils/helpers'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ReportePorClientePage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReport() }, [year])

  async function loadReport() {
    try {
      setLoading(true)
      const result = await api.get(`/reportes/por-cliente?year=${year}`)
      setData(result)
    } catch { toast.error('Error al cargar reporte') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporte por Cliente</h1>
      <div className="card mb-6">
        <label className="label-field">Año</label>
        <select value={year} onChange={e => setYear(e.target.value)} className="input-field w-32">
          {[currentYear, currentYear - 1, currentYear - 2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header">Cliente</th>
                  <th className="table-header text-right">Órdenes</th>
                  <th className="table-header text-right">Cotizaciones</th>
                  <th className="table-header text-right">Cobradas</th>
                  <th className="table-header text-right">Ingreso Real</th>
                  <th className="table-header text-right">Comisión</th>
                  <th className="table-header text-right">Total Facturado</th>
                  <th className="table-header text-right">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map(c => (
                  <tr key={c.cliente_id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{c.cliente_nombre}</td>
                    <td className="table-cell text-right">{c.ordenes}</td>
                    <td className="table-cell text-right">{c.cotizaciones}</td>
                    <td className="table-cell text-right">{c.cobradas}</td>
                    <td className="table-cell text-right text-green-600">{formatMoney(c.ingreso_real)}</td>
                    <td className="table-cell text-right">{formatMoney(c.comision)}</td>
                    <td className="table-cell text-right font-medium">{formatMoney(c.total_facturado)}</td>
                    <td className="table-cell text-right text-orange-600">{formatMoney(c.pendiente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
