import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../services/api'
import { calcularTotales, UNIDADES, formatMoney } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react'

export default function CotizacionFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ordenes, setOrdenes] = useState([])
  const [config, setConfig] = useState({ iva_default: 16, vigencia_default: 30, condiciones_default: '', neodata_monto: 50000 })

  const [form, setForm] = useState({
    orden_id: searchParams.get('orden_id') || '',
    iva_pct: 16,
    comision_pct: 30,
    vigencia_dias: 30,
    condiciones: '',
  })

  const [partidas, setPartidas] = useState([
    { descripcion: '', unidad: 'pza', cantidad: 1, precio_unitario: 0 },
  ])

  useEffect(() => {
    Promise.all([
      api.get('/ordenes?limit=200&estatus=levantamiento,cotizado').catch(() => ({ items: [] })),
      api.get('/configuracion').catch(() => ({})),
    ]).then(([ord, cfg]) => {
      setOrdenes(ord.items || [])
      if (cfg.iva_default) setConfig(prev => ({ ...prev, ...cfg }))
      if (!isEditing && cfg.iva_default) {
        setForm(prev => ({
          ...prev,
          iva_pct: parseFloat(cfg.iva_default) || 16,
          vigencia_dias: parseInt(cfg.vigencia_default) || 30,
          condiciones: cfg.condiciones_default || '',
        }))
      }
    })
    if (isEditing) loadItem()
  }, [id])

  // Load comision from selected order's client
  useEffect(() => {
    if (form.orden_id && !isEditing) {
      const orden = ordenes.find(o => o.id == form.orden_id)
      if (orden?.comision_pct !== undefined) {
        setForm(prev => ({ ...prev, comision_pct: orden.comision_pct }))
      }
    }
  }, [form.orden_id, ordenes])

  async function loadItem() {
    try {
      setLoading(true)
      const data = await api.get(`/cotizaciones/${id}`)
      setForm({
        orden_id: data.orden_id, iva_pct: data.iva_pct, comision_pct: data.comision_pct,
        vigencia_dias: data.vigencia_dias, condiciones: data.condiciones || '',
      })
      if (data.partidas?.length > 0) setPartidas(data.partidas.map(p => ({
        id: p.id, descripcion: p.descripcion, unidad: p.unidad, cantidad: p.cantidad, precio_unitario: p.precio_unitario,
      })))
    } catch { toast.error('Error al cargar cotización'); navigate('/cotizaciones') }
    finally { setLoading(false) }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handlePartidaChange(index, field, value) {
    setPartidas(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function addPartida() {
    setPartidas(prev => [...prev, { descripcion: '', unidad: 'pza', cantidad: 1, precio_unitario: 0 }])
  }

  function removePartida(index) {
    if (partidas.length <= 1) { toast.error('Debe haber al menos una partida'); return }
    setPartidas(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = partidas.reduce((sum, p) => sum + (parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0), 0)
  const totales = calcularTotales({ subtotal, ivaPct: form.iva_pct, comisionPct: form.comision_pct })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.orden_id) { toast.error('Selecciona una orden'); return }
    if (partidas.some(p => !p.descripcion.trim())) { toast.error('Todas las partidas necesitan descripción'); return }
    if (partidas.some(p => parseFloat(p.cantidad) <= 0 || parseFloat(p.precio_unitario) <= 0)) {
      toast.error('Cantidad y precio deben ser mayores a 0'); return
    }

    const payload = { ...form, partidas: partidas.map((p, i) => ({ ...p, orden: i + 1 })) }

    setSaving(true)
    try {
      if (isEditing) {
        await api.put(`/cotizaciones/${id}`, payload)
        toast.success('Cotización actualizada')
        navigate(`/cotizaciones/${id}`)
      } else {
        const created = await api.post('/cotizaciones', payload)
        toast.success('Cotización creada')
        navigate(`/cotizaciones/${created.id}`)
      }
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(isEditing ? `/cotizaciones/${id}` : '/cotizaciones')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Editar cotización' : 'Nueva cotización'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* General */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Datos generales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="label-field">Orden de trabajo *</label>
                  <select name="orden_id" value={form.orden_id} onChange={handleChange} className="input-field" required disabled={isEditing}>
                    <option value="">Seleccionar orden</option>
                    {ordenes.map(o => <option key={o.id} value={o.id}>{o.folio} — {o.cliente_nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Vigencia (días)</label>
                  <input name="vigencia_dias" type="number" min="1" value={form.vigencia_dias} onChange={handleChange} className="input-field" />
                </div>
              </div>
            </div>

            {/* Partidas */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Partidas</h2>
                <button type="button" onClick={addPartida} className="btn-secondary flex items-center gap-1 text-sm">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
              <div className="space-y-3">
                {partidas.map((p, i) => (
                  <div key={i} className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.8fr)_120px_120px_140px_110px_48px] gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-xs text-gray-500">Descripción</label>
                      <textarea
                        value={p.descripcion}
                        onChange={e => handlePartidaChange(i, 'descripcion', e.target.value)}
                        rows={3}
                        className="input-field text-sm resize-y min-h-[88px] leading-relaxed"
                        placeholder="Describe el alcance, materiales o notas de esta partida"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Unidad</label>
                      <select value={p.unidad} onChange={e => handlePartidaChange(i, 'unidad', e.target.value)} className="input-field text-sm">
                        {UNIDADES.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Cantidad</label>
                      <input type="number" min="0.01" step="0.01" value={p.cantidad}
                        onChange={e => handlePartidaChange(i, 'cantidad', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">P. Unitario</label>
                      <input type="number" min="0.01" step="0.01" value={p.precio_unitario}
                        onChange={e => handlePartidaChange(i, 'precio_unitario', e.target.value)} className="input-field text-sm" />
                    </div>
                    <div className="text-right">
                      <label className="text-xs text-gray-500">Importe</label>
                      <p className="text-sm font-medium py-2">{formatMoney((parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0))}</p>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => removePartida(i)} className="text-red-400 hover:text-red-600 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Condiciones */}
            <div className="card">
              <label className="label-field">Condiciones</label>
              <textarea name="condiciones" value={form.condiciones} onChange={handleChange} rows={4} className="input-field" />
            </div>
          </div>

          {/* Sidebar - Totals */}
          <div className="space-y-6">
            <div className="card sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Totales</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatMoney(totales.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">IVA</span>
                    <input name="iva_pct" type="number" min="0" max="100" step="0.01" value={form.iva_pct}
                      onChange={handleChange} className="w-16 input-field text-xs py-1 text-center" />
                    <span className="text-gray-400">%</span>
                  </div>
                  <span className="font-medium">{formatMoney(totales.iva)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-gray-900">{formatMoney(totales.total)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Comisión</span>
                      <input name="comision_pct" type="number" min="0" max="100" step="0.01" value={form.comision_pct}
                        onChange={handleChange} className="w-16 input-field text-xs py-1 text-center" />
                      <span className="text-gray-400">%</span>
                    </div>
                    <span className="font-medium text-red-600">-{formatMoney(totales.comision)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-base">
                  <span className="font-semibold text-green-700">Ingreso Real</span>
                  <span className="font-bold text-green-700">{formatMoney(totales.ingresoReal)}</span>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar cotización'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
