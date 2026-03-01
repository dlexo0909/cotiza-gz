import http from 'node:http'
import { handler } from './index.js'

const PORT = process.env.PORT || 3001

const server = http.createServer(async (req, res) => {
  // Collect body
  let body = ''
  for await (const chunk of req) body += chunk

  // Parse URL
  const url = new URL(req.url, `http://localhost:${PORT}`)

  // Build Lambda-like event
  const event = {
    httpMethod: req.method,
    path: url.pathname,
    rawPath: url.pathname,
    queryStringParameters: Object.fromEntries(url.searchParams),
    headers: req.headers,
    body: body || null,
    pathParameters: {},
  }

  // Extract path params by matching the path
  const pathParts = url.pathname.replace(/^\/api/, '').split('/').filter(Boolean)
  // Convention: /resource/:id → pathParameters.id
  if (pathParts.length >= 2) {
    event.pathParameters.id = pathParts[1]
  }

  try {
    const result = await handler(event)
    res.writeHead(result.statusCode, result.headers || {})
    res.end(result.body || '')
  } catch (err) {
    console.error('Server error:', err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

server.listen(PORT, () => {
  console.log(`🚀 Local API server running at http://localhost:${PORT}`)
  console.log('Routes available:')
  console.log('  GET    /api/clientes')
  console.log('  GET    /api/ordenes')
  console.log('  GET    /api/cotizaciones')
  console.log('  GET    /api/reportes/ingresos')
  console.log('  GET    /api/usuarios')
  console.log('  GET    /api/configuracion')
  console.log('  ... and more')
})
