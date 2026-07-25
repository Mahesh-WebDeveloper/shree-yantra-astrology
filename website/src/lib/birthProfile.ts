import { DEFAULT_BIRTH_FORM, type BirthFormState } from '@/lib/birthForm'

const STORAGE_KEY = 'sy-web-birth-profile'

export function loadBirthProfile(): BirthFormState {
  if (typeof localStorage === 'undefined') return DEFAULT_BIRTH_FORM
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_BIRTH_FORM
    const parsed = JSON.parse(raw) as Partial<BirthFormState>
    return { ...DEFAULT_BIRTH_FORM, ...parsed }
  } catch {
    return DEFAULT_BIRTH_FORM
  }
}

export function saveBirthProfile(form: BirthFormState) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  } catch {
    /* ignore quota */
  }
}
