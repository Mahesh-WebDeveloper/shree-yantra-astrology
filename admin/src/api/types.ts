export type Role = 'user' | 'admin'
export type Plan = 'free' | 'premium'
export type Lang = 'en' | 'hi'
export type Localized<T> = {
  en: T
  hi: T
}
export type TextTranslation = Localized<Record<string, string>>

export type User = {
  id: string
  _id?: string
  name: string
  email: string | null
  phone: string | null
  providers: string[]
  emailVerified: boolean
  phoneVerified: boolean
  interests: string[]
  profile: Record<string, unknown>
  plan: Plan
  role: Role
  blocked: boolean
  createdAt: string
  updatedAt?: string
  lastLoginAt?: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export type Stats = {
  totalUsers: number
  newUsersLast7Days: number
  premiumUsers: number
  freeUsers: number
  signups: Array<{ date: string; count: number }>
  providers: Array<{ provider: string; count: number }>
  cachedKundliCount: number
  aiCacheCount: number
}

export type BookChapter = {
  _id?: string
  title: string
  translations?: TextTranslation
  order: number
  content: string
  audioUrl: string
}

export type Book = {
  _id: string
  title: string
  author: string
  translations?: TextTranslation
  coverImage: string
  category: string
  description: string
  language: string
  chapters: BookChapter[]
  isPremium: boolean
  published: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export type SubscriptionPlan = {
  _id: string
  name: string
  translations?: {
    en: { name: string; badge: string; features: string[] }
    hi: { name: string; badge: string; features: string[] }
  }
  priceINR: number
  durationDays: number
  features: string[]
  badge: string
  isActive: boolean
  order: number
}

export type NotificationItem = {
  _id: string
  title: string
  body: string
  translations?: TextTranslation
  type: 'promo' | 'account' | 'prediction'
  audience: 'all' | 'premium' | 'free' | 'user'
  targetUserId?: string
  scheduledAt?: string
  sentAt?: string
  readBy?: Array<{ user: string; readAt: string }>
  createdAt: string
}

export type ImageItem = {
  _id?: string
  title: string
  subtitle: string
  translations?: TextTranslation
  imageUrl: string
  link: string
  order: number
  isActive: boolean
}

export type FeaturedContent = {
  _id?: string
  type: string
  refId?: string
  title: string
  translations?: TextTranslation
  order: number
}

export type AppConfig = {
  _id: string
  onboardingSlides: ImageItem[]
  homeBanners: ImageItem[]
  featuredContent: FeaturedContent[]
  support: { email: string; phone: string }
  branding?: {
    appName: string
    tagline: string
    logoUrl: string
    primaryColor: string
    accentColor: string
    translations?: TextTranslation
  }
  appVersion: string
  featureFlags: Record<string, unknown>
}

export type FaqItem = {
  _id: string
  question: string
  answer: string
  translations?: TextTranslation
  category: string
  order: number
  published: boolean
}

export type MediaCategory = 'mantra' | 'spiritual_music' | 'bhajan'
export type MediaSourceType = 'audio' | 'youtube' | 'external'

export type MediaItem = {
  _id: string
  title: string
  subtitle: string
  artist: string
  translations?: TextTranslation
  category: MediaCategory
  subCategory: string
  language: string
  sourceType: MediaSourceType
  audioUrl: string
  youtubeVideoId: string
  youtubeUrl: string
  thumbnailImage: string
  durationText: string
  sourceName: string
  sourceUrl: string
  licenseName: string
  licenseUrl: string
  attribution: string
  rightsNote: string
  tags: string[]
  isPremium: boolean
  published: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}

export type YouTubeResult = Pick<MediaItem, 'title' | 'subtitle' | 'artist' | 'category' | 'sourceType' | 'youtubeVideoId' | 'youtubeUrl' | 'thumbnailImage'> & {
  publishedAt?: string
}

export type Settings = {
  vedastroTier: 'free' | 'paid'
  hasApiKey: boolean
  keyStatus: {
    vedastroKeySet: boolean
    geminiKeySet: boolean
    claudeKeySet: boolean
  }
  ayanamsa: string
  authMethods: {
    password: boolean
    otp: boolean
    google: boolean
    apple: boolean
  }
  aiProvider: 'gemini' | 'claude'
  updatedAt: string
}

export type AiCacheItem = {
  _id: string
  cacheKey: string
  type: string
  data: unknown
  createdAt: string
  updatedAt: string
}
