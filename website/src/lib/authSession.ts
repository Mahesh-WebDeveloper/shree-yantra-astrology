import type { AuthUser } from '@/lib/api'
import { getAuthToken, setAuthToken } from '@/lib/api'
import { dobToHtmlDate, type BirthFormState } from '@/lib/birthForm'
import { saveBirthProfile } from '@/lib/birthProfile'

const USER_KEY = 'sy.user'

export function isProfileComplete(user: AuthUser | null | undefined): boolean {
  const p = user?.profile
  return !!(user?.name && p?.dob && p?.tob && (p?.place || (p?.lat != null && p?.lng != null)))
}

export function getStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

/** Server/local user → website birth form (same fields as ProfilePage). */
export function userToBirthForm(user: AuthUser, prev: BirthFormState): BirthFormState {
  const p = user.profile
  return {
    name: user.name || prev.name,
    dobHtml: p?.dob ? dobToHtmlDate(p.dob) : prev.dobHtml,
    tob: p?.tob || prev.tob,
    tz: p?.tz || prev.tz,
    place: p?.place || prev.place,
    lat: p?.lat != null ? String(p.lat) : prev.lat,
    lng: p?.lng != null ? String(p.lng) : prev.lng,
  }
}

function syncLocalBirthFromUser(user: AuthUser) {
  const p = user.profile
  if (!p?.dob || !p?.tob || (!p?.place && (p?.lat == null || p?.lng == null))) return
  const form = userToBirthForm(user, {
    name: '',
    dobHtml: '1990-01-01',
    tob: '10:30',
    tz: '+05:30',
    place: '',
    lat: '',
    lng: '',
  })
  saveBirthProfile(form)
}

export function saveAuth(token: string, user: AuthUser) {
  setAuthToken(token)
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* ignore */
  }
  syncLocalBirthFromUser(user)
}

export function updateStoredUser(patch: Partial<AuthUser>): AuthUser | null {
  const cur = getStoredUser()
  if (!cur) return null
  const next: AuthUser = {
    ...cur,
    ...patch,
    profile: { ...(cur.profile || {}), ...(patch.profile || {}) },
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  syncLocalBirthFromUser(next)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sy-auth-change'))
  }
  return next
}

export async function clearAuth() {
  setAuthToken(null)
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sy-auth-change'))
  }
}

export function loggedIn(): boolean {
  return !!getAuthToken()
}
