import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, parseBody, parseQuery, parsePathParam, isValidOrderTransition } from '../utils/response.js'

async function getOrdenPagosSummary(ordenIds) {
  if (!ordenIds.length) return {}

  const { data, error } = await supabase
    .from('ordenes_pagos')
    .select('orden_id, monto')
    .in('orden_id', ordenIds)

  if (error) throw new Error(error.message)

  return (data || []).reduce((acc, pago) => {
    const ordenId = pago.orden_id
    const monto = parseFloat(pago.monto || 0)
    acc[ordenId] = (acc[ordenId] || 0) + monto
    return acc
  }, {})
}

function withPagoSummary(orden, pagosPorOrden) {
  const totalAdelantos = pagosPorOrden[orden.id] || 0
  const montoAutorizado = parseFloat(orden.monto_autorizado || 0)
  return {
    ...orden,
    total_adelantos: Math.round(totalAdelantos * 100) / 100,
    saldo_pendiente: Math.round((montoAutorizado - totalAdelantos) * 100) / 100,
  }
}

export async function listOrdenes(event) {
  await requireAuth(event)
  const { page = 1, limit = 20, search = '', estatus = '', cliente_id = '', cliente_final_id = '' } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('v_ordenes_completas').select('*', { count: 'exact' }).order('created_at', { ascending: false })

  if (search) query = query.or(`folio.ilike.%${search}%,descripcion.ilike.%${search}%,cliente_nombre.ilike.%${search}%,ot_cliente.ilike.%${search}%`)
  if (estatus) {
    const statusList = estatus.split(',')
    query = query.in('estatus', statusList)
  }
  if (cliente_id) query = query.eq('cliente_id', cliente_id)
  if (cliente_final_id) query = query.eq('cliente_final_id', cliente_final_id)

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  let items = data || []
  try {
    const pagosPorOrden = await getOrdenPagosSummary(items.map(item => item.id))
    items = items.map(item => withPagoSummary(item, pagosPorOrden))
  } catch (summaryError) {
    return serverError(summaryError.message)
  }

  return ok({ items, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

export async function getOrden(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('v_ordenes_completas').select('*').eq('id', id).single()
  if (error || !data) return notFound('Orden no encontrada')

  try {
    const pagosPorOrden = await getOrdenPagosSummary([data.id])
    return ok(withPagoSummary(data, pagosPorOrden))
  } catch (summaryError) {
    return serverError(summaryError.message)
  }
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
    estatus_tririga: body.estatus_tririga?.trim() || null,
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
    estatus_tririga: body.estatus_tririga?.trim() || null,
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

export async function listOrdenPagos(event) {
  await requireAuth(event)
  const ordenId = parsePathParam(event, 'id')

  const { data: orden, error: ordenError } = await supabase
    .from('ordenes_trabajo')
    .select('id')
    .eq('id', ordenId)
    .single()

  if (ordenError || !orden) return notFound('Orden no encontrada')

  const { data, error } = await supabase
    .from('ordenes_pagos')
    .select('*, usuarios(nombre)')
    .eq('orden_id', ordenId)
    .order('fecha_pago', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return serverError(error.message)

  const items = (data || []).map(pago => ({
    ...pago,
    usuario_nombre: pago.usuarios?.nombre || null,
    usuarios: undefined,
  }))

  return ok(items)
}

export async function createOrdenPago(event) {
  const user = await requireAuth(event)
  const ordenId = parsePathParam(event, 'id')
  const body = parseBody(event)
  const concepto = body.concepto?.trim()
  const monto = parseFloat(body.monto)
  const fechaPago = body.fecha_pago

  if (!concepto) return badRequest('Concepto requerido')
  if (!Number.isFinite(monto) || monto <= 0) return badRequest('Monto inválido')
  if (!fechaPago) return badRequest('Fecha de pago requerida')

  const { data: orden, error: ordenError } = await supabase
    .from('ordenes_trabajo')
    .select('id')
    .eq('id', ordenId)
    .single()

  if (ordenError || !orden) return notFound('Orden no encontrada')

  const { data, error } = await supabase
    .from('ordenes_pagos')
    .insert({
      orden_id: parseInt(ordenId),
      concepto,
      monto,
      fecha_pago: fechaPago,
      notas: body.notas?.trim() || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return serverError(error.message)
  return created(data)
}

export async function updateOrdenPago(event) {
  await requireAuth(event)
  const ordenId = parsePathParam(event, 'id')
  const pagoId = parsePathParam(event, 'pagoId')
  const body = parseBody(event)
  const concepto = body.concepto?.trim()
  const monto = parseFloat(body.monto)
  const fechaPago = body.fecha_pago

  if (!concepto) return badRequest('Concepto requerido')
  if (!Number.isFinite(monto) || monto <= 0) return badRequest('Monto inválido')
  if (!fechaPago) return badRequest('Fecha de pago requerida')

  const { data: existing, error: existingError } = await supabase
    .from('ordenes_pagos')
    .select('id, orden_id')
    .eq('id', pagoId)
    .eq('orden_id', ordenId)
    .single()

  if (existingError || !existing) return notFound('Pago no encontrado')

  const { data, error } = await supabase
    .from('ordenes_pagos')
    .update({
      concepto,
      monto,
      fecha_pago: fechaPago,
      notas: body.notas?.trim() || null,
    })
    .eq('id', pagoId)
    .eq('orden_id', ordenId)
    .select()
    .single()

  if (error) return serverError(error.message)
  return ok(data)
}

export async function deleteOrdenPago(event) {
  await requireAuth(event)
  const ordenId = parsePathParam(event, 'id')
  const pagoId = parsePathParam(event, 'pagoId')

  const { data: existing, error: existingError } = await supabase
    .from('ordenes_pagos')
    .select('id')
    .eq('id', pagoId)
    .eq('orden_id', ordenId)
    .single()

  if (existingError || !existing) return notFound('Pago no encontrado')

  const { error } = await supabase
    .from('ordenes_pagos')
    .delete()
    .eq('id', pagoId)
    .eq('orden_id', ordenId)

  if (error) return serverError(error.message)
  return ok({ message: 'Pago eliminado' })
}
