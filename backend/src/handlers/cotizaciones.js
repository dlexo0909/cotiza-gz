import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, parseBody, parseQuery, parsePathParam } from '../utils/response.js'

export async function listCotizaciones(event) {
  await requireAuth(event)
  const { page = 1, limit = 20, search = '', estatus = '' } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('v_cotizaciones_completas').select('*', { count: 'exact' }).order('created_at', { ascending: false })
  if (search) query = query.or(`folio.ilike.%${search}%,orden_folio.ilike.%${search}%,cliente_nombre.ilike.%${search}%`)
  if (estatus) query = query.eq('estatus', estatus)

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  return ok({ items: data, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

export async function getCotizacion(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')

  const { data: cot, error } = await supabase.from('v_cotizaciones_completas').select('*').eq('id', id).single()
  if (error || !cot) return notFound('Cotización no encontrada')

  // Add partidas
  const { data: partidas } = await supabase.from('cotizacion_partidas')
    .select('*').eq('cotizacion_id', id).order('orden')

  return ok({ ...cot, partidas: partidas || [] })
}

export async function createCotizacion(event) {
  const user = await requireAuth(event)
  const body = parseBody(event)

  if (!body.orden_id) return badRequest('Orden requerida')
  if (!body.partidas?.length) return badRequest('Se requiere al menos una partida')

  // Get order & client commission
  const { data: orden } = await supabase.from('ordenes_trabajo')
    .select('id, estatus, cliente_id, clientes(comision_pct)')
    .eq('id', body.orden_id).single()
  if (!orden) return notFound('Orden no encontrada')

  // Generate folio
  const { data: folio } = await supabase.rpc('generar_folio_cotizacion')

  // Calculate totals
  const comisionPct = parseFloat(body.comision_pct) ?? orden.clientes?.comision_pct ?? 30
  const ivaPct = parseFloat(body.iva_pct) ?? 16
  const subtotal = body.partidas.reduce((s, p) => s + (parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0), 0)
  const iva = Math.round(subtotal * (ivaPct / 100) * 100) / 100
  const total = Math.round((subtotal + iva) * 100) / 100
  const comision = Math.round(total * (comisionPct / 100) * 100) / 100
  const ingresoReal = Math.round((total - comision) * 100) / 100

  const vigenciaDias = parseInt(body.vigencia_dias) || 30
  const fechaVigencia = new Date()
  fechaVigencia.setDate(fechaVigencia.getDate() + vigenciaDias)

  const { data: cot, error } = await supabase.from('cotizaciones').insert({
    orden_id: body.orden_id, folio: folio || `COT-${new Date().getFullYear()}-0001`,
    subtotal, iva_pct: ivaPct, iva, comision_pct: comisionPct, comision, ingreso_real: ingresoReal, total,
    estatus: 'borrador', vigencia_dias: vigenciaDias,
    fecha_vigencia: fechaVigencia.toISOString().split('T')[0],
    condiciones: body.condiciones || null, created_by: user.id,
  }).select().single()

  if (error) return serverError(error.message)

  // Insert partidas
  const partidas = body.partidas.map((p, i) => ({
    cotizacion_id: cot.id, descripcion: p.descripcion, unidad: p.unidad || 'pza',
    cantidad: parseFloat(p.cantidad) || 1, precio_unitario: parseFloat(p.precio_unitario) || 0,
    importe: Math.round((parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0) * 100) / 100,
    orden: p.orden || i + 1,
  }))
  await supabase.from('cotizacion_partidas').insert(partidas)

  // Update order status to cotizado if levantamiento
  if (orden.estatus === 'levantamiento') {
    await supabase.from('ordenes_trabajo').update({ estatus: 'cotizado', monto_autorizado: total }).eq('id', orden.id)
    await supabase.from('historial_estatus').insert({
      entidad_tipo: 'orden', entidad_id: orden.id,
      estatus_anterior: 'levantamiento', estatus_nuevo: 'cotizado',
      usuario_id: user.id, comentario: `Cotización ${cot.folio} creada`,
    })
  }

  return created(cot)
}

export async function updateCotizacion(event) {
  const user = await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const body = parseBody(event)

  // Check status
  const { data: existing } = await supabase.from('cotizaciones').select('estatus').eq('id', id).single()
  if (!existing) return notFound('Cotización no encontrada')
  if (existing.estatus !== 'borrador') return badRequest('Solo se pueden editar cotizaciones en borrador')

  if (!body.partidas?.length) return badRequest('Se requiere al menos una partida')

  const ivaPct = parseFloat(body.iva_pct) ?? 16
  const comisionPct = parseFloat(body.comision_pct) ?? 30
  const subtotal = body.partidas.reduce((s, p) => s + (parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0), 0)
  const iva = Math.round(subtotal * (ivaPct / 100) * 100) / 100
  const total = Math.round((subtotal + iva) * 100) / 100
  const comision = Math.round(total * (comisionPct / 100) * 100) / 100
  const ingresoReal = Math.round((total - comision) * 100) / 100

  const vigenciaDias = parseInt(body.vigencia_dias) || 30
  const fechaVigencia = new Date()
  fechaVigencia.setDate(fechaVigencia.getDate() + vigenciaDias)

  const { error } = await supabase.from('cotizaciones').update({
    subtotal, iva_pct: ivaPct, iva, comision_pct: comisionPct, comision, ingreso_real: ingresoReal, total,
    vigencia_dias: vigenciaDias, fecha_vigencia: fechaVigencia.toISOString().split('T')[0],
    condiciones: body.condiciones || null,
  }).eq('id', id)

  if (error) return serverError(error.message)

  // Replace partidas
  await supabase.from('cotizacion_partidas').delete().eq('cotizacion_id', id)
  const partidas = body.partidas.map((p, i) => ({
    cotizacion_id: parseInt(id), descripcion: p.descripcion, unidad: p.unidad || 'pza',
    cantidad: parseFloat(p.cantidad) || 1, precio_unitario: parseFloat(p.precio_unitario) || 0,
    importe: Math.round((parseFloat(p.cantidad) || 0) * (parseFloat(p.precio_unitario) || 0) * 100) / 100,
    orden: p.orden || i + 1,
  }))
  await supabase.from('cotizacion_partidas').insert(partidas)

  return ok({ message: 'Cotización actualizada' })
}

export async function changeCotizacionStatus(event) {
  const user = await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const body = parseBody(event)
  const { accion } = body

  const { data: cot } = await supabase.from('cotizaciones')
    .select('*, ordenes_trabajo(id, estatus)')
    .eq('id', id).single()
  if (!cot) return notFound('Cotización no encontrada')

  let updateData = {}
  let newStatus = cot.estatus
  let ordenUpdate = null

  switch (accion) {
    case 'enviar':
      if (cot.estatus !== 'borrador') return badRequest('Solo se pueden enviar cotizaciones en borrador')
      newStatus = 'enviada'
      break

    case 'autorizar':
      if (cot.estatus !== 'enviada') return badRequest('Solo se pueden autorizar cotizaciones enviadas')
      newStatus = 'autorizada'
      updateData.fecha_autorizacion = new Date().toISOString().split('T')[0]
      // Move order to autorizado
      if (cot.ordenes_trabajo?.estatus === 'cotizado') {
        ordenUpdate = { estatus: 'autorizado', monto_autorizado: cot.total }
      }
      break

    case 'rechazar':
      if (cot.estatus !== 'enviada') return badRequest('Solo se pueden rechazar cotizaciones enviadas')
      newStatus = 'rechazada'
      break

    case 'facturar':
      if (cot.estatus !== 'autorizada') return badRequest('Solo se pueden facturar cotizaciones autorizadas')
      if (!body.numero_factura) return badRequest('Número de factura requerido')
      updateData.numero_factura = body.numero_factura
      updateData.fecha_facturacion = body.fecha_facturacion || new Date().toISOString().split('T')[0]
      // Move order to facturado
      if (['autorizado', 'en_proceso', 'terminado'].includes(cot.ordenes_trabajo?.estatus)) {
        ordenUpdate = { estatus: 'facturado' }
      }
      break

    case 'cobrar':
      if (!cot.numero_factura) return badRequest('La cotización debe estar facturada primero')
      updateData.fecha_cobro = body.fecha_cobro || new Date().toISOString().split('T')[0]
      // Move order to cobrado
      if (cot.ordenes_trabajo?.estatus === 'facturado') {
        ordenUpdate = { estatus: 'cobrado' }
      }
      break

    case 'revertir':
      newStatus = 'borrador'
      updateData.fecha_autorizacion = null
      updateData.numero_factura = null
      updateData.fecha_facturacion = null
      updateData.fecha_cobro = null
      // Revert order if needed
      if (cot.ordenes_trabajo?.estatus === 'autorizado') {
        ordenUpdate = { estatus: 'cotizado' }
      }
      break

    default:
      return badRequest('Acción no válida')
  }

  // Update cotización
  const { error } = await supabase.from('cotizaciones')
    .update({ estatus: newStatus, ...updateData })
    .eq('id', id)
  if (error) return serverError(error.message)

  // Log status change
  if (newStatus !== cot.estatus) {
    await supabase.from('historial_estatus').insert({
      entidad_tipo: 'cotizacion', entidad_id: parseInt(id),
      estatus_anterior: cot.estatus, estatus_nuevo: newStatus,
      usuario_id: user.id,
    })
  }

  // Update order if needed
  if (ordenUpdate && cot.ordenes_trabajo) {
    const ordenId = cot.ordenes_trabajo.id
    const oldOrdenStatus = cot.ordenes_trabajo.estatus
    await supabase.from('ordenes_trabajo').update(ordenUpdate).eq('id', ordenId)
    await supabase.from('historial_estatus').insert({
      entidad_tipo: 'orden', entidad_id: ordenId,
      estatus_anterior: oldOrdenStatus, estatus_nuevo: ordenUpdate.estatus,
      usuario_id: user.id, comentario: `Cambio desde cotización ${cot.folio}`,
    })
  }

  return ok({ message: 'Acción realizada' })
}

export async function getOrdenCotizaciones(event) {
  await requireAuth(event)
  const ordenId = parsePathParam(event, 'id')

  const { data, error } = await supabase.from('v_cotizaciones_completas')
    .select('*')
    .eq('orden_id', ordenId)
    .order('created_at', { ascending: false })

  if (error) return serverError(error.message)
  return ok(data || [])
}

export async function getAnalisisCostos(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('cotizacion_analisis_costos')
    .select('*').eq('cotizacion_id', id).order('orden')
  if (error) return serverError(error.message)
  return ok(data || [])
}

export async function updateAnalisisCostos(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { items } = parseBody(event)

  // Replace all
  await supabase.from('cotizacion_analisis_costos').delete().eq('cotizacion_id', id)

  if (items?.length > 0) {
    const rows = items.map((it, i) => ({
      cotizacion_id: parseInt(id),
      categoria: it.categoria || 'materiales',
      descripcion: it.descripcion || null,
      costo_real: parseFloat(it.costo_real) || 0,
      costo_cliente: parseFloat(it.costo_cliente) || 0,
      orden: it.orden || i + 1,
    }))
    await supabase.from('cotizacion_analisis_costos').insert(rows)
  }

  return ok({ message: 'Análisis guardado' })
}
