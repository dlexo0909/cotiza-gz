import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import { UserCog, Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function UsuariosListPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    try {
      const data = await api.get('/usuarios')
      setUsers(data.items || [])
    } catch { toast.error('Error al cargar usuarios') }
    finally { setLoading(false) }
  }

  async function toggleActive(userId) {
    if (userId === profile?.id) { toast.error('No puedes desactivarte a ti mismo'); return }
    try {
      await api.patch(`/usuarios/${userId}/toggle`)
      toast.success('Estado actualizado')
      loadUsers()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <Link to="/usuarios/nuevo" className="btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Nuevo usuario
        </Link>
      </div>

      {loading ? <LoadingSpinner /> : users.length === 0 ? (
        <EmptyState icon={UserCog} title="Sin usuarios" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Rol</th>
                  <th className="table-header">Último acceso</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{u.nombre}</td>
                    <td className="table-cell">{u.email}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        u.rol === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                      }`}>{u.rol}</span>
                    </td>
                    <td className="table-cell text-sm">{formatDate(u.ultimo_acceso)}</td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <Link to={`/usuarios/${u.id}`} className="text-gray-400 hover:text-primary-600 text-sm">Editar</Link>
                        {u.id !== profile?.id && (
                          <button onClick={() => toggleActive(u.id)} className="text-gray-400 hover:text-yellow-600">
                            {u.activo ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                          </button>
                        )}
                      </div>
                    </td>
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
