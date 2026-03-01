import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, created, badRequest, notFound, serverError, forbidden, parseBody, parseQuery, parsePathParam } from '../utils/response.js'

export async function listUsuarios(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return forbidden('Solo administradores')

  const { page = 1, limit = 20, search = '' } = parseQuery(event)
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit)

  let query = supabase.from('usuarios').select('id, nombre, email, rol, activo, created_at', { count: 'exact' })
    .order('nombre')
  if (search) query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, count, error } = await query.range(offset, offset + parseInt(limit) - 1)
  if (error) return serverError(error.message)

  return ok({ items: data, total: count, totalPages: Math.ceil(count / parseInt(limit)), page: parseInt(page) })
}

export async function getUsuario(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return forbidden('Solo administradores')

  const id = parsePathParam(event, 'id')
  const { data, error } = await supabase.from('usuarios').select('id, nombre, email, rol, activo, created_at').eq('id', id).single()
  if (error || !data) return notFound('Usuario no encontrado')
  return ok(data)
}

export async function createUsuario(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return forbidden('Solo administradores')

  const body = parseBody(event)
  if (!body.nombre || !body.email || !body.password) return badRequest('Nombre, email y contraseña requeridos')
  if (body.password.length < 6) return badRequest('La contraseña debe tener al menos 6 caracteres')

  // Create auth user in Supabase
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: body.email, password: body.password, email_confirm: true,
  })
  if (authError) return badRequest(authError.message)

  // Insert profile — id is auto-generated (bigint identity), auth_id is the UUID
  const { data, error } = await supabase.from('usuarios').insert({
    auth_id: authUser.user.id,
    nombre: body.nombre, email: body.email,
    rol: body.rol || 'usuario', activo: true,
  }).select().single()

  if (error) {
    // Rollback auth user if profile insert fails
    await supabase.auth.admin.deleteUser(authUser.user.id)
    return serverError(error.message)
  }

  return created(data)
}

export async function updateUsuario(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return forbidden('Solo administradores')

  const id = parsePathParam(event, 'id')
  const body = parseBody(event)

  const updateData = {}
  if (body.nombre) updateData.nombre = body.nombre
  if (body.email) updateData.email = body.email
  if (body.rol) updateData.rol = body.rol

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase.from('usuarios').update(updateData).eq('id', id)
    if (error) return serverError(error.message)
  }

  // Update auth email or password if provided
  if (body.email || body.password) {
    const { data: profile } = await supabase.from('usuarios').select('auth_id').eq('id', id).single()
    if (profile?.auth_id) {
      const authUpdate = {}
      if (body.email) authUpdate.email = body.email
      if (body.password) authUpdate.password = body.password
      await supabase.auth.admin.updateUserById(profile.auth_id, authUpdate)
    }
  }

  return ok({ message: 'Usuario actualizado' })
}

export async function toggleUsuario(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return forbidden('Solo administradores')

  const id = parsePathParam(event, 'id')
  if (id === user.id) return badRequest('No puedes desactivarte a ti mismo')

  const { data: existing } = await supabase.from('usuarios').select('activo, auth_id').eq('id', id).single()
  if (!existing) return notFound('Usuario no encontrado')

  const newActive = !existing.activo
  await supabase.from('usuarios').update({ activo: newActive }).eq('id', id)

  // Ban/unban in auth
  if (existing.auth_id) {
    await supabase.auth.admin.updateUserById(existing.auth_id, { ban_duration: newActive ? 'none' : '876000h' })
  }

  return ok({ activo: newActive })
}
