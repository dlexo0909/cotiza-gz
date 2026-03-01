// Vercel Serverless Function - Catch-all API route
// Maps Vercel's (req, res) to the existing Lambda-style handler

import { handler } from '../backend/src/index.js'

export default async function (req, res) {
  // Build Lambda-compatible event from Vercel request
  const url = new URL(req.url, `https://${req.headers.host}`)
  
  // Read body for non-GET methods
  let body = null
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    body = Buffer.concat(chunks).toString('utf-8') || null
  }

  // Extract path parameters (convention: /api/resource/:id)
  const cleanPath = url.pathname.replace(/^\/api/, '')
  const pathParts = cleanPath.split('/').filter(Boolean)
  const pathParameters = {}
  if (pathParts.length >= 2) {
    pathParameters.id = pathParts[1]
  }

  const event = {
    httpMethod: req.method,
    path: url.pathname,
    rawPath: url.pathname,
    queryStringParameters: Object.fromEntries(url.searchParams),
    headers: req.headers,
    body,
    pathParameters,
  }

  try {
    const result = await handler(event)

    // Set response headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value)
      })
    }

    res.status(result.statusCode)

    if (result.body) {
      res.send(result.body)
    } else {
      res.end()
    }
  } catch (err) {
    console.error('Vercel function error:', err)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
