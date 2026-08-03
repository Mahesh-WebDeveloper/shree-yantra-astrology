import {
  BookOpen,
  Clock,
  Crown,
  Globe,
  Home,
  Sparkles,
  Star,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react'

import type { ScreenContent } from '@/api/endpoints'

export type ScreenFields = Record<string, string | { en?: string; hi?: string }>
export type EditorTab = 'preview' | 'edit'

export const PAGE_ICONS: Record<string, LucideIcon> = {
  branding: Sparkles,
  home: Home,
  dailyPrediction: Sun,
  kundli: Star,
  choghadiya: Clock,
  subscribe: Crown,
  profile: User,
  library: BookOpen,
}

export const GROUP_ICONS: Record<string, LucideIcon> = {
  Global: Globe,
  'App Pages': Home,
}

export const isImageKey = (k: string) => /image|logo|photo|icon|cover|banner/i.test(k)

export function prettyKey(k: string) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).replace(/\bUrl\b/i, '')
}

export function pageIcon(page: string): LucideIcon {
  return PAGE_ICONS[page] ?? Sparkles
}

export function groupIcon(group: string): LucideIcon {
  return GROUP_ICONS[group] ?? Sparkles
}

export function countCustomFields(screen: ScreenContent | undefined) {
  if (!screen?.sources) return 0
  return Object.values(screen.sources).filter((s) => s === 'custom').length
}

export function customizationPercent(screen: ScreenContent | undefined) {
  if (!screen?.sources) return 0
  const keys = Object.keys(screen.sources)
  if (!keys.length) return 0
  const custom = Object.values(screen.sources).filter((s) => s === 'custom').length
  return Math.round((custom / keys.length) * 100)
}

export function imageFieldCount(screen: ScreenContent | undefined) {
  if (!screen?.effective) return 0
  return Object.keys(screen.effective).filter(isImageKey).length
}

export function textPreview(val: string | { en?: string; hi?: string } | undefined, lang: 'en' | 'hi' = 'en') {
  if (!val) return '—'
  if (typeof val === 'string') return val || '—'
  return (lang === 'hi' ? val.hi : val.en) || '—'
}
