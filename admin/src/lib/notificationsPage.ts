import { Crown, Sparkles, Star, type LucideIcon } from 'lucide-react'

import type { NotificationItem } from '@/api/types'
import { formatDateTime } from '@/lib/utils'

export type NotificationType = NotificationItem['type']
export type NotificationAudience = NotificationItem['audience']
export type SentFilter = '' | 'true' | 'false'

export const TYPE_OPTIONS: { value: NotificationType; label: string; desc: string; icon: LucideIcon; tone: string }[] = [
  { value: 'prediction', label: 'Predictions', desc: 'Rashifal, daily insights', icon: Star, tone: 'text-primary bg-primary/10' },
  { value: 'promo', label: 'Offers', desc: 'Updates & promotions', icon: Sparkles, tone: 'text-accent bg-accent/10' },
  { value: 'account', label: 'Account', desc: 'Billing & subscription', icon: Crown, tone: 'text-warning bg-warning/10' },
]

export const AUDIENCE_OPTIONS: { value: NotificationAudience; label: string; desc: string }[] = [
  { value: 'all', label: 'Everyone', desc: 'All app users' },
  { value: 'premium', label: 'Premium', desc: 'Paid subscribers only' },
  { value: 'free', label: 'Free', desc: 'Non-premium users' },
  { value: 'user', label: 'One user', desc: 'Specific user ID' },
]

export const SENT_FILTERS: { value: SentFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'false', label: 'Drafts' },
  { value: 'true', label: 'Sent' },
]

export type DraftNotification = Partial<NotificationItem> & { sendNow?: boolean }

export const emptyNotification: DraftNotification = {
  title: '',
  body: '',
  translations: { en: { title: '', body: '' }, hi: { title: '', body: '' } },
  type: 'promo',
  audience: 'all',
  targetUserId: '',
  sendNow: true,
}

export function typeMeta(type: NotificationType) {
  return TYPE_OPTIONS.find((t) => t.value === type) ?? TYPE_OPTIONS[1]
}

export function audienceLabel(audience: NotificationAudience) {
  return AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label ?? audience
}

export function statusMeta(notification: NotificationItem) {
  if (notification.sentAt) {
    return { label: 'Sent', tone: 'success' as const, sub: `Delivered ${formatDateTime(notification.sentAt)}` }
  }
  if (notification.scheduledAt) {
    return { label: 'Scheduled', tone: 'accent' as const, sub: `For ${formatDateTime(notification.scheduledAt)}` }
  }
  return { label: 'Draft', tone: 'neutral' as const, sub: 'Not sent yet' }
}

export function readCount(notification: NotificationItem) {
  return notification.readBy?.length ?? 0
}
