import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { Building2, Plus, Search, Edit, Eye } from 'lucide-react'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ClientesListPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    loadClientes()
  }, [page, search])

  async function loadClientes() {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page, limit: 20 })
      if (search) params.append('search', search)
      const data = await api.get(`/clientes?${params}`)
      setClientes(data.items)
      setTotalPages(data.totalPages)
    } catch (err) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Link to="/clientes/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, RFC o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-10"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : clientes.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin clientes"
          description="Aún no hay clientes registrados"
          action={
            <Link to="/clientes/nuevo" className="btn-primary">
              Agregar primer cliente
            </Link>
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Nombre</th>
                    <th className="table-header">RFC</th>
                    <th className="table-header">Contacto</th>
                    <th className="table-header">Comisión</th>
                    <th className="table-header">Estado</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clientes.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-gray-900">{c.nombre}</td>
                      <td className="table-cell">{c.rfc || '—'}</td>
                      <td className="table-cell">
                        <div>{c.contacto || '—'}</div>
                        <div className="text-xs text-gray-400">{c.email || ''}</div>
                      </td>
                      <td className="table-cell">{c.comision_pct}%</td>
                      <td className="table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button onClick={() => navigate(`/clientes/${c.id}`)} className="text-gray-400 hover:text-primary-600">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
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
