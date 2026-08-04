import type { KundliInput } from '@/lib/api'
import { DEFAULT_PANCHANG } from '@/lib/location'

export type BirthFormState = {
  name: string
  dobHtml: string
  tob: string
  tz: string
  place: string
  lat: string
  lng: string
}

export const DEFAULT_BIRTH_FORM: BirthFormState = {
  name: '',
  dobHtml: '1990-01-01',
  tob: '10:30',
  tz: DEFAULT_PANCHANG.tz,
  place: DEFAULT_PANCHANG.place,
  lat: String(DEFAULT_PANCHANG.lat),
  lng: String(DEFAULT_PANCHANG.lng),
}

/** Mobile/backend expect DD-MM-YYYY */
export function htmlDateToDob(html: string): string {
  const [y, m, d] = html.split('-')
  if (!y || !m || !d) return html
  return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`
}

/** Server profile uses DD-MM-YYYY; form uses HTML date input YYYY-MM-DD */
export function dobToHtmlDate(dob: string | undefined): string {
  if (!dob?.trim()) return DEFAULT_BIRTH_FORM.dobHtml
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) return dob.trim()
  const [d, m, y] = dob.trim().split('-')
  if (y?.length === 4 && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  return DEFAULT_BIRTH_FORM.dobHtml
}

export function birthFormToKundli(form: BirthFormState): KundliInput {
  const lat = form.lat.trim() ? Number(form.lat) : undefined
  const lng = form.lng.trim() ? Number(form.lng) : undefined
  const input: KundliInput = {
    dob: htmlDateToDob(form.dobHtml),
    tob: form.tob.trim(),
    tz: form.tz.trim() || '+05:30',
  }
  if (lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)) {
    input.lat = lat
    input.lng = lng
  }
  if (form.place.trim()) input.place = form.place.trim()
  return input
}

export function applyGpsToForm(
  form: BirthFormState,
  loc: { place: string; lat?: number; lng?: number; city: string },
): BirthFormState {
  if (loc.lat != null && loc.lng != null) {
    return {
      ...form,
      place: loc.place || loc.city,
      lat: String(loc.lat),
      lng: String(loc.lng),
    }
  }
  return { ...form, place: loc.place || form.place }
}
