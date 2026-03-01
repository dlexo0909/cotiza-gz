import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, serverError, parseQuery } from '../utils/response.js'

// Reporte de ingresos por período
export async function reporteIngresos(event) {
  await requireAuth(event)
  const { desde, hasta, cliente_id } = parseQuery(event)

  const year = new Date().getFullYear()
  const fechaDesde = desde || `${year}-01-01`
  const fechaHasta = hasta || `${year}-12-31`

  let query = supabase.from('v_reporte_ingresos')
    .select('*')
    .gte('fecha_autorizacion', fechaDesde)
    .lte('fecha_autorizacion', fechaHasta)
    .order('fecha_autorizacion', { ascending: false })

  if (cliente_id) query = query.eq('cliente_id', cliente_id)

  const { data, error } = await query
  if (error) return serverError(error.message)

  const summary = {
    total_cotizado: data.reduce((s, r) => s + parseFloat(r.total || 0), 0),
    total_comision: data.reduce((s, r) => s + parseFloat(r.comision || 0), 0),
    total_ingreso_real: data.reduce((s, r) => s + parseFloat(r.ingreso_real || 0), 0),
    total_cobrado: data.filter(r => r.fecha_cobro).reduce((s, r) => s + parseFloat(r.total || 0), 0),
    cantidad: data.length,
  }

  return ok({ items: data, summary })
}

// Reporte por cliente
export async function reportePorCliente(event) {
  await requireAuth(event)
  const { desde, hasta } = parseQuery(event)

  const year = new Date().getFullYear()
  const fechaDesde = desde || `${year}-01-01`
  const fechaHasta = hasta || `${year}-12-31`

  const { data, error } = await supabase.from('v_reporte_ingresos')
    .select('*')
    .gte('fecha_autorizacion', fechaDesde)
    .lte('fecha_autorizacion', fechaHasta)

  if (error) return serverError(error.message)

  // Group by client
  const byClient = {}
  for (const row of (data || [])) {
    const cid = row.cliente_id
    if (!byClient[cid]) {
      byClient[cid] = {
        cliente_id: cid, cliente_nombre: row.cliente_nombre,
        total: 0, comision: 0, ingreso_real: 0, cobrado: 0, cantidad: 0,
      }
    }
    byClient[cid].total += parseFloat(row.total || 0)
    byClient[cid].comision += parseFloat(row.comision || 0)
    byClient[cid].ingreso_real += parseFloat(row.ingreso_real || 0)
    if (row.fecha_cobro) byClient[cid].cobrado += parseFloat(row.total || 0)
    byClient[cid].cantidad++
  }

  const clientes = Object.values(byClient).sort((a, b) => b.total - a.total)

  return ok({ clientes })
}

// Reporte de estado de órdenes (pipeline)
export async function reporteOrdenes(event) {
  await requireAuth(event)
  const { desde, hasta, cliente_id } = parseQuery(event)

  let query = supabase.from('v_ordenes_completas').select('*')
  if (desde) query = query.gte('fecha_creacion', desde)
  if (hasta) query = query.lte('fecha_creacion', hasta)
  if (cliente_id) query = query.eq('cliente_id', cliente_id)

  const { data, error } = await query.order('fecha_creacion', { ascending: false })
  if (error) return serverError(error.message)

  // Group by status
  const statuses = ['levantamiento', 'cotizado', 'autorizado', 'en_proceso', 'terminado', 'facturado', 'cobrado', 'cancelado']
  const pipeline = {}
  for (const s of statuses) pipeline[s] = { count: 0, total: 0 }

  for (const ord of (data || [])) {
    if (pipeline[ord.estatus]) {
      pipeline[ord.estatus].count++
      pipeline[ord.estatus].total += parseFloat(ord.monto_autorizado || 0)
    }
  }

  return ok({ pipeline, items: data })
}

// Cuentas por cobrar
export async function reportePorCobrar(event) {
  await requireAuth(event)

  // Cotizaciones facturadas pero no cobradas
  const { data, error } = await supabase.from('v_cotizaciones_completas')
    .select('*')
    .not('numero_factura', 'is', null)
    .is('fecha_cobro', null)
    .order('fecha_facturacion', { ascending: true })

  if (error) return serverError(error.message)

  // Calculate aging
  const today = new Date()
  const items = (data || []).map(row => {
    const factDate = new Date(row.fecha_facturacion)
    const diasVencido = Math.floor((today - factDate) / (1000 * 60 * 60 * 24))
    return { ...row, dias_vencido: diasVencido }
  })

  const summary = {
    total_por_cobrar: items.reduce((s, r) => s + parseFloat(r.total || 0), 0),
    cantidad: items.length,
    vencidas_30: items.filter(i => i.dias_vencido > 30).length,
    vencidas_60: items.filter(i => i.dias_vencido > 60).length,
    vencidas_90: items.filter(i => i.dias_vencido > 90).length,
  }

  return ok({ items, summary })
}
