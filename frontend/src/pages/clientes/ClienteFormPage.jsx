import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { validarRFC } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

export default function ClienteFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    contacto: '',
    direccion: '',
    comision_pct: 30,
    notas: '',
    activo: true,
  })

  useEffect(() => {
    if (isEditing) loadCliente()
  }, [id])

  async function loadCliente() {
    try {
      setLoading(true)
      const data = await api.get(`/clientes/${id}`)
      setForm(data)
    } catch (err) {
      toast.error('Error al cargar cliente')
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    if (form.rfc && !validarRFC(form.rfc)) {
      toast.error('RFC inválido')
      return
    }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/clientes/${id}`, form)
        toast.success('Cliente actualizado')
      } else {
        await api.post('/clientes', form)
        toast.success('Cliente creado')
      }
      navigate('/clientes')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/clientes')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-field">Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label className="label-field">RFC</label>
            <input name="rfc" value={form.rfc} onChange={handleChange} className="input-field" placeholder="XXXX000000XXX" />
          </div>

          <div>
            <label className="label-field">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="label-field">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="label-field">Contacto</label>
            <input name="contacto" value={form.contacto} onChange={handleChange} className="input-field" />
          </div>

          <div className="sm:col-span-2">
            <label className="label-field">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="input-field" />
          </div>

          <div>
            <label className="label-field">Comisión (%)</label>
            <input name="comision_pct" type="number" min="0" max="100" step="0.01" value={form.comision_pct} onChange={handleChange} className="input-field" />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700">Cliente activo</span>
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="label-field">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="input-field" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/clientes')} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
