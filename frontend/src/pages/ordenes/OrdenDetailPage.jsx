import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney, ORDER_STATUS_CONFIG, QUOTE_STATUS_CONFIG, ORDER_TRANSITIONS } from '../../utils/helpers'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { ArrowLeft, Edit, FileText, Plus, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrdenDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orden, setOrden] = useState(null)
  const [cotizaciones, setCotizaciones] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusModal, setStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [comentario, setComentario] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [ord, cots, hist] = await Promise.all([
        api.get(`/ordenes/${id}`),
        api.get(`/ordenes/${id}/cotizaciones`),
        api.get(`/ordenes/${id}/historial`),
      ])
      setOrden(ord)
      setCotizaciones(cots)
      setHistorial(hist)
    } catch { toast.error('Error al cargar orden'); navigate('/ordenes') }
    finally { setLoading(false) }
  }

  async function handleStatusChange() {
    if (!newStatus) return
    setChangingStatus(true)
    try {
      await api.patch(`/ordenes/${id}/estatus`, { estatus: newStatus, comentario })
      toast.success('Estatus actualizado')
      setStatusModal(false)
      setComentario('')
      loadData()
    } catch (err) { toast.error(err.message) }
    finally { setChangingStatus(false) }
  }

  if (loading) return <LoadingSpinner />
  if (!orden) return null

  const transitions = ORDER_TRANSITIONS[orden.estatus] || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/ordenes')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{orden.folio}</h1>
          <p className="text-sm text-gray-500">{orden.cliente_nombre} {orden.cliente_final_nombre ? `→ ${orden.cliente_final_nombre}` : ''}</p>
        </div>
        <StatusBadge status={orden.estatus} config={ORDER_STATUS_CONFIG} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Información</h2>
              <Link to={`/ordenes/${id}/editar`} className="btn-secondary flex items-center gap-1 text-sm">
                <Edit className="w-3 h-3" /> Editar
              </Link>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">OT Cliente</dt><dd className="font-medium">{orden.ot_cliente || '—'}</dd></div>
              <div><dt className="text-gray-500">Monto autorizado</dt><dd className="font-medium">{orden.monto_autorizado ? formatMoney(orden.monto_autorizado) : '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-gray-500">Descripción</dt><dd className="font-medium">{orden.descripcion}</dd></div>
              <div className="sm:col-span-2"><dt className="text-gray-500">Dirección de obra</dt><dd className="font-medium">{orden.direccion_obra || '—'}</dd></div>
              <div><dt className="text-gray-500">F. Levantamiento</dt><dd>{formatDate(orden.fecha_levantamiento)}</dd></div>
              <div><dt className="text-gray-500">F. Inicio</dt><dd>{formatDate(orden.fecha_inicio)}</dd></div>
              <div><dt className="text-gray-500">F. Fin</dt><dd>{formatDate(orden.fecha_fin)}</dd></div>
              <div><dt className="text-gray-500">Creada</dt><dd>{formatDate(orden.created_at)}</dd></div>
            </dl>
            {orden.notas && <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{orden.notas}</div>}
          </div>

          {/* Cotizaciones */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Cotizaciones</h2>
              <Link to={`/cotizaciones/nueva?orden_id=${id}`} className="btn-primary flex items-center gap-1 text-sm">
                <Plus className="w-3 h-3" /> Nueva cotización
              </Link>
            </div>
            {cotizaciones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin cotizaciones</p>
            ) : (
              <div className="space-y-3">
                {cotizaciones.map(c => (
                  <Link key={c.id} to={`/cotizaciones/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="font-medium text-sm">{c.folio}</span>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Subtotal: {formatMoney(c.subtotal)}</span>
                        <span>Total: {formatMoney(c.total)}</span>
                        <span className="text-green-600">Ingreso: {formatMoney(c.ingreso_real)}</span>
                      </div>
                    </div>
                    <StatusBadge status={c.estatus} config={QUOTE_STATUS_CONFIG} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {transitions.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Cambiar estatus</h3>
              <div className="space-y-2">
                {transitions.map(t => (
                  <button key={t} onClick={() => { setNewStatus(t); setStatusModal(true) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      t === 'cancelado' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                    → {ORDER_STATUS_CONFIG[t]?.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Historial
            </h3>
            {historial.length === 0 ? (
              <p className="text-xs text-gray-400">Sin cambios registrados</p>
            ) : (
              <div className="space-y-3">
                {historial.map((h, i) => (
                  <div key={i} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700">
                        <span className="font-medium">{h.estatus_anterior}</span> → <span className="font-medium">{h.estatus_nuevo}</span>
                      </p>
                      {h.comentario && <p className="text-gray-500 mt-0.5">{h.comentario}</p>}
                      <p className="text-gray-400 mt-0.5">{formatDate(h.created_at)} — {h.usuario_nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Cambiar estatus">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cambiar de <strong>{ORDER_STATUS_CONFIG[orden.estatus]?.label}</strong> a{' '}
            <strong>{ORDER_STATUS_CONFIG[newStatus]?.label}</strong>
          </p>
          <div>
            <label className="label-field">Comentario (opcional)</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3} className="input-field" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setStatusModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleStatusChange} disabled={changingStatus}
              className={newStatus === 'cancelado' ? 'btn-danger' : 'btn-primary'}>
              {changingStatus ? 'Cambiando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
