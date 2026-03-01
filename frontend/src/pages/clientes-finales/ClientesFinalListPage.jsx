import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Users, Plus, Search, Edit } from 'lucide-react'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ClientesFinalListPage() {
  const [items, setItems] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [clienteFilter, setClienteFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
  }, [])

  useEffect(() => {
    loadData()
  }, [page, search, clienteFilter])

  async function loadData() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      if (clienteFilter) params.append('cliente_id', clienteFilter)
      const data = await api.get(`/clientes-finales?${params}`)
      setItems(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error('Error al cargar sucursales')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sucursales / Clientes Finales</h1>
        <Link to="/clientes-finales/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Nueva sucursal
        </Link>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre, ID externo, ciudad..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-10" />
          </div>
          <select value={clienteFilter} onChange={(e) => { setClienteFilter(e.target.value); setPage(1) }} className="input-field">
            <option value="">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? (
        <EmptyState icon={Users} title="Sin sucursales" description="Aún no hay sucursales registradas"
          action={<Link to="/clientes-finales/nuevo" className="btn-primary">Agregar sucursal</Link>} />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Nombre</th>
                    <th className="table-header">Cliente</th>
                    <th className="table-header">ID Externo</th>
                    <th className="table-header">Ciudad</th>
                    <th className="table-header">Estado</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium text-gray-900">{s.nombre}</td>
                      <td className="table-cell">{s.cliente_nombre}</td>
                      <td className="table-cell">{s.id_externo || '—'}</td>
                      <td className="table-cell">{s.ciudad || '—'}</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button onClick={() => navigate(`/clientes-finales/${s.id}`)} className="text-gray-400 hover:text-primary-600">
                          <Edit className="w-4 h-4" />
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
