/** Default panchang location — same fallback as mobile WelcomeScreen */
export const DEFAULT_PANCHANG = {
  place: 'Jaipur',
  lat: 26.9124,
  lng: 75.7873,
  tz: '+05:30',
} as const

export async function resolveUserLocation(): Promise<{
  place: string
  lat?: number
  lng?: number
  city: string
  fromGps: boolean
}> {
  const fallback = {
    place: DEFAULT_PANCHANG.place,
    lat: DEFAULT_PANCHANG.lat,
    lng: DEFAULT_PANCHANG.lng,
    city: DEFAULT_PANCHANG.place,
    fromGps: false,
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) return fallback
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 600_000,
      })
    })
    return {
      place: '',
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      city: 'Your location',
      fromGps: true,
    }
  } catch {
    return fallback
  }
}

export function greetingForHour(h: number, hi: boolean): string {
  if (h < 5) return hi ? 'शुभ रात्रि' : 'Good night'
  if (h < 12) return hi ? 'सुप्रभात' : 'Good morning'
  if (h < 17) return hi ? 'शुभ अपराह्न' : 'Good afternoon'
  if (h < 21) return hi ? 'शुभ संध्या' : 'Good evening'
  return hi ? 'शुभ रात्रि' : 'Good night'
}

const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस']

export function todayLabel(hi: boolean): string {
  const d = new Date()
  const mon = hi ? MON_HI[d.getMonth()] : MON_EN[d.getMonth()]
  const today = hi ? 'आज' : 'Today'
  return `${today}, ${d.getDate()} ${mon} ${d.getFullYear()}`
}

export function angaEndLabel(e: { hm: string; nextDay: boolean } | undefined, hi: boolean): string {
  if (!e) return ''
  if (hi) return `${e.hm}${e.nextDay ? ' (अगले दिन)' : ''} तक`
  return `till ${e.hm}${e.nextDay ? ' (next day)' : ''}`
}

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  return base ? `${base}${path}` : path
}
