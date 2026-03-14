import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney, ORDER_STATUS_CONFIG } from '../../utils/helpers'
import StatusBadge from '../../components/ui/StatusBadge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { ClipboardList, Plus, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdenesListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clienteFilter, setClienteFilter] = useState('')
  const [sucursalFilter, setSucursalFilter] = useState('')
  const [clientes, setClientes] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (clienteFilter) {
      api.get(`/clientes-finales?limit=200&cliente_id=${clienteFilter}`)
        .then(d => setSucursales(d.items || [])).catch(() => {})
    } else {
      setSucursales([])
      setSucursalFilter('')
    }
  }, [clienteFilter])

  useEffect(() => { loadData() }, [page, search, statusFilter, clienteFilter, sucursalFilter])

  async function loadData() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      if (statusFilter) params.append('estatus', statusFilter)
      if (clienteFilter) params.append('cliente_id', clienteFilter)
      if (sucursalFilter) params.append('cliente_final_id', sucursalFilter)
      const data = await api.get(`/ordenes?${params}`)
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch { toast.error('Error al cargar órdenes') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
        <Link to="/ordenes/nueva" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Nueva orden
        </Link>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Folio, descripción, OT..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-10" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-field">
            <option value="">Todos los estatus</option>
            {Object.entries(ORDER_STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select value={clienteFilter} onChange={(e) => { setClienteFilter(e.target.value); setSucursalFilter(''); setPage(1) }} className="input-field">
            <option value="">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={sucursalFilter} onChange={(e) => { setSucursalFilter(e.target.value); setPage(1) }} className="input-field" disabled={!clienteFilter}>
            <option value="">{clienteFilter ? 'Todas las sucursales' : 'Selecciona cliente primero'}</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Sin órdenes" description="No hay órdenes de trabajo registradas"
          action={<Link to="/ordenes/nueva" className="btn-primary">Crear primera orden</Link>} />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Folio / OT Cliente</th>
                    <th className="table-header">Cliente</th>
                    <th className="table-header">Sucursal</th>
                    <th className="table-header">Descripción</th>
                    <th className="table-header">Estatus</th>
                    <th className="table-header">Monto</th>
                    <th className="table-header">Fecha</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="space-y-1">
                          <Link to={`/ordenes/${o.id}`} className="font-medium text-primary-600 hover:underline">{o.folio}</Link>
                          <p className="text-xs text-gray-500">OT Cliente: {o.ot_cliente || '—'}</p>
                        </div>
                      </td>
                      <td className="table-cell">{o.cliente_nombre}</td>
                      <td className="table-cell text-sm">{o.cliente_final_nombre || '—'}</td>
                      <td className="table-cell text-sm max-w-xs">
                        <span className="line-clamp-2" title={o.descripcion}>{o.descripcion}</span>
                      </td>
                      <td className="table-cell"><StatusBadge status={o.estatus} config={ORDER_STATUS_CONFIG} /></td>
                      <td className="table-cell">{o.monto_autorizado ? formatMoney(o.monto_autorizado) : '—'}</td>
                      <td className="table-cell text-sm">{formatDate(o.created_at)}</td>
                      <td className="table-cell">
                        <button onClick={() => navigate(`/ordenes/${o.id}`)} className="text-gray-400 hover:text-primary-600">
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
