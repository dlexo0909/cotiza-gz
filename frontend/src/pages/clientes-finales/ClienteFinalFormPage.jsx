import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

export default function ClienteFinalFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({
    cliente_id: '', nombre: '', id_externo: '', direccion: '', ciudad: '',
    estado: '', codigo_postal: '', contacto: '', telefono: '', email: '', notas: '', activo: true,
  })

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
    if (isEditing) loadItem()
  }, [id])

  async function loadItem() {
    try {
      setLoading(true)
      const data = await api.get(`/clientes-finales/${id}`)
      setForm(data)
    } catch {
      toast.error('Error al cargar sucursal')
      navigate('/clientes-finales')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente_id) { toast.error('Selecciona un cliente'); return }
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }

    setSaving(true)
    try {
      if (isEditing) { await api.put(`/clientes-finales/${id}`, form); toast.success('Sucursal actualizada') }
      else { await api.post('/clientes-finales', form); toast.success('Sucursal creada') }
      navigate('/clientes-finales')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clientes-finales')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar sucursal' : 'Nueva sucursal'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-field">Cliente *</label>
            <select name="cliente_id" value={form.cliente_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">ID Externo</label>
            <input name="id_externo" value={form.id_externo} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Estado</label>
            <input name="estado" value={form.estado} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Código Postal</label>
            <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Contacto</label>
            <input name="contacto" value={form.contacto} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700">Activo</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/clientes-finales')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
