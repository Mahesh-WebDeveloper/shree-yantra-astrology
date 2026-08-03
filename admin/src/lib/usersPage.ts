import type { User } from '@/api/types'
import { formatDate } from '@/lib/utils'

export type SortField = 'createdAt' | 'updatedAt' | 'name' | 'email' | 'plan' | 'role' | 'lastLoginAt'
export type SortDir = 'asc' | 'desc'
export type PlanFilter = '' | 'free' | 'premium'
export type RoleFilter = '' | 'user' | 'admin'
export type StatusFilter = '' | 'active' | 'blocked'
export type ProviderFilter = '' | 'password' | 'otp' | 'google' | 'apple'

export const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'createdAt', label: 'Join date' },
  { value: 'lastLoginAt', label: 'Last login' },
  { value: 'updatedAt', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'plan', label: 'Plan' },
  { value: 'role', label: 'Role' },
]

export function userId(user: Pick<User, 'id' | '_id'>) {
  return user.id || user._id || ''
}

export function canBulkSelect(user: User, selfId: string | undefined) {
  const id = userId(user)
  if (!id || id === selfId) return false
  if (user.role === 'admin') return false
  return true
}

export function userInitials(name?: string) {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

export function avatarFromProfile(user: User) {
  const profile = user.profile as { avatar?: string } | undefined
  return profile?.avatar || ''
}

export function relativeTime(value?: string | null) {
  if (!value) return 'Never'
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return 'Never'
  if (diff < 45_000) return 'Just now'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function providerLabel(provider: string) {
  const map: Record<string, string> = {
    password: 'Email/password',
    otp: 'Phone OTP',
    google: 'Google',
    apple: 'Apple',
  }
  return map[provider] || provider
}

export function planTone(plan: User['plan']) {
  return plan === 'premium' ? 'warning' as const : 'neutral' as const
}

export function roleTone(role: User['role']) {
  return role === 'admin' ? 'accent' as const : 'neutral' as const
}

export function statusTone(blocked: boolean) {
  return blocked ? 'danger' as const : 'success' as const
}
