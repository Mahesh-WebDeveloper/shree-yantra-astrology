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
  // Temple-night charcoal with a warm ivory foreground.
  bgDeep: '#090806',
  cardBg: 'rgba(255,246,226,0.035)',
  cardBorder: 'rgba(246, 210, 122, 0.15)',
  text: '#f8f2e8',
  textSoft: '#d5c8b3',
  textMuted: '#a09480',
  headingGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonGradient: ['#fce8a8', '#e9b850', '#b87f1a'],
  buttonInk: '#2a1c00',
  line: 'rgba(201,150,46,0.22)',
}

export const lightTheme: Theme = {
  name: 'light',
  isDark: false,
  gold1: '#f1d68e',
  gold2: '#8a5a10',
  gold3: '#6b4410',
  goldSoft: '#f5e6b8',
  goldText: '#8a5a10',
  bgDeep: '#fbf8f1',
  cardBg: '#fffdfa',
  cardBorder: 'rgba(124, 74, 3, 0.12)',
  text: '#1a1508',
  textSoft: '#4a4232',
  textMuted: '#746b59',
  headingGradient: ['#1a1508', '#4a3520', '#8a5a10'],
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
  root.style.setProperty('--sy-ink', theme.isDark ? '#f8f2e8' : '#1a1508')
  root.style.setProperty('--sy-maroon', theme.isDark ? '#4a1220' : '#f6e2e6')
  root.style.setProperty('--sy-gold-strong', theme.isDark ? '#f6d27a' : '#b45309')
  root.style.setProperty(
    '--sy-glass',
    theme.isDark ? 'rgba(255, 246, 226, 0.035)' : 'rgba(255, 253, 250, 0.92)',
  )
  root.style.setProperty(
    '--sy-glass-border',
    theme.isDark ? 'rgba(246, 210, 122, 0.15)' : 'rgba(17, 24, 39, 0.09)',
  )
  root.style.setProperty('--sy-card-inner', theme.isDark ? 'rgba(15, 13, 10, 0.96)' : '#fffdfa')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.isDark ? '#090806' : '#fbf8f1')
}
