import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDate, formatMoney, QUOTE_STATUS_CONFIG, UNIDADES } from '../../utils/helpers'

export default function CotizacionPdfPage() {
  const { id } = useParams()
  const [cot, setCot] = useState(null)
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/cotizaciones/${id}`),
      api.get('/configuracion'),
    ])
      .then(([cotData, configData]) => {
        setCot(cotData)
        setConfig(configData)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cargando cotización...</p>
      </div>
    )
  }

  if (error || !cot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error || 'Cotización no encontrada'}</p>
      </div>
    )
  }

  const statusLabel = QUOTE_STATUS_CONFIG[cot.estatus]?.label || cot.estatus

  return (
    <>
      {/* Print button — hidden on print */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow text-sm font-medium hover:bg-blue-700"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow text-sm font-medium hover:bg-gray-300"
        >
          Cerrar
        </button>
      </div>

      {/* Print area */}
      <div className="pdf-page max-w-4xl mx-auto p-10 text-sm text-gray-800 font-sans">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
          {/* Logo + datos empresa */}
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-20 w-auto object-contain"
              onError={e => { e.target.style.display = 'none' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {config.empresa_nombre || 'Mi Empresa'}
              </h1>
              {config.empresa_representante && (
                <p className="text-sm text-gray-600 mt-0.5">{config.empresa_representante}</p>
              )}
              {config.empresa_rfc && (
                <p className="text-xs text-gray-500 mt-0.5">RFC: {config.empresa_rfc}</p>
              )}
              {config.empresa_direccion && (
                <p className="text-xs text-gray-500">{config.empresa_direccion}</p>
              )}
              {(config.empresa_telefono || config.empresa_email) && (
                <p className="text-xs text-gray-500">
                  {config.empresa_telefono}{config.empresa_telefono && config.empresa_email ? ' · ' : ''}{config.empresa_email}
                </p>
              )}
            </div>
          </div>
          {/* Folio + estatus */}
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-700">COTIZACIÓN</div>
            <div className="text-xl font-semibold text-gray-700 mt-1">{cot.folio}</div>
            <div className="mt-2">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                cot.estatus === 'autorizada' ? 'bg-green-100 text-green-800' :
                cot.estatus === 'enviada'    ? 'bg-blue-100 text-blue-800' :
                cot.estatus === 'rechazada'  ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-700'
              }`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Order info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cliente</p>
            <p className="font-semibold text-gray-800">{cot.cliente_nombre || '—'}</p>
            {cot.cliente_final_nombre && (
              <p className="text-sm text-gray-600 mt-1">Sucursal: <strong>{cot.cliente_final_nombre}</strong></p>
            )}
          </div>
          <div className="bg-gray-50 rounded p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Orden de trabajo</p>
            <p className="font-semibold text-gray-800">{cot.orden_folio || '—'}</p>
            {cot.orden_ot_cliente && (
              <p className="text-sm text-gray-700 mt-1">OT Cliente: <strong>{cot.orden_ot_cliente}</strong></p>
            )}
            {cot.orden_descripcion && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{cot.orden_descripcion}</p>
            )}
            {cot.orden_direccion_obra && (
              <p className="text-xs text-gray-500 mt-1">📍 {cot.orden_direccion_obra}</p>
            )}
          </div>
        </div>

        {/* Dates row */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-xs">
          <div>
            <span className="text-gray-500">Fecha de emisión:</span>{' '}
            <span className="font-medium">{formatDate(cot.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500">Vigencia:</span>{' '}
            <span className="font-medium">{cot.vigencia_dias} días — {formatDate(cot.fecha_vigencia)}</span>
          </div>
          {cot.fecha_autorizacion && (
            <div>
              <span className="text-gray-500">Autorizada:</span>{' '}
              <span className="font-medium">{formatDate(cot.fecha_autorizacion)}</span>
            </div>
          )}
        </div>

        {/* Partidas */}
        <table className="w-full mb-8 border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-center w-16">Unidad</th>
              <th className="px-3 py-2 text-right w-16">Cant.</th>
              <th className="px-3 py-2 text-right w-28">P. Unitario</th>
              <th className="px-3 py-2 text-right w-28">Importe</th>
            </tr>
          </thead>
          <tbody>
            {(cot.partidas || []).map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                <td className="px-3 py-2 whitespace-pre-wrap break-words align-top leading-relaxed">{p.descripcion}</td>
                <td className="px-3 py-2 text-center text-gray-600">
                  {UNIDADES.find(u => u.value === p.unidad)?.label || p.unidad}
                </td>
                <td className="px-3 py-2 text-right">{p.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatMoney(p.precio_unitario)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatMoney(p.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatMoney(cot.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">IVA ({cot.iva_pct}%)</span>
              <span>{formatMoney(cot.iva)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-base border-t-2 border-gray-800">
              <span>Total</span>
              <span>{formatMoney(cot.total)}</span>
            </div>
          </div>
        </div>

        {/* Condiciones */}
        {cot.condiciones && (
          <div className="mb-8 bg-gray-50 rounded p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Condiciones generales</p>
            <p className="text-gray-700 whitespace-pre-wrap text-xs leading-relaxed">{cot.condiciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between text-xs text-gray-400">
          <span>{config.empresa_nombre} — {config.empresa_rfc}</span>
          <span>Cotización válida por {cot.vigencia_dias} días a partir de su emisión</span>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .pdf-page {
            max-width: 100%;
            padding: 15mm 15mm;
            font-size: 11pt;
          }
        }
      `}</style>
    </>
  )
}
