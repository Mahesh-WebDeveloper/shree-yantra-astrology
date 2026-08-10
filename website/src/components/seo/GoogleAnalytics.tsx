import { useEffect } from 'react'
import { GA_MEASUREMENT_ID } from '@/lib/seo/config'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/** Loads GA4 when VITE_GA_MEASUREMENT_ID is configured. No-op otherwise. */
export function GoogleAnalytics() {
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof document === 'undefined') return

    const existing = document.querySelector(`script[data-sy-ga="${GA_MEASUREMENT_ID}"]`)
    if (existing) return

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.dataset.syGa = GA_MEASUREMENT_ID
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true })
  }, [])

  return null
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params)
  }
}
