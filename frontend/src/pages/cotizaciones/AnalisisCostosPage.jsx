import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { COST_CATEGORIES, formatMoney } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

export default function AnalisisCostosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cotizacion, setCotizacion] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    try {
      const [cot, costos] = await Promise.all([
        api.get(`/cotizaciones/${id}`),
        api.get(`/cotizaciones/${id}/analisis-costos`),
      ])
      setCotizacion(cot)
      setItems(costos.length > 0 ? costos : [{ categoria: 'materiales', descripcion: '', costo_real: 0, costo_cliente: 0 }])
    } catch { toast.error('Error al cargar'); navigate(`/cotizaciones/${id}`) }
    finally { setLoading(false) }
  }

  function addItem() {
    setItems(prev => [...prev, { categoria: 'materiales', descripcion: '', costo_real: 0, costo_cliente: 0 }])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function handleChange(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/cotizaciones/${id}/analisis-costos`, { items: items.map((it, i) => ({ ...it, orden: i + 1 })) })
      toast.success('Análisis guardado')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>

  const totalReal = items.reduce((s, i) => s + (parseFloat(i.costo_real) || 0), 0)
  const totalCliente = items.reduce((s, i) => s + (parseFloat(i.costo_cliente) || 0), 0)
  const subtotal = cotizacion?.subtotal || 0
  const utilidad = subtotal - totalReal
  const utilidadPct = subtotal > 0 ? (utilidad / subtotal * 100) : 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/cotizaciones/${id}`)} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de costos</h1>
          <p className="text-sm text-gray-500">{cotizacion?.folio} — Subtotal: {formatMoney(subtotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Conceptos</h2>
              <button onClick={addItem} className="btn-secondary flex items-center gap-1 text-sm"><Plus className="w-3 h-3" /> Agregar</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 sm:col-span-3">
                    <label className="text-xs text-gray-500">Categoría</label>
                    <select value={item.categoria} onChange={e => handleChange(i, 'categoria', e.target.value)} className="input-field text-sm">
                      {COST_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <label className="text-xs text-gray-500">Descripción</label>
                    <input value={item.descripcion} onChange={e => handleChange(i, 'descripcion', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <label className="text-xs text-gray-500">Costo real</label>
                    <input type="number" min="0" step="0.01" value={item.costo_real} onChange={e => handleChange(i, 'costo_real', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <label className="text-xs text-gray-500">Costo cliente</label>
                    <input type="number" min="0" step="0.01" value={item.costo_cliente} onChange={e => handleChange(i, 'costo_cliente', e.target.value)} className="input-field text-sm" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar análisis'}
              </button>
            </div>
          </div>
        </div>

        <div className="card h-fit sticky top-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal cotización</span><span className="font-medium">{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total costos reales</span><span className="font-medium text-red-600">{formatMoney(totalReal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total costos cliente</span><span>{formatMoney(totalCliente)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Utilidad real</span>
              <span className={utilidad >= 0 ? 'text-green-700' : 'text-red-700'}>{formatMoney(utilidad)} ({utilidadPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
