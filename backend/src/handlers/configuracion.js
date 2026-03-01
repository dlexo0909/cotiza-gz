import { supabase, requireAuth } from '../utils/supabase.js'
import { ok, badRequest, serverError, parseBody } from '../utils/response.js'

export async function getConfiguracion(event) {
  await requireAuth(event)
  const { data, error } = await supabase.from('configuracion').select('*').order('clave')
  if (error) return serverError(error.message)
  // Convertir array [{clave, valor}] a objeto {clave: valor}
  const obj = {}
  for (const row of (data || [])) obj[row.clave] = row.valor
  return ok(obj)
}

export async function updateConfiguracion(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') return { statusCode: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Solo administradores' }) }

  const body = parseBody(event)
  // Acepta objeto {clave: valor} directo
  const entries = Array.isArray(body.items)
    ? body.items
    : Object.entries(body).map(([clave, valor]) => ({ clave, valor }))

  for (const item of entries) {
    if (!item.clave) continue
    const { error } = await supabase.from('configuracion').upsert({
      clave: item.clave, valor: String(item.valor ?? ''),
    }, { onConflict: 'clave' })
    if (error) return serverError(`Error en ${item.clave}: ${error.message}`)
  }

  return ok({ message: 'Configuración guardada' })
}
