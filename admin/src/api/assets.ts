const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api')
const assetBase = apiBase.replace(/\/api\/?$/, '')

export function assetUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${assetBase}${path.startsWith('/') ? path : `/${path}`}`
}
