import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, serverError, parseQuery } from '../utils/response.js'

// Reporte de ingresos por período
export async function reporteIngresos(event) {
  await requireAuth(event)
  const { year: yearParam, month: monthParam, cliente_id } = parseQuery(event)

  const year = parseInt(yearParam) || new Date().getFullYear()
  const month = monthParam ? parseInt(monthParam) : null

  let fechaDesde, fechaHasta
  if (month) {
    const lastDay = new Date(year, month, 0).getDate()
    fechaDesde = `${year}-${String(month).padStart(2, '0')}-01`
    fechaHasta = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  } else {
    fechaDesde = `${year}-01-01`
    fechaHasta = `${year}-12-31`
  }

  const { data, error } = await supabase.from('v_cotizaciones_completas')
    .select('*')
    .not('fecha_cobro', 'is', null)
    .gte('fecha_cobro', fechaDesde)
    .lte('fecha_cobro', fechaHasta)
    .order('fecha_cobro', { ascending: false })

  if (error) return serverError(error.message)

  // Filter by cliente_id in JS (view may not expose cliente_id yet)
  let rows = data || []
  if (cliente_id) {
    const cid = parseInt(cliente_id)
    rows = rows.filter(r => r.cliente_id === cid || String(r.cliente_id) === String(cid))
  }

  // Summary
  const resumen = {
    cobradas: rows.length,
    total_facturado: rows.reduce((s, r) => s + parseFloat(r.monto_factura ?? r.ingreso_real ?? 0), 0),
    total_cobrado: rows.reduce((s, r) => s + parseFloat(r.monto_cobrado ?? r.monto_factura ?? r.ingreso_real ?? 0), 0),
    comision: rows.reduce((s, r) => s + parseFloat(r.comision || 0), 0),
  }

  // Monthly breakdown
  const byMonth = {}
  for (const r of rows) {
    const m = new Date(r.fecha_cobro).getMonth() + 1
    if (!byMonth[m]) byMonth[m] = { mes: m, cobradas: 0, ingreso_real: 0, comision: 0, total: 0 }
    byMonth[m].cobradas++
    byMonth[m].ingreso_real += parseFloat(r.ingreso_real || 0)
    byMonth[m].comision += parseFloat(r.comision || 0)
    byMonth[m].total += parseFloat(r.total || 0)
  }
  const mensual = Object.values(byMonth).sort((a, b) => a.mes - b.mes)

  return ok({ resumen, mensual, detalle: rows })
}

// Reporte por cliente
export async function reportePorCliente(event) {
  await requireAuth(event)
  const { year: yearParam } = parseQuery(event)
  const year = parseInt(yearParam) || new Date().getFullYear()

  // Get all cotizaciones for the year
  const { data: cots, error: e1 } = await supabase.from('v_cotizaciones_completas')
    .select('*')
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)
  if (e1) return serverError(e1.message)

  // Get all orders for the year
  const { data: ords, error: e2 } = await supabase.from('ordenes_trabajo')
    .select('id, cliente_id, estatus, created_at')
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)
  if (e2) return serverError(e2.message)

  // Group by client
  const byClient = {}

  for (const ord of (ords || [])) {
    const cid = ord.cliente_id
    if (!byClient[cid]) byClient[cid] = { cliente_id: cid, cliente_nombre: '', ordenes: 0, cotizaciones: 0, cobradas: 0, ingreso_real: 0, comision: 0, total_facturado: 0, total_cobrado: 0 }
    byClient[cid].ordenes++
  }

  for (const row of (cots || [])) {
    const cid = row.cliente_id
    if (!byClient[cid]) byClient[cid] = { cliente_id: cid, cliente_nombre: row.cliente_nombre, ordenes: 0, cotizaciones: 0, cobradas: 0, ingreso_real: 0, comision: 0, total_facturado: 0, total_cobrado: 0 }
    byClient[cid].cliente_nombre = row.cliente_nombre
    byClient[cid].cotizaciones++
    byClient[cid].ingreso_real += parseFloat(row.ingreso_real || 0)
    byClient[cid].comision += parseFloat(row.comision || 0)
    if (row.fecha_cobro) {
      byClient[cid].cobradas++
      byClient[cid].total_facturado += parseFloat(row.monto_factura ?? row.ingreso_real ?? 0)
      byClient[cid].total_cobrado += parseFloat(row.monto_cobrado ?? row.monto_factura ?? row.ingreso_real ?? 0)
    }
  }

  return ok(Object.values(byClient).sort((a, b) => b.total_facturado - a.total_facturado))
}

// Reporte de estado de órdenes (pipeline)
export async function reporteOrdenes(event) {
  await requireAuth(event)
  const { desde, hasta, cliente_id } = parseQuery(event)

  let query = supabase.from('ordenes_trabajo')
    .select('*, clientes(nombre)')
  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)
  if (cliente_id) query = query.eq('cliente_id', cliente_id)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return serverError(error.message)

  const statuses = ['levantamiento', 'cotizado', 'autorizado', 'en_proceso', 'terminado', 'facturado', 'cobrado', 'cancelado']
  const pipeline = {}
  const detalle = {}
  for (const s of statuses) { pipeline[s] = 0; detalle[s] = [] }

  for (const ord of (data || [])) {
    const item = { ...ord, cliente_nombre: ord.clientes?.nombre || '' }
    delete item.clientes
    if (pipeline[ord.estatus] !== undefined) {
      pipeline[ord.estatus]++
      detalle[ord.estatus].push(item)
    }
  }

  return ok({ pipeline, detalle })
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
