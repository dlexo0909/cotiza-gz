/**
 * Formatea un número como moneda MXN
 */
export function formatMoney(amount) {
  const num = parseFloat(amount) || 0
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Parsea un string de moneda a número
 */
export function parseMoney(str) {
  if (typeof str === 'number') return str
  return parseFloat(String(str).replace(/[^0-9.-]/g, '')) || 0
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(parseFloat(num) || 0)
}

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Formatea fecha y hora
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Genera colores para los estatus de órdenes
 */
export const ORDER_STATUS_CONFIG = {
  levantamiento: { label: 'Levantamiento', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  cotizado: { label: 'Cotizado', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  autorizado: { label: 'Autorizado', color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  en_proceso: { label: 'En Proceso', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  terminado: { label: 'Terminado', color: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  facturado: { label: 'Facturado', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  cobrado: { label: 'Cobrado', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
}

export const QUOTE_STATUS_CONFIG = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
  autorizada: { label: 'Autorizada', color: 'bg-green-100 text-green-800' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
  vencida: { label: 'Vencida', color: 'bg-yellow-100 text-yellow-800' },
}

/**
 * Transiciones permitidas para órdenes
 */
export const ORDER_TRANSITIONS = {
  levantamiento: ['cotizado', 'cancelado'],
  cotizado: ['autorizado', 'cancelado'],
  autorizado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: ['facturado', 'cancelado'],
  facturado: ['cobrado'],
  cobrado: [],
  cancelado: [],
}

/**
 * Unidades disponibles para partidas
 */
export const UNIDADES = [
  { value: 'pza', label: 'Pieza' },
  { value: 'srv', label: 'Servicio' },
  { value: 'm2', label: 'm²' },
  { value: 'ml', label: 'ml' },
  { value: 'm3', label: 'm³' },
  { value: 'kg', label: 'kg' },
  { value: 'lt', label: 'lt' },
  { value: 'hr', label: 'Hora' },
  { value: 'dia', label: 'Día' },
  { value: 'lote', label: 'Lote' },
  { value: 'global', label: 'Global' },
]

/**
 * Categorías para análisis de costos
 */
export const COST_CATEGORIES = [
  { value: 'materiales', label: 'Materiales' },
  { value: 'mano_obra', label: 'Mano de Obra' },
  { value: 'herramienta', label: 'Herramienta' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'subcontratos', label: 'Subcontratos' },
  { value: 'riesgo', label: 'Riesgo' },
  { value: 'otros', label: 'Otros' },
]

/**
 * Calcula los totales de una cotización
 */
export function calcularTotales({ subtotal = 0, ivaPct = 16, comisionPct = 30 }) {
  const sub = parseFloat(subtotal) || 0
  const iva = sub * (parseFloat(ivaPct) / 100)
  const total = sub + iva
  const comision = total * (parseFloat(comisionPct) / 100)
  const ingresoReal = total - comision

  return {
    subtotal: sub,
    iva: Math.round(iva * 100) / 100,
    total: Math.round(total * 100) / 100,
    comision: Math.round(comision * 100) / 100,
    ingresoReal: Math.round(ingresoReal * 100) / 100,
  }
}

/**
 * Valida RFC mexicano
 */
export function validarRFC(rfc) {
  if (!rfc) return true
  const pattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i
  return pattern.test(rfc)
}

/**
 * Trunca texto con ellipsis
 */
export function truncate(str, maxLen = 50) {
  if (!str) return ''
  return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
}
