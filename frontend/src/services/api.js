import { supabase } from './supabase.js'

const API_URL = import.meta.env.VITE_API_URL || '/api'

async function request(endpoint, options = {}) {
  const { method = 'GET', body, headers: customHeaders = {} } = options

  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  // Add auth token from Supabase session
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const config = { method, headers }
  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor' }))
    throw new Error(error.message || `Error ${response.status}`)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
}
