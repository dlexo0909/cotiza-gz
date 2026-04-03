import { listClientes, getCliente, createCliente, updateCliente } from './handlers/clientes.js'
import { listClientesFinales, getClienteFinal, createClienteFinal, updateClienteFinal } from './handlers/clientes-finales.js'
import { listOrdenes, getOrden, createOrden, updateOrden, changeOrdenStatus, getOrdenHistorial, listOrdenPagos, createOrdenPago, updateOrdenPago, deleteOrdenPago } from './handlers/ordenes.js'
import { listCotizaciones, getCotizacion, createCotizacion, updateCotizacion, changeCotizacionStatus, getAnalisisCostos, updateAnalisisCostos, getOrdenCotizaciones } from './handlers/cotizaciones.js'
import { reporteIngresos, reportePorCliente, reporteOrdenes, reportePorCobrar } from './handlers/reportes.js'
import { listUsuarios, getUsuario, createUsuario, updateUsuario, toggleUsuario } from './handlers/usuarios.js'
import { getConfiguracion, updateConfiguracion } from './handlers/configuracion.js'
import { getDashboardStats, getRecentOrders, getPendingQuotes } from './handlers/dashboard.js'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
}

function route(method, path) {
  return `${method} ${path}`
}

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' }
  }

  const method = event.httpMethod
  const path = event.path || event.rawPath || ''

  // Normalize: remove /api prefix if present
  const cleanPath = path.replace(/^\/api/, '')

  try {
    let result

    // --- Clientes ---
    if (cleanPath === '/clientes' && method === 'GET') result = await listClientes(event)
    else if (cleanPath.match(/^\/clientes\/\d+$/) && method === 'GET') result = await getCliente(event)
    else if (cleanPath === '/clientes' && method === 'POST') result = await createCliente(event)
    else if (cleanPath.match(/^\/clientes\/\d+$/) && method === 'PUT') result = await updateCliente(event)

    // --- Clientes Finales ---
    else if (cleanPath === '/clientes-finales' && method === 'GET') result = await listClientesFinales(event)
    else if (cleanPath.match(/^\/clientes-finales\/\d+$/) && method === 'GET') result = await getClienteFinal(event)
    else if (cleanPath === '/clientes-finales' && method === 'POST') result = await createClienteFinal(event)
    else if (cleanPath.match(/^\/clientes-finales\/\d+$/) && method === 'PUT') result = await updateClienteFinal(event)

    // --- Ordenes ---
    else if (cleanPath === '/ordenes' && method === 'GET') result = await listOrdenes(event)
    else if (cleanPath.match(/^\/ordenes\/\d+$/) && method === 'GET') result = await getOrden(event)
    else if (cleanPath === '/ordenes' && method === 'POST') result = await createOrden(event)
    else if (cleanPath.match(/^\/ordenes\/\d+$/) && method === 'PUT') result = await updateOrden(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/estatus$/) && method === 'PATCH') result = await changeOrdenStatus(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/historial$/) && method === 'GET') result = await getOrdenHistorial(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/cotizaciones$/) && method === 'GET') result = await getOrdenCotizaciones(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/pagos$/) && method === 'GET') result = await listOrdenPagos(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/pagos$/) && method === 'POST') result = await createOrdenPago(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/pagos\/\d+$/) && method === 'PATCH') result = await updateOrdenPago(event)
    else if (cleanPath.match(/^\/ordenes\/\d+\/pagos\/\d+$/) && method === 'DELETE') result = await deleteOrdenPago(event)

    // --- Cotizaciones ---
    else if (cleanPath === '/cotizaciones' && method === 'GET') result = await listCotizaciones(event)
    else if (cleanPath.match(/^\/cotizaciones\/\d+$/) && method === 'GET') result = await getCotizacion(event)
    else if (cleanPath === '/cotizaciones' && method === 'POST') result = await createCotizacion(event)
    else if (cleanPath.match(/^\/cotizaciones\/\d+$/) && method === 'PUT') result = await updateCotizacion(event)
    else if (cleanPath.match(/^\/cotizaciones\/\d+\/estatus$/) && method === 'PATCH') result = await changeCotizacionStatus(event)
    else if (cleanPath.match(/^\/cotizaciones\/\d+\/analisis-costos$/) && method === 'GET') result = await getAnalisisCostos(event)
    else if (cleanPath.match(/^\/cotizaciones\/\d+\/analisis-costos$/) && method === 'PUT') result = await updateAnalisisCostos(event)

    // --- Dashboard ---
    else if (cleanPath === '/dashboard/stats' && method === 'GET') result = await getDashboardStats(event)
    else if (cleanPath === '/dashboard/recent-orders' && method === 'GET') result = await getRecentOrders(event)
    else if (cleanPath === '/dashboard/pending-quotes' && method === 'GET') result = await getPendingQuotes(event)

    // --- Reportes ---
    else if (cleanPath === '/reportes/ingresos' && method === 'GET') result = await reporteIngresos(event)
    else if (cleanPath === '/reportes/por-cliente' && method === 'GET') result = await reportePorCliente(event)
    else if (cleanPath === '/reportes/ordenes' && method === 'GET') result = await reporteOrdenes(event)
    else if (cleanPath === '/reportes/por-cobrar' && method === 'GET') result = await reportePorCobrar(event)

    // --- Usuarios ---
    else if (cleanPath === '/usuarios' && method === 'GET') result = await listUsuarios(event)
    else if (cleanPath.match(/^\/usuarios\/[a-f0-9-]+$/) && method === 'GET') result = await getUsuario(event)
    else if (cleanPath === '/usuarios' && method === 'POST') result = await createUsuario(event)
    else if (cleanPath.match(/^\/usuarios\/[a-f0-9-]+$/) && method === 'PUT') result = await updateUsuario(event)
    else if (cleanPath.match(/^\/usuarios\/[a-f0-9-]+\/toggle$/) && method === 'PATCH') result = await toggleUsuario(event)

    // --- Configuración ---
    else if (cleanPath === '/configuracion' && method === 'GET') result = await getConfiguracion(event)
    else if (cleanPath === '/configuracion' && method === 'PUT') result = await updateConfiguracion(event)

    else {
      result = { statusCode: 404, body: JSON.stringify({ error: 'Ruta no encontrada' }) }
    }

    // Inject CORS headers
    result.headers = { ...CORS_HEADERS, ...(result.headers || {}) }
    return result

  } catch (err) {
    console.error('Unhandled error:', err)
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    }
  }
}
