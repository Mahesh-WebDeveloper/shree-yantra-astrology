import axios from 'axios'

const TOKEN_KEY = 'shree-yantra-admin-token'
const USER_KEY = 'shree-yantra-admin-user'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 30000, // generous — VedAstro/AI-backed endpoints can be slow; never spin forever
})

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredAuth(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser<T>() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = String(error.config?.url || '')
    if (status === 401 && !url.includes('/admin/login')) {
      clearStoredAuth()
      window.dispatchEvent(new Event('admin-auth:logout'))
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return String(error.response?.data?.error || error.message || 'Request failed')
  }
  if (error instanceof Error) return error.message
  return 'Request failed'
}
