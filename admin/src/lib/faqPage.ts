import {
  CreditCard,
  HelpCircle,
  Shield,
  Sparkles,
  User,
  type LucideIcon,
} from 'lucide-react'

import type { FaqItem } from '@/api/types'

export type PublishedFilter = '' | 'true' | 'false'
export type DraftFaq = Partial<FaqItem>

export const PUBLISHED_FILTERS: { value: PublishedFilter; label: string }[] = [
  { value: '', label: 'All status' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Hidden' },
]

export const FAQ_CATEGORY_PRESETS: {
  value: string
  label: string
  desc: string
  icon: LucideIcon
  tone: string
}[] = [
  { value: 'General', label: 'General', desc: 'App basics & accuracy', icon: HelpCircle, tone: 'text-primary bg-primary/10' },
  { value: 'Subscription', label: 'Subscription', desc: 'Plans & premium', icon: CreditCard, tone: 'text-warning bg-warning/10' },
  { value: 'Account', label: 'Account', desc: 'Login & profile', icon: User, tone: 'text-accent bg-accent/10' },
  { value: 'Privacy', label: 'Privacy', desc: 'Data & security', icon: Shield, tone: 'text-muted-foreground bg-muted' },
]

export function categoryMeta(category: string) {
  const preset = FAQ_CATEGORY_PRESETS.find((c) => c.value.toLowerCase() === category.toLowerCase())
  if (preset) return preset
  return {
    value: category,
    label: category || 'General',
    desc: 'Custom category',
    icon: Sparkles,
    tone: 'text-muted-foreground bg-muted',
  }
}

export const emptyFaq: DraftFaq = {
  question: '',
  answer: '',
  translations: {
    en: { question: '', answer: '', category: 'General' },
    hi: { question: '', answer: '', category: 'सामान्य' },
  },
  category: 'General',
  order: 0,
  published: true,
}

export function syncFaqFromTranslations(
  draft: DraftFaq,
  translations: DraftFaq['translations'],
): DraftFaq {
  const en = translations?.en
  return {
    ...draft,
    translations,
    question: en?.question || draft.question || '',
    answer: en?.answer || draft.answer || '',
    category: en?.category || draft.category || 'General',
  }
}

export function toDraft(item: FaqItem): DraftFaq {
  return {
    ...item,
    translations: item.translations ?? {
      en: { question: item.question, answer: item.answer, category: item.category },
      hi: { question: '', answer: '', category: '' },
    },
  }
}

export function validateFaq(draft: DraftFaq) {
  const question = (draft.translations?.en?.question || draft.question || '').trim()
  const answer = (draft.translations?.en?.answer || draft.answer || '').trim()
  return {
    ok: question.length > 0 && answer.length > 0,
    question: question.length > 0,
    answer: answer.length > 0,
  }
}

export function faqStats(items: FaqItem[]) {
  const published = items.filter((item) => item.published).length
  const categories = new Set(items.map((item) => item.category || 'General')).size
  return {
    total: items.length,
    published,
    hidden: items.length - published,
    categories,
  }
}

export function filterFaqItems(
  items: FaqItem[],
  opts: { search: string; category: string; published: PublishedFilter },
) {
  const q = opts.search.trim().toLowerCase()
  return items
    .filter((item) => {
      if (opts.category && item.category !== opts.category) return false
      if (opts.published === 'true' && !item.published) return false
      if (opts.published === 'false' && item.published) return false
      if (!q) return true
      const hay = [
        item.question,
        item.answer,
        item.category,
        item.translations?.en?.question,
        item.translations?.en?.answer,
        item.translations?.hi?.question,
        item.translations?.hi?.answer,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.question.localeCompare(b.question))
}

export function groupByCategory(items: FaqItem[]) {
  const map = new Map<string, FaqItem[]>()
  for (const item of items) {
    const key = item.category || 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function categoryCounts(items: FaqItem[]) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = item.category || 'General'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
