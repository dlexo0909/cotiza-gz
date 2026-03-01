import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, parseBody, parseQuery, parsePathParam } from '../utils/response.js'

export async function listClientesFinales(event) {
  await requireAuth(event)
  const { page = 1, limit = 20, search = '', cliente_id } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('clientes_finales')
    .select('*, clientes(nombre)', { count: 'exact' })
    .order('nombre')

  if (search) query = query.or(`nombre.ilike.%${search}%,id_externo.ilike.%${search}%,ciudad.ilike.%${search}%`)
  if (cliente_id) query = query.eq('cliente_id', cliente_id)

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  const items = (data || []).map(d => ({ ...d, cliente_nombre: d.clientes?.nombre, clientes: undefined }))
  return ok({ items, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

export async function getClienteFinal(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('clientes_finales').select('*').eq('id', id).single()
  if (error || !data) return notFound('Sucursal no encontrada')
  return ok(data)
}

export async function createClienteFinal(event) {
  await requireAuth(event)
  const body = parseBody(event)
  if (!body.cliente_id) return badRequest('Cliente requerido')
  if (!body.nombre?.trim()) return badRequest('Nombre requerido')

  const { data, error } = await supabase.from('clientes_finales').insert({
    cliente_id: body.cliente_id, nombre: body.nombre.trim(),
    id_externo: body.id_externo || null, direccion: body.direccion || null,
    ciudad: body.ciudad || null, estado: body.estado || null,
    codigo_postal: body.codigo_postal || null, contacto: body.contacto || null,
    telefono: body.telefono || null, email: body.email || null,
    notas: body.notas || null, activo: body.activo !== false,
  }).select().single()

  if (error) return serverError(error.message)
  return created(data)
}

export async function updateClienteFinal(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const body = parseBody(event)
  if (!body.nombre?.trim()) return badRequest('Nombre requerido')

  const { data, error } = await supabase.from('clientes_finales').update({
    cliente_id: body.cliente_id, nombre: body.nombre.trim(),
    id_externo: body.id_externo || null, direccion: body.direccion || null,
    ciudad: body.ciudad || null, estado: body.estado || null,
    codigo_postal: body.codigo_postal || null, contacto: body.contacto || null,
    telefono: body.telefono || null, email: body.email || null,
    notas: body.notas || null, activo: body.activo !== false,
  }).eq('id', id).select().single()

  if (error) return serverError(error.message)
  return ok(data)
}
