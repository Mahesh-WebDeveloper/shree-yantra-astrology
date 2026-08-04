import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setApiLang, type ApiLang } from '@/lib/api'

type LangContextValue = {
  lang: ApiLang
  setLang: (l: ApiLang) => void
  hi: boolean
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<ApiLang>(() => {
    try {
      const s = localStorage.getItem('sy.lang')
      return s === 'hi' ? 'hi' : 'en'
    } catch {
      return 'en'
    }
  })

  const setLang = (l: ApiLang) => {
    setLangState(l)
    setApiLang(l)
    try {
      localStorage.setItem('sy.lang', l)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setApiLang(lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, hi: lang === 'hi' }), [lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}

