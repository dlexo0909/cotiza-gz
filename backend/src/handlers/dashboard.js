import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, serverError } from '../utils/response.js'

export async function getDashboardStats(event) {
  await requireAuth(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const [ordenesRes, cotPendientesRes, ingresosRes] = await Promise.all([
    supabase.from('ordenes_trabajo')
      .select('id', { count: 'exact', head: true })
      .not('estatus', 'in', '("cobrado","cancelado","facturado")'),

    supabase.from('cotizaciones')
      .select('id', { count: 'exact', head: true })
      .in('estatus', ['borrador', 'enviada']),

    supabase.from('cotizaciones')
      .select('ingreso_real, comision')
      .eq('estatus', 'cobrado')
      .gte('fecha_cobro', startOfMonth)
      .lte('fecha_cobro', endOfMonth),
  ])

  const ingreso_mes = (ingresosRes.data || []).reduce((s, r) => s + parseFloat(r.ingreso_real || 0), 0)
  const comision_mes = (ingresosRes.data || []).reduce((s, r) => s + parseFloat(r.comision || 0), 0)

  return ok({
    ordenes_activas: ordenesRes.count || 0,
    cotizaciones_pendientes: cotPendientesRes.count || 0,
    ingreso_mes,
    comision_mes,
  })
}

export async function getRecentOrders(event) {
  await requireAuth(event)

  const { data, error } = await supabase
    .from('v_ordenes_completas')
    .select('id, folio, cliente_nombre, estatus, created_at')
    .not('estatus', 'in', '("cancelado")')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) return serverError(error.message)
  return ok(data || [])
}

export async function getPendingQuotes(event) {
  await requireAuth(event)

  const { data, error } = await supabase
    .from('v_cotizaciones_completas')
    .select('id, folio, total, estatus, cliente_nombre, created_at')
    .in('estatus', ['borrador', 'enviada'])
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) return serverError(error.message)
  return ok(data || [])
}
