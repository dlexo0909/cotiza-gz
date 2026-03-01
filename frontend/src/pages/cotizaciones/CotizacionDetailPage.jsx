import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney, QUOTE_STATUS_CONFIG, UNIDADES } from '../../utils/helpers'
import StatusBadge from '../../components/ui/StatusBadge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import { ArrowLeft, Edit, FileDown, Send, Check, X, RotateCcw, Receipt, CreditCard, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CotizacionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cot, setCot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState(null) // 'enviar'|'autorizar'|'rechazar'|'revertir'|'factura'|'cobro'
  const [actionLoading, setActionLoading] = useState(false)
  const [facturaForm, setFacturaForm] = useState({ numero_factura: '', fecha_facturacion: '' })
  const [cobroForm, setCobroForm] = useState({ fecha_cobro: '' })
  useEffect(() => { loadData() }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const data = await api.get(`/cotizaciones/${id}`)
      setCot(data)
    } catch { toast.error('Error al cargar cotización'); navigate('/cotizaciones') }
    finally { setLoading(false) }
  }

  async function handleAction(action, extraData = {}) {
    setActionLoading(true)
    try {
      await api.patch(`/cotizaciones/${id}/estatus`, { accion: action, ...extraData })
      toast.success('Acción realizada')
      setActionModal(null)
      loadData()
    } catch (err) { toast.error(err.message) }
    finally { setActionLoading(false) }
  }

  if (loading) return <LoadingSpinner />
  if (!cot) return null

  const isBorrador = cot.estatus === 'borrador'
  const isEnviada = cot.estatus === 'enviada'
  const isAutorizada = cot.estatus === 'autorizada'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cotizaciones')} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{cot.folio}</h1>
          <p className="text-sm text-gray-500">Orden: <Link to={`/ordenes/${cot.orden_id}`} className="text-primary-600 hover:underline">{cot.orden_folio}</Link></p>
        </div>
        <StatusBadge status={cot.estatus} config={QUOTE_STATUS_CONFIG} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Partidas */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Partidas</h2>
              {isBorrador && (
                <Link to={`/cotizaciones/${id}/editar`} className="btn-secondary flex items-center gap-1 text-sm">
                  <Edit className="w-3 h-3" /> Editar
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header">#</th>
                    <th className="table-header">Descripción</th>
                    <th className="table-header">Unidad</th>
                    <th className="table-header text-right">Cant.</th>
                    <th className="table-header text-right">P. Unit.</th>
                    <th className="table-header text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(cot.partidas || []).map((p, i) => (
                    <tr key={p.id}>
                      <td className="table-cell text-gray-400">{i + 1}</td>
                      <td className="table-cell">{p.descripcion}</td>
                      <td className="table-cell">{UNIDADES.find(u => u.value === p.unidad)?.label || p.unidad}</td>
                      <td className="table-cell text-right">{p.cantidad}</td>
                      <td className="table-cell text-right">{formatMoney(p.precio_unitario)}</td>
                      <td className="table-cell text-right font-medium">{formatMoney(p.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Información</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Vigencia</dt><dd>{cot.vigencia_dias} días — {formatDate(cot.fecha_vigencia)}</dd></div>
              <div><dt className="text-gray-500">Factura</dt><dd>{cot.numero_factura || '—'} {cot.fecha_facturacion ? `(${formatDate(cot.fecha_facturacion)})` : ''}</dd></div>
              <div><dt className="text-gray-500">Fecha cobro</dt><dd>{formatDate(cot.fecha_cobro)}</dd></div>
              <div><dt className="text-gray-500">Fecha autorización</dt><dd>{formatDate(cot.fecha_autorizacion)}</dd></div>
              {cot.condiciones && <div className="sm:col-span-2"><dt className="text-gray-500">Condiciones</dt><dd className="whitespace-pre-wrap">{cot.condiciones}</dd></div>}
            </dl>
          </div>

          {/* Neodata - referencia externa (OneDrive) */}
          {cot.subtotal >= 50000 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold">Neodata</h2>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Esta cotización requiere archivo Neodata (monto ≥ $50,000).
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Guardar archivo en <strong>OneDrive</strong> en la carpeta: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">{cot.folio}</code>
                </p>
                {cot.neodata_archivo && (
                  <p className="text-xs text-green-700 mt-2">✓ Referencia guardada: {cot.neodata_original || cot.neodata_archivo}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen financiero</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(cot.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">IVA ({cot.iva_pct}%)</span><span>{formatMoney(cot.iva)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>{formatMoney(cot.total)}</span></div>
              <div className="border-t pt-2 flex justify-between text-red-600"><span>Comisión ({cot.comision_pct}%)</span><span>-{formatMoney(cot.comision)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-green-700"><span>Ingreso Real</span><span>{formatMoney(cot.ingreso_real)}</span></div>
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Acciones</h3>
            <div className="space-y-2">
              {isBorrador && (
                <button onClick={() => handleAction('enviar')} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  <Send className="w-4 h-4" /> Marcar como enviada
                </button>
              )}
              {isEnviada && (
                <>
                  <button onClick={() => handleAction('autorizar')} className="btn-success w-full flex items-center justify-center gap-2 text-sm">
                    <Check className="w-4 h-4" /> Autorizar
                  </button>
                  <button onClick={() => handleAction('rechazar')} className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
                    <X className="w-4 h-4" /> Rechazar
                  </button>
                </>
              )}
              {isAutorizada && !cot.numero_factura && (
                <button onClick={() => setActionModal('factura')} className="btn-warning w-full flex items-center justify-center gap-2 text-sm">
                  <Receipt className="w-4 h-4" /> Registrar factura
                </button>
              )}
              {cot.numero_factura && !cot.fecha_cobro && (
                <button onClick={() => setActionModal('cobro')} className="btn-success w-full flex items-center justify-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" /> Registrar cobro
                </button>
              )}
              {cot.estatus !== 'borrador' && (
                <button onClick={() => handleAction('revertir')} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <RotateCcw className="w-4 h-4" /> Revertir a borrador
                </button>
              )}

              <Link to={`/cotizaciones/${id}/pdf`} target="_blank" className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                <FileDown className="w-4 h-4" /> Ver PDF
              </Link>

              <Link to={`/cotizaciones/${id}/analisis-costos`} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                Análisis de costos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Factura Modal */}
      <Modal isOpen={actionModal === 'factura'} onClose={() => setActionModal(null)} title="Registrar factura">
        <div className="space-y-4">
          <div>
            <label className="label-field">Número de factura *</label>
            <input value={facturaForm.numero_factura} onChange={e => setFacturaForm(p => ({ ...p, numero_factura: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Fecha de facturación *</label>
            <input type="date" value={facturaForm.fecha_facturacion} onChange={e => setFacturaForm(p => ({ ...p, fecha_facturacion: e.target.value }))} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={() => handleAction('facturar', facturaForm)} disabled={actionLoading} className="btn-primary">
              {actionLoading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cobro Modal */}
      <Modal isOpen={actionModal === 'cobro'} onClose={() => setActionModal(null)} title="Registrar cobro">
        <div className="space-y-4">
          <div>
            <label className="label-field">Fecha de cobro *</label>
            <input type="date" value={cobroForm.fecha_cobro} onChange={e => setCobroForm({ fecha_cobro: e.target.value })} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setActionModal(null)} className="btn-secondary">Cancelar</button>
            <button onClick={() => handleAction('cobrar', cobroForm)} disabled={actionLoading} className="btn-success">
              {actionLoading ? 'Guardando...' : 'Registrar cobro'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
