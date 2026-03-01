import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key (server-side)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Get authenticated user from JWT token
 */
export async function getAuthUser(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) return null

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  // Get profile
  const { data: profile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .eq('activo', true)
    .single()

  return profile
}

/**
 * Require authenticated user, return 401 if not
 */
export async function requireAuth(event) {
  const user = await getAuthUser(event)
  if (!user) {
    throw { statusCode: 401, message: 'No autorizado' }
  }
  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(event) {
  const user = await requireAuth(event)
  if (user.rol !== 'admin') {
    throw { statusCode: 403, message: 'Acceso denegado. Se requiere rol de administrador.' }
  }
  return user
}
