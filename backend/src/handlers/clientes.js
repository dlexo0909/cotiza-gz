import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, parseBody, parseQuery, parsePathParam } from '../utils/response.js'

/**
 * GET /api/clientes
 */
export async function listClientes(event) {
  await requireAuth(event)
  const { page = 1, limit = 20, search = '' } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('clientes').select('*', { count: 'exact' }).order('nombre')

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,rfc.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  return ok({ items: data, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

/**
 * GET /api/clientes/:id
 */
export async function getCliente(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')

  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error || !data) return notFound('Cliente no encontrado')

  return ok(data)
}

/**
 * POST /api/clientes
 */
export async function createCliente(event) {
  await requireAuth(event)
  const body = parseBody(event)

  if (!body.nombre?.trim()) return badRequest('El nombre es requerido')

  const { data, error } = await supabase.from('clientes').insert({
    nombre: body.nombre.trim(),
    rfc: body.rfc || null,
    email: body.email || null,
    telefono: body.telefono || null,
    contacto: body.contacto || null,
    direccion: body.direccion || null,
    comision_pct: parseFloat(body.comision_pct) || 30,
    notas: body.notas || null,
    activo: body.activo !== false,
  }).select().single()

  if (error) return serverError(error.message)
  return created(data)
}

/**
 * PUT /api/clientes/:id
 */
export async function updateCliente(event) {
  await requireAuth(event)
  const id = parsePathParam(event, 'id')
  const body = parseBody(event)

  if (!body.nombre?.trim()) return badRequest('El nombre es requerido')

  const { data, error } = await supabase.from('clientes').update({
    nombre: body.nombre.trim(),
    rfc: body.rfc || null,
    email: body.email || null,
    telefono: body.telefono || null,
    contacto: body.contacto || null,
    direccion: body.direccion || null,
    comision_pct: parseFloat(body.comision_pct) || 30,
    notas: body.notas || null,
    activo: body.activo !== false,
  }).eq('id', id).select().single()

  if (error) return serverError(error.message)
  return ok(data)
}
