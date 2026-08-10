/** Canonical site configuration for SEO, schema, and sitemap generation. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://shreeyantraastrology.com'

export const SITE_NAME = 'Shree Yantra Astrology'
export const SITE_NAME_ALT = 'Shree Yantraa Astrology'
export const SITE_TAGLINE = 'Modern Vedic astrology app for Kundli, Panchang, Rashifal and spiritual guidance'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`
export const DEFAULT_LOCALE = 'en_IN'
export const CONTACT_EMAIL = 'support@shreeyantra.app'

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.shreeyantra.astrology'
export const ANDROID_PACKAGE = 'com.shreeyantra.astrology'

export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || ''
export const GSC_VERIFICATION = (import.meta.env.VITE_GSC_VERIFICATION as string | undefined)?.trim() || ''

export function absoluteUrl(path: string): string {
  if (!path || path === '/') return SITE_URL
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}
