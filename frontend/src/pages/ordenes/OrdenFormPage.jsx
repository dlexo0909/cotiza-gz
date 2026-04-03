import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

export default function OrdenFormPage() {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState([])
  const [sucursales, setSucursales] = useState([])
  const [form, setForm] = useState({
    cliente_id: '', cliente_final_id: '', ot_cliente: '', estatus_tririga: '', descripcion: '',
    direccion_obra: '', fecha_levantamiento: '', fecha_inicio: '', fecha_fin: '', notas: '',
  })

  useEffect(() => {
    api.get('/clientes?limit=200').then(d => setClientes(d.items || [])).catch(() => {})
    if (isEditing) loadItem()
  }, [id])

  useEffect(() => {
    if (form.cliente_id) {
      api.get(`/clientes-finales?cliente_id=${form.cliente_id}&limit=200`)
        .then(d => setSucursales(d.items || []))
        .catch(() => setSucursales([]))
    } else {
      setSucursales([])
    }
  }, [form.cliente_id])

  async function loadItem() {
    try {
      setLoading(true)
      const data = await api.get(`/ordenes/${id}`)
      setForm({
        cliente_id: data.cliente_id || '', cliente_final_id: data.cliente_final_id || '',
        ot_cliente: data.ot_cliente || '', estatus_tririga: data.estatus_tririga || '', descripcion: data.descripcion || '',
        direccion_obra: data.direccion_obra || '',
        fecha_levantamiento: data.fecha_levantamiento?.substring(0, 10) || '',
        fecha_inicio: data.fecha_inicio?.substring(0, 10) || '',
        fecha_fin: data.fecha_fin?.substring(0, 10) || '', notas: data.notas || '',
      })
    } catch { toast.error('Error al cargar orden'); navigate('/ordenes') }
    finally { setLoading(false) }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'cliente_id') setForm(prev => ({ ...prev, cliente_final_id: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente_id) { toast.error('Selecciona un cliente'); return }
    if (!form.descripcion.trim()) { toast.error('La descripción es requerida'); return }

    setSaving(true)
    try {
      if (isEditing) { await api.put(`/ordenes/${id}`, form); toast.success('Orden actualizada') }
      else { const created = await api.post('/ordenes', form); toast.success('Orden creada'); navigate(`/ordenes/${created.id}`); return }
      navigate(`/ordenes/${id}`)
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(isEditing ? `/ordenes/${id}` : '/ordenes')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar orden' : 'Nueva orden de trabajo'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Cliente *</label>
            <select name="cliente_id" value={form.cliente_id} onChange={handleChange} className="input-field" required>
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Sucursal</label>
            <select name="cliente_final_id" value={form.cliente_final_id} onChange={handleChange} className="input-field">
              <option value="">Seleccionar sucursal</option>
              {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">OT Cliente</label>
            <input name="ot_cliente" value={form.ot_cliente} onChange={handleChange} className="input-field" placeholder="Referencia del cliente" />
          </div>
          <div>
            <label className="label-field">Status Tririga</label>
            <input name="estatus_tririga" value={form.estatus_tririga} onChange={handleChange} className="input-field" placeholder="Estatus reportado por el cliente" />
          </div>
          <div>
            <label className="label-field">Fecha levantamiento</label>
            <input name="fecha_levantamiento" type="date" value={form.fecha_levantamiento} onChange={handleChange} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Descripción *</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} className="input-field" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Dirección de obra</label>
            <input name="direccion_obra" value={form.direccion_obra} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Fecha inicio</label>
            <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="label-field">Fecha fin</label>
            <input name="fecha_fin" type="date" value={form.fecha_fin} onChange={handleChange} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={3} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate(isEditing ? `/ordenes/${id}` : '/ordenes')} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
