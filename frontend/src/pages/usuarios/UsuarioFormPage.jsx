import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

export default function UsuarioFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', password_confirm: '', rol: 'usuario' })

  useEffect(() => {
    if (isEditing) loadUser()
  }, [id])

  async function loadUser() {
    try {
      setLoading(true)
      const data = await api.get(`/usuarios/${id}`)
      setForm({ nombre: data.nombre, email: data.email, password: '', password_confirm: '', rol: data.rol })
    } catch { toast.error('Error al cargar usuario'); navigate('/usuarios') }
    finally { setLoading(false) }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim()) { toast.error('Nombre y email son requeridos'); return }
    if (!isEditing && !form.password) { toast.error('La contraseña es requerida'); return }
    if (form.password && form.password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    if (form.password && form.password !== form.password_confirm) { toast.error('Las contraseñas no coinciden'); return }

    const payload = { nombre: form.nombre, email: form.email, rol: form.rol }
    if (form.password) payload.password = form.password

    setSaving(true)
    try {
      if (isEditing) { await api.put(`/usuarios/${id}`, payload); toast.success('Usuario actualizado') }
      else { await api.post('/usuarios', payload); toast.success('Usuario creado') }
      navigate('/usuarios')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/usuarios')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar usuario' : 'Nuevo usuario'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="label-field">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">{isEditing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" minLength={6}
              required={!isEditing} />
          </div>
          {form.password && (
            <div>
              <label className="label-field">Confirmar contraseña</label>
              <input name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} className="input-field" />
            </div>
          )}
          <div>
            <label className="label-field">Rol</label>
            <select name="rol" value={form.rol} onChange={handleChange} className="input-field">
              <option value="usuario">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/usuarios')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
