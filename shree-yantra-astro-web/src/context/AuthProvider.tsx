import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAuthToken, getMe, logoutServer, type AuthUser } from '@/lib/api'
import { isAuthError } from '@/lib/apiError'
import {
  clearAuth,
  getStoredUser,
  isProfileComplete,
  saveAuth,
  updateStoredUser,
} from '@/lib/authSession'

type AuthContextValue = {
  ready: boolean
  user: AuthUser | null
  loggedIn: boolean
  profileComplete: boolean
  refreshUser: () => Promise<void>
  setSession: (token: string, user: AuthUser) => void
  logout: () => Promise<void>
  patchUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())

  const refreshUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const r = await getMe()
      saveAuth(token, r.user)
      setUser(r.user)
    } catch (e) {
      if (isAuthError(e)) {
        await clearAuth()
        setUser(null)
      } else {
        setUser(getStoredUser())
      }
    }
  }, [])

  useEffect(() => {
    let on = true
    ;(async () => {
      await refreshUser()
      if (on) setReady(true)
    })()
    const onAuthChange = () => {
      void refreshUser()
    }
    window.addEventListener('sy-auth-change', onAuthChange)
    return () => {
      on = false
      window.removeEventListener('sy-auth-change', onAuthChange)
    }
  }, [refreshUser])

  const setSession = useCallback(
    (token: string, u: AuthUser) => {
      saveAuth(token, u)
      setUser(u)
      void queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const patchUser = useCallback((u: AuthUser) => {
    updateStoredUser(u)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutServer()
    } catch {
      /* still clear local */
    }
    await clearAuth()
    setUser(null)
    void queryClient.invalidateQueries()
  }, [queryClient])

  const value = useMemo(
    () => ({
      ready,
      user,
      loggedIn: !!getAuthToken(),
      profileComplete: isProfileComplete(user),
      refreshUser,
      setSession,
      logout,
      patchUser,
    }),
    [ready, user, refreshUser, setSession, logout, patchUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
