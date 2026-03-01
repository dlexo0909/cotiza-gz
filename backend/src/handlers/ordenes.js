import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, parseBody, parseQuery, parsePathParam, isValidOrderTransition } from '../utils/response.js'

export async function listOrdenes(event) {
  await requireAuth(event)
  const { page = 1, limit = 20, search = '', estatus = '' } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('v_ordenes_completas').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (search) query = query.or(`folio.ilike.%${search}%,descripcion.ilike.%${search}%,cliente_nombre.ilike.%${search}%,ot_cliente.ilike.%${search}%`)
  if (estatus) {
    const statusList = estatus.split(',')
    query = query.in('estatus', statusList)
  }

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  return ok({ items: data, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

export async function getOrden(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('v_ordenes_completas').select('*').eq('id', id).single()
  if (error || !data) return notFound('Orden no encontrada')
  return ok(data)
}

export async function createOrden(event) {
  const user = await requireAuth(event)
  const body = parseBody(event)

  if (!body.cliente_id) return badRequest('Cliente requerido')
  if (!body.descripcion?.trim()) return badRequest('Descripción requerida')

  // Generate folio
  const { data: folioData } = await supabase.rpc('generar_folio_orden')
  const folio = folioData || `OT-${new Date().getFullYear()}-0001`

  const { data, error } = await supabase.from('ordenes_trabajo').insert({
    folio,
    cliente_id: body.cliente_id,
    cliente_final_id: body.cliente_final_id || null,
    ot_cliente: body.ot_cliente || null,
    descripcion: body.descripcion.trim(),
    direccion_obra: body.direccion_obra || null,
    fecha_levantamiento: body.fecha_levantamiento || null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    notas: body.notas || null,
    estatus: 'levantamiento',
    created_by: user.id,
  }).select().single()

  if (error) return serverError(error.message)

  // Log status history
  await supabase.from('historial_estatus').insert({
    entidad_tipo: 'orden', entidad_id: data.id,
    estatus_anterior: null, estatus_nuevo: 'levantamiento',
    usuario_id: user.id, comentario: 'Orden creada',
  })

  return created(data)
}

export async function updateOrden(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const body = parseBody(event)

  if (!body.descripcion?.trim()) return badRequest('Descripción requerida')

  const { data, error } = await supabase.from('ordenes_trabajo').update({
    cliente_id: body.cliente_id,
    cliente_final_id: body.cliente_final_id || null,
    ot_cliente: body.ot_cliente || null,
    descripcion: body.descripcion.trim(),
    direccion_obra: body.direccion_obra || null,
    fecha_levantamiento: body.fecha_levantamiento || null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    notas: body.notas || null,
  }).eq('id', id).select().single()

  if (error) return serverError(error.message)
  return ok(data)
}

export async function changeOrdenStatus(event) {
  const user = await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { estatus, comentario } = parseBody(event)

  // Get current order
  const { data: orden } = await supabase.from('ordenes_trabajo').select('estatus').eq('id', id).single()
  if (!orden) return notFound('Orden no encontrada')

  if (!isValidOrderTransition(orden.estatus, estatus)) {
    return badRequest(`Transición no válida: ${orden.estatus} → ${estatus}`)
  }

  const { error } = await supabase.from('ordenes_trabajo')
    .update({ estatus })
    .eq('id', id)

  if (error) return serverError(error.message)

  await supabase.from('historial_estatus').insert({
    entidad_tipo: 'orden', entidad_id: parseInt(id),
    estatus_anterior: orden.estatus, estatus_nuevo: estatus,
    usuario_id: user.id, comentario: comentario || null,
  })

  return ok({ message: 'Estatus actualizado' })
}

export async function getOrdenCotizaciones(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('cotizaciones').select('*').eq('orden_id', id).order('created_at', { ascending: false })
  if (error) return serverError(error.message)
  return ok(data || [])
}

export async function getOrdenHistorial(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase
    .from('historial_estatus')
    .select('*, usuarios(nombre)')
    .eq('entidad_tipo', 'orden')
    .eq('entidad_id', id)
    .order('created_at', { ascending: false })

  if (error) return serverError(error.message)
  const items = (data || []).map(h => ({ ...h, usuario_nombre: h.usuarios?.nombre, usuarios: undefined }))
  return ok(items)
}
