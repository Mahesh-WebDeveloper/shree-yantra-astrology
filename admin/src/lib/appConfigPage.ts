import {
  BookOpen,
  Calendar,
  Globe,
  Image as ImageIcon,
  Layers,
  Phone,
  Settings2,
  Sparkles,
  Star,
  ToggleLeft,
  User,
  type LucideIcon,
} from 'lucide-react'

export type ConfigTab = 'support' | 'theme' | 'onboarding' | 'banners' | 'featured' | 'behavior' | 'advanced'

export const CONFIG_TABS: { id: ConfigTab; label: string; icon: LucideIcon; desc: string }[] = [
  { id: 'support', label: 'Support & version', icon: Phone, desc: 'Help contact & app release' },
  { id: 'theme', label: 'Theme & logo', icon: Sparkles, desc: 'Colors & logo URL (text → Pages)' },
  { id: 'onboarding', label: 'Onboarding', icon: Layers, desc: 'First-launch slide carousel' },
  { id: 'banners', label: 'Home banners', icon: ImageIcon, desc: 'Welcome screen carousel' },
  { id: 'featured', label: 'Featured', icon: Star, desc: 'Highlighted library items' },
  { id: 'behavior', label: 'App behavior', icon: ToggleLeft, desc: 'Modules, profile & home UI' },
  { id: 'advanced', label: 'Advanced', icon: Settings2, desc: 'Raw JSON (developers)' },
]

export const MODULE_FLAGS: { key: string; label: string; desc: string; icon: LucideIcon; defaultOn: boolean }[] = [
  { key: 'library', label: 'Divine Library', desc: 'Scriptures, books & media section', icon: BookOpen, defaultOn: true },
  { key: 'kundli', label: 'Kundli / Birth chart', desc: 'Full chart & dasha features', icon: Star, defaultOn: true },
  { key: 'dailyPrediction', label: 'Daily prediction', desc: 'Personal rashifal & horoscope', icon: Calendar, defaultOn: true },
  { key: 'choghadiya', label: 'Choghadiya muhurat', desc: 'Auspicious timing screen', icon: Globe, defaultOn: true },
  { key: 'aiPredictions', label: 'AI Jyotishi', desc: 'Ask the astrologer chat', icon: Sparkles, defaultOn: true },
]

export const PROFILE_FLAGS: { key: string; label: string; desc: string; icon: LucideIcon }[] = [
  { key: 'profileNameEditable', label: 'Allow name editing', desc: 'Users can change their display name in profile', icon: User },
  { key: 'profileDobEditable', label: 'Allow DOB editing', desc: 'Off recommended — kundli accuracy depends on birth date', icon: Calendar },
]

export const HOME_UI_FLAGS: { key: string; label: string; desc: string; type: 'boolean' | 'number'; min?: number; max?: number }[] = [
  { key: 'showZodiacWheel', label: 'Show zodiac wheel', desc: 'Spinning wheel behind logo on welcome screen', type: 'boolean' },
  { key: 'zodiacWheelOffsetY', label: 'Wheel vertical offset (px)', desc: '−120 up · +120 down', type: 'number', min: -120, max: 120 },
]

export const FEATURED_TYPES = [
  { value: 'library', label: 'Library book' },
  { value: 'media', label: 'Media item' },
  { value: 'promo', label: 'Promo / custom' },
]

export function flagBool(flags: Record<string, unknown>, key: string, defaultOn = false) {
  if (!(key in flags)) return defaultOn
  return !!flags[key]
}

export function flagNumber(flags: Record<string, unknown>, key: string, fallback = 0) {
  const n = Number(flags[key])
  return Number.isFinite(n) ? n : fallback
}
