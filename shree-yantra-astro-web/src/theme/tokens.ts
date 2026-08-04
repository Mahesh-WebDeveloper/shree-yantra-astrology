export type ThemeName = 'dark' | 'light'

export interface Theme {
  name: ThemeName
  isDark: boolean
  gold1: string
  gold2: string
  gold3: string
  goldSoft: string
  goldText: string
  bgDeep: string
  cardBg: string
  cardBorder: string
  text: string
  textSoft: string
  textMuted: string
  headingGradient: [string, string, string]
  buttonGradient: [string, string, string]
  buttonInk: string
  line: string
}

export const darkTheme: Theme = {
  name: 'dark',
  isDark: true,
  gold1: '#f6d27a',
  gold2: '#e9b850',
  gold3: '#c9962e',
  goldSoft: '#fce8a8',
  goldText: '#eccb84',
  // night ink — deeper mystical navy
  bgDeep: '#0a0b10',
  cardBg: 'rgba(255,255,255,0.03)',
  cardBorder: 'rgba(246, 210, 122, 0.15)',
  text: '#f8f6f0',
  textSoft: '#d1c7b5',
  textMuted: '#9e9584',
  headingGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonInk: '#2a1c00',
  line: 'rgba(201,150,46,0.22)',
}

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  gold1: '#1f2937',
  gold2: '#8a5a10',
  gold3: '#6b4410',
  goldSoft: '#f5e6b8',
  goldText: '#8a5a10',
  // cool stone (avoid AI cream+terracotta cliché)
  bgDeep: '#f3f1ec',
  cardBg: '#faf9f6',
  cardBorder: 'rgba(20, 24, 32, 0.1)',
  text: '#141820',
  textSoft: '#3a4250',
  textMuted: '#5c6573',
  headingGradient: ['#141820', '#3a3228', '#8a5a10'],
  buttonGradient: ['#e8c86a', '#d4a84b', '#b8892e'],
  buttonInk: '#1a1408',
  line: 'rgba(20, 24, 32, 0.12)',
}

export const themes: Record<ThemeName, Theme> = { dark: darkTheme, light: lightTheme }

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement
  root.dataset.syTheme = theme.name
  root.style.colorScheme = theme.name
  root.style.setProperty('--sy-bg', theme.bgDeep)
  root.style.setProperty('--sy-card', theme.cardBg)
  root.style.setProperty('--sy-border', theme.cardBorder)
  root.style.setProperty('--sy-text', theme.text)
  root.style.setProperty('--sy-text-soft', theme.textSoft)
  root.style.setProperty('--sy-text-muted', theme.textMuted)
  root.style.setProperty('--sy-gold', theme.goldText)
  root.style.setProperty('--sy-accent', theme.gold2)
  root.style.setProperty('--sy-line', theme.line)
  // Vedic palette extras
  root.style.setProperty('--sy-ink', theme.isDark ? '#0c1030' : '#eef0fb')
  root.style.setProperty('--sy-maroon', theme.isDark ? '#4a1220' : '#f6e2e6')
  root.style.setProperty('--sy-gold-strong', theme.isDark ? '#f6d27a' : '#b45309')
  root.style.setProperty(
    '--sy-glass',
    theme.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.9)',
  )
  root.style.setProperty(
    '--sy-glass-border',
    theme.isDark ? 'rgba(246, 210, 122, 0.15)' : 'rgba(17, 24, 39, 0.09)',
  )
  root.style.setProperty('--sy-card-inner', theme.isDark ? 'rgba(12, 12, 12, 0.96)' : '#ffffff')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.isDark ? '#07090f' : '#f3f1ec')
}
