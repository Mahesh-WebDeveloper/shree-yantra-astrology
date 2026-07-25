import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyThemeToDocument, darkTheme, lightTheme, type Theme, type ThemeName } from './tokens'

// Versioned key: old light-mode cache is ignored so the redesigned site opens dark by default.
const STORAGE_KEY = 'sy.theme.v3'
const LEGACY_STORAGE_KEYS = ['sy.theme', 'sy.theme.v2']

type ThemeContextValue = {
  theme: Theme
  name: ThemeName
  toggle: () => void
  setTheme: (n: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored(): ThemeName {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>(() => readStored())
  const theme = name === 'light' ? lightTheme : darkTheme

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme)
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      /* ignore */
    }
  }, [theme, name])

  const setTheme = useCallback((n: ThemeName) => setName(n), [])
  const toggle = useCallback(() => setName((p) => (p === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo(() => ({ theme, name, toggle, setTheme }), [theme, name, toggle, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
