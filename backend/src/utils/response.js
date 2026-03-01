/**
 * Standard API response helper
 */
export function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  }
}

export function ok(data) { return response(200, data) }
export function created(data) { return response(201, data) }
export function noContent() { return response(204, null) }
export function badRequest(message) { return response(400, { message }) }
export function unauthorized(message = 'No autorizado') { return response(401, { message }) }
export function forbidden(message = 'Acceso denegado') { return response(403, { message }) }
export function notFound(message = 'No encontrado') { return response(404, { message }) }
export function serverError(message = 'Error interno') { return response(500, { message }) }

/**
 * Parse body from Lambda event
 */
export function parseBody(event) {
  if (!event.body) return {}
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body
  } catch {
    return {}
  }
}

/**
 * Parse query string params
 */
export function parseQuery(event) {
  return event.queryStringParameters || {}
}

/**
 * Parse path param
 */
export function parsePathParam(event, name) {
  return event.pathParameters?.[name] || null
}

/**
 * Pagination helper
 */
export function paginate(query, { page = 1, limit = 20 }) {
  const p = Math.max(1, parseInt(page) || 1)
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const from = (p - 1) * l
  const to = from + l - 1
  return query.range(from, to)
}

/**
 * ORDER STATUS transitions validation
 */
const ORDER_TRANSITIONS = {
  levantamiento: ['cotizado', 'cancelado'],
  cotizado: ['autorizado', 'cancelado'],
  autorizado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: ['facturado', 'cancelado'],
  facturado: ['cobrado'],
  cobrado: [],
  cancelado: [],
}

export function isValidOrderTransition(from, to) {
  return (ORDER_TRANSITIONS[from] || []).includes(to)
}
