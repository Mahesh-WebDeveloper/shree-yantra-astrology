import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_BIRTH_FORM, type BirthFormState } from '@/lib/birthForm'
import { loadBirthProfile, saveBirthProfile } from '@/lib/birthProfile'
import { userToBirthForm } from '@/lib/authSession'
import { useAuth } from '@/context/AuthProvider'

export function useBirthProfile() {
  const { user } = useAuth()
  const [form, setFormState] = useState<BirthFormState>(() => loadBirthProfile())

  useEffect(() => {
    saveBirthProfile(form)
  }, [form])

  // Logged-in server profile → local birth form (same as mobile birthFromProfile / sy.profile)
  useEffect(() => {
    if (!user?.profile?.dob) return
    setFormState((prev) => userToBirthForm(user, prev))
  }, [user?.id, user?.profile?.dob, user?.profile?.tob, user?.name, user?.profile?.place, user?.profile?.lat, user?.profile?.lng])

  const setForm = useCallback((patch: Partial<BirthFormState> | ((prev: BirthFormState) => BirthFormState)) => {
    setFormState((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }))
  }, [])

  const resetForm = useCallback(() => setFormState(DEFAULT_BIRTH_FORM), [])

  return { form, setForm, resetForm }
}
