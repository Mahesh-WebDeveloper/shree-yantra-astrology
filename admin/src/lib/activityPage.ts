import {
  AlertTriangle,
  Eye,
  LogIn,
  Play,
  Search,
  Sparkles,
  Star,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'

import { formatDate } from '@/lib/utils'

export type ActivitySort = 'lastSeen' | 'events' | 'sessions' | 'errors' | 'ai'
export type PlanFilter = '' | 'free' | 'premium'
export type IssueType = '' | 'ai_error' | 'api_error' | 'load_failed' | 'app_error' | 'app_crash'
export type ActivityTab = 'users' | 'live' | 'issues'

export const SORT_OPTIONS: { value: ActivitySort; label: string }[] = [
  { value: 'lastSeen', label: 'Last active' },
  { value: 'events', label: 'Most events' },
  { value: 'sessions', label: 'Most sessions' },
  { value: 'errors', label: 'Most errors' },
  { value: 'ai', label: 'Most AI chat' },
]

export const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: '', label: 'All issues' },
  { value: 'ai_error', label: 'AI errors' },
  { value: 'api_error', label: 'API errors' },
  { value: 'load_failed', label: 'Load failed' },
  { value: 'app_error', label: 'App errors' },
  { value: 'app_crash', label: 'Crashes' },
]

export const EVENT_ICONS: Record<string, LucideIcon> = {
  screen_view: Eye,
  login: LogIn,
  search: Search,
  media_play: Play,
  ai_ask: Sparkles,
  kundli_view: Star,
  ai_error: AlertTriangle,
  api_error: AlertTriangle,
  load_failed: WifiOff,
  app_error: AlertTriangle,
  app_crash: AlertTriangle,
}

export function relativeTime(value?: string | null) {
  if (!value) return 'never'
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return 'never'
  if (diff < 45_000) return 'just now'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function propsSummary(props?: Record<string, unknown> | null) {
  if (!props || Object.keys(props).length === 0) return null
  const text = JSON.stringify(props)
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}

export function issueLabel(name: string) {
  return ISSUE_TYPES.find((t) => t.value === name)?.label || name.replace(/_/g, ' ')
}

export function aiAnswerPreview(response?: Record<string, unknown> | null) {
  if (!response) return null
  const answer = typeof response.answer === 'string' ? response.answer : null
  if (answer) return answer.length > 220 ? `${answer.slice(0, 220)}…` : answer
  return null
}
