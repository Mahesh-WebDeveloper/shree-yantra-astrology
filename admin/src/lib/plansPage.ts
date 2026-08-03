import type { SubscriptionPlan } from '@/api/types'

/** Default monthly plan shown in app — admin can edit; extra plans are created manually. */
export const DEFAULT_MONTHLY_PLAN = {
  name: 'Premium Monthly',
  priceINR: 499,
  durationDays: 30,
  badge: 'Monthly',
  isActive: true,
  order: 0,
  features: [
    'Full kundli, dasha & divisional charts',
    'AI Jyotishi — unlimited personalised answers',
    'Premium Divine Library & scriptures',
    'Kundli milan & advanced predictions',
    'Ad-free, priority experience',
  ],
  translations: {
    en: {
      name: 'Premium Monthly',
      badge: 'Monthly',
      features: [
        'Full kundli, dasha & divisional charts',
        'AI Jyotishi — unlimited personalised answers',
        'Premium Divine Library & scriptures',
        'Kundli milan & advanced predictions',
        'Ad-free, priority experience',
      ],
    },
    hi: {
      name: 'प्रीमियम मासिक',
      badge: 'मासिक',
      features: [
        'पूर्ण कुंडली, दशा और वर्ग चक्र',
        'AI ज्योतिषी — असीमित व्यक्तिगत उत्तर',
        'प्रीमियम दिव्य पुस्तकालय और ग्रंथ',
        'कुंडली मिलान और उन्नत भविष्यफल',
        'विज्ञापन-मुक्त, प्राथमिक अनुभव',
      ],
    },
  },
} satisfies Omit<SubscriptionPlan, '_id'>

export type DraftPlan = Partial<SubscriptionPlan> & { featuresText?: string }

export function toDraft(plan?: SubscriptionPlan): DraftPlan {
  if (!plan) {
    return {
      ...DEFAULT_MONTHLY_PLAN,
      featuresText: DEFAULT_MONTHLY_PLAN.features.join('\n'),
    }
  }
  return {
    ...plan,
    translations: plan.translations || {
      en: { name: plan.name || '', badge: plan.badge || '', features: plan.features || [] },
      hi: { name: '', badge: '', features: [] },
    },
    featuresText: plan.features.join('\n'),
  }
}

export function blankDraft(): DraftPlan {
  return {
    name: '',
    translations: { en: { name: '', badge: '', features: [] }, hi: { name: '', badge: '', features: [] } },
    priceINR: 499,
    durationDays: 30,
    badge: '',
    features: [],
    featuresText: '',
    isActive: true,
    order: 1,
  }
}

export function durationLabel(days: number) {
  if (days === 30) return 'Monthly · 30 days'
  if (days === 365) return 'Yearly · 365 days'
  if (days === 7) return 'Weekly · 7 days'
  return `${days} days`
}

export function isPrimaryMonthly(plan: SubscriptionPlan) {
  return plan.priceINR === 499 && plan.durationDays === 30
}
