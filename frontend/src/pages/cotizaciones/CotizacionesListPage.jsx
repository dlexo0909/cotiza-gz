import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney, QUOTE_STATUS_CONFIG } from '../../utils/helpers'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { FileText, Plus, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CotizacionesListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [page, search, statusFilter])

  async function loadData() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      if (statusFilter) params.append('estatus', statusFilter)
      const data = await api.get(`/cotizaciones?${params}`)
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch { toast.error('Error al cargar cotizaciones') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <Link to="/cotizaciones/nueva" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Nueva cotización
        </Link>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por folio, orden..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field">
            <option value="">Todos los estatus</option>
            {Object.entries(QUOTE_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState icon={FileText} title="Sin cotizaciones" description="No hay cotizaciones registradas"
          action={<Link to="/cotizaciones/nueva" className="btn-primary">Crear cotización</Link>} />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Folio</th>
                    <th className="table-header">Orden</th>
                    <th className="table-header">Cliente</th>
                    <th className="table-header">Subtotal</th>
                    <th className="table-header">Total</th>
                    <th className="table-header">Ingreso Real</th>
                    <th className="table-header">Estatus</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-primary-600">
                        <Link to={`/cotizaciones/${c.id}`} className="hover:underline">{c.folio}</Link>
                      </td>
                      <td className="table-cell text-sm">{c.orden_folio}</td>
                      <td className="table-cell text-sm">{c.cliente_nombre}</td>
                      <td className="table-cell">{formatMoney(c.subtotal)}</td>
                      <td className="table-cell font-medium">{formatMoney(c.total)}</td>
                      <td className="table-cell text-green-600 font-medium">{formatMoney(c.ingreso_real)}</td>
                      <td className="table-cell"><StatusBadge status={c.estatus} config={QUOTE_STATUS_CONFIG} /></td>
                      <td className="table-cell">
                        <button onClick={() => navigate(`/cotizaciones/${c.id}`)} className="text-gray-400 hover:text-primary-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
