import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, badRequest, serverError, parseBody } from '../utils/response.js'

export async function getConfiguracion(event) {
  await requireAuth(event)
  const { data, error } = await supabase.from('configuracion').select('*').order('clave')
  if (error) return serverError(error.message)
  return ok(data || [])
}

export async function updateConfiguracion(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return { statusCode: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Solo administradores' }) }

  const body = parseBody(event)
  if (!body.items || !Array.isArray(body.items)) return badRequest('Se requiere un array de items')

  for (const item of body.items) {
    if (!item.clave) continue
    const { error } = await supabase.from('configuracion').upsert({
      clave: item.clave, valor: item.valor, descripcion: item.descripcion || null,
    }, { onConflict: 'clave' })
    if (error) return serverError(`Error en ${item.clave}: ${error.message}`)
  }

  return ok({ message: 'Configuración guardada' })
}
