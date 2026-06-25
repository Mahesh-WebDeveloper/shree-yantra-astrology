/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { apiErrorMessage, clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { User } from '@/api/types'

type AuthContextValue = {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(() => getStoredUser<User>())

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    window.addEventListener('admin-auth:logout', logout)
    return () => window.removeEventListener('admin-auth:logout', logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await endpoints.login({ email, password })
      setStoredAuth(result.token, result.admin)
      setToken(result.token)
      setUser(result.admin)
    } catch (error) {
      throw new Error(apiErrorMessage(error), { cause: error })
    }
  }, [])

  const value = useMemo(() => ({ token, user, login, logout }), [token, user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
