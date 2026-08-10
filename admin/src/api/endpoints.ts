import { apiClient } from './client'
import type {
  AiCacheItem,
  AppConfig,
  Book,
  FaqItem,
  MediaCategory,
  MediaItem,
  NotificationItem,
  Pagination,
  Settings,
  Stats,
  SubscriptionPlan,
  User,
  YouTubeResult,
} from './types'

type UserListResponse = { users: User[]; pagination: Pagination }
type CacheListResponse = { items: AiCacheItem[]; pagination: Pagination }
type NotificationListResponse = { notifications: NotificationItem[]; pagination: Pagination }

export const endpoints = {
  async login(payload: { email: string; password: string }) {
    const { data } = await apiClient.post<{ token: string; admin: User }>('/admin/login', payload)
    return data
  },
  async stats() {
    const { data } = await apiClient.get<Stats>('/admin/stats')
    return data
  },
  async users(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<UserListResponse>('/admin/users', { params })
    return data
  },
  async getUser(id: string) {
    const { data } = await apiClient.get<{ user: User }>(`/admin/users/${id}`)
    return data.user
  },
  async updateUser(id: string, payload: Partial<Pick<User, 'name' | 'plan' | 'role' | 'blocked'>>) {
    const { data } = await apiClient.patch<{ user: User }>(`/admin/users/${id}`, payload)
    return data.user
  },
  async deleteUser(id: string) {
    await apiClient.delete(`/admin/users/${id}`)
  },
  async bulkDeleteUsers(ids: string[]) {
    const { data } = await apiClient.post<{ deleted: number; skipped: { id: string; reason: string }[]; ids: string[] }>(
      '/admin/users/bulk-delete',
      { ids },
    )
    return data
  },
  async uploadImage(file: File) {
    const body = new FormData()
    body.set('image', file)
    const { data } = await apiClient.post<{ url: string }>('/admin/uploads/image', body)
    return data.url
  },
  async books(params?: { search?: string; published?: string }) {
    const { data } = await apiClient.get<{ books: Book[]; live?: boolean; source?: string }>('/admin/library', { params })
    return data.books
  },
  async getBook(id: string) {
    const { data } = await apiClient.get<{ book: Book }>(`/admin/library/${id}`)
    return data.book
  },
  async libraryOverview() {
    const { data } = await apiClient.get<LibraryOverviewResponse>('/admin/library/overview')
    return data
  },
  async saveBook(payload: Partial<Book> & { coverFile?: File }) {
    const body = new FormData()
    if (payload._id) body.set('_id', payload._id)
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'coverFile' || key === '_id' || value === undefined) return
      body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    })
    if (payload.coverFile) body.set('coverImage', payload.coverFile)
    const url = payload._id ? `/admin/library/${payload._id}` : '/admin/library'
    const method = payload._id ? apiClient.patch : apiClient.post
    const { data } = await method<{ book: Book }>(url, body)
    return data.book
  },
  async deleteBook(id: string) {
    await apiClient.delete(`/admin/library/${id}`)
  },
  async reorderBooks(items: Array<{ id: string; order: number }>) {
    const { data } = await apiClient.patch<{ books: Book[] }>('/admin/library/reorder', { items })
    return data.books
  },
  async media(params?: { category?: MediaCategory; search?: string; subCategory?: string; published?: string }) {
    const { data } = await apiClient.get<{ media: MediaItem[] }>('/admin/media', { params })
    return data.media
  },
  async getMediaItem(id: string) {
    const { data } = await apiClient.get<{ mediaItem: MediaItem }>(`/admin/media/${id}`)
    return data.mediaItem
  },
  async saveMedia(payload: Partial<MediaItem> & { thumbnailFile?: File; audioFile?: File; videoFile?: File }) {
    const body = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'thumbnailFile' || key === 'audioFile' || key === 'videoFile' || key === '_id' || value === undefined) return
      body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    })
    if (payload.thumbnailFile) body.set('image', payload.thumbnailFile)
    if (payload.audioFile) body.set('audioFile', payload.audioFile)
    if (payload.videoFile) body.set('videoFile', payload.videoFile)
    const url = payload._id ? `/admin/media/${payload._id}` : '/admin/media'
    const method = payload._id ? apiClient.patch : apiClient.post
    const { data } = await method<{ mediaItem: MediaItem }>(url, body)
    return data.mediaItem
  },
  async deleteMedia(id: string) {
    await apiClient.delete(`/admin/media/${id}`)
  },
  async youtubeSearch(params: { q: string; category: MediaCategory; limit?: number }) {
    const { data } = await apiClient.get<{ results: YouTubeResult[] }>('/admin/media/youtube/search', { params })
    return data.results
  },
  async plans() {
    const { data } = await apiClient.get<{ plans: SubscriptionPlan[] }>('/admin/plans')
    return data.plans
  },
  async savePlan(payload: Partial<SubscriptionPlan>) {
    const url = payload._id ? `/admin/plans/${payload._id}` : '/admin/plans'
    const method = payload._id ? apiClient.patch : apiClient.post
    const { data } = await method<{ plan: SubscriptionPlan }>(url, payload)
    return data.plan
  },
  async deletePlan(id: string) {
    await apiClient.delete(`/admin/plans/${id}`)
  },
  async notifications(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<NotificationListResponse>('/admin/notifications', { params })
    return data
  },
  async createNotification(payload: Partial<NotificationItem> & { sendNow?: boolean }) {
    const { data } = await apiClient.post<{ notification: NotificationItem }>('/admin/notifications', payload)
    return data.notification
  },
  async updateNotification(id: string, payload: Partial<NotificationItem>) {
    const { data } = await apiClient.patch<{ notification: NotificationItem }>(`/admin/notifications/${id}`, payload)
    return data.notification
  },
  async sendNotification(id: string) {
    const { data } = await apiClient.post<{ notification: NotificationItem }>(`/admin/notifications/${id}/send`)
    return data.notification
  },
  async deleteNotification(id: string) {
    await apiClient.delete(`/admin/notifications/${id}`)
  },
  async appConfig() {
    const { data } = await apiClient.get<{ config: AppConfig }>('/admin/app-config')
    return data.config
  },
  async updateAppConfig(payload: Partial<AppConfig>) {
    const { data } = await apiClient.put<{ config: AppConfig }>('/admin/app-config', payload)
    return data.config
  },
  async faq() {
    const { data } = await apiClient.get<{ faq: FaqItem[] }>('/admin/faq')
    return data.faq
  },
  async saveFaq(payload: Partial<FaqItem>) {
    const url = payload._id ? `/admin/faq/${payload._id}` : '/admin/faq'
    const method = payload._id ? apiClient.patch : apiClient.post
    const { data } = await method<{ faqItem: FaqItem }>(url, payload)
    return data.faqItem
  },
  async deleteFaq(id: string) {
    await apiClient.delete(`/admin/faq/${id}`)
  },
  async settings() {
    const { data } = await apiClient.get<Settings>('/settings')
    return data
  },
  async updateSettings(payload: Partial<Pick<Settings, 'vedastroTier' | 'aiProvider'>>) {
    const { data } = await apiClient.patch<Partial<Settings>>('/settings', payload)
    return data
  },
  async updateAuthMethods(payload: Partial<Settings['authMethods']>) {
    const { data } = await apiClient.patch<{ authMethods: Settings['authMethods'] }>('/settings/auth-methods', payload)
    return data.authMethods
  },
  async aiCache(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<CacheListResponse>('/admin/ai-cache', { params })
    return data
  },
  async deleteAiCache(id: string) {
    await apiClient.delete(`/admin/ai-cache/${id}`)
  },
  async analytics() {
    const { data } = await apiClient.get<AnalyticsStats>('/admin/analytics')
    return data
  },
  async screens() {
    const { data } = await apiClient.get<{ screens: ScreenContent[] }>('/admin/screens')
    return data.screens
  },
  async activityOverview() {
    const { data } = await apiClient.get<ActivityOverview>('/admin/activity/overview')
    return data
  },
  async activityUsers(params: {
    q?: string
    page?: number
    limit?: number
    sort?: string
    plan?: string
    online?: string
    hasErrors?: string
    hasAi?: string
  }) {
    const { data } = await apiClient.get<ActivityUsersResponse>('/admin/activity/users', { params })
    return data
  },
  async activityUser(id: string, before?: string) {
    const { data } = await apiClient.get<ActivityUserDetail>(`/admin/activity/user/${id}`, {
      params: before ? { before } : undefined,
    })
    return data
  },
  async activityLive(since?: string) {
    const { data } = await apiClient.get<ActivityLiveResponse>('/admin/activity/live', {
      params: since ? { since } : undefined,
    })
    return data
  },
  async activityIssues(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<ActivityIssuesResponse>('/admin/activity/issues', { params })
    return data
  },
  async activityUserAiChat(id: string, params?: { before?: string; limit?: number; q?: string }) {
    const { data } = await apiClient.get<ActivityAiChatResponse>(`/admin/activity/user/${id}/ai-chat`, { params })
    return data
  },
  async serverMonitor() {
    const { data } = await apiClient.get<import('./serverMonitor.types').ServerMonitorResponse>('/admin/server-monitor')
    return data
  },
  async observabilityOverview() {
    const { data } = await apiClient.get<ObservabilityOverview>('/admin/observability/overview')
    return data
  },
  async observabilityErrors(params?: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<ObservabilityErrorsResponse>('/admin/observability/errors', { params })
    return data
  },
  async observabilityError(fingerprint: string) {
    const { data } = await apiClient.get<{ group: ObservabilityErrorGroup; recentLogs: ObservabilityLogRow[] }>(
      `/admin/observability/errors/${fingerprint}`,
    )
    return data
  },
  async updateObservabilityError(fingerprint: string, payload: { status?: string; assigned_to?: string; notes?: string }) {
    const { data } = await apiClient.patch<{ group: ObservabilityErrorGroup }>(`/admin/observability/errors/${fingerprint}`, payload)
    return data.group
  },
  async observabilityApiStats(params?: { hours?: number }) {
    const { data } = await apiClient.get<{ endpoints: ObservabilityApiEndpoint[] }>('/admin/observability/api-stats', { params })
    return data
  },
  async observabilityLogs(params?: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<ObservabilityLogsResponse>('/admin/observability/logs', { params })
    return data
  },
  async observabilityLog(id: string) {
    const { data } = await apiClient.get<{ log: ObservabilityLogRow; traceTimeline: ObservabilityLogRow[] }>(
      `/admin/observability/logs/${id}`,
    )
    return data
  },
  async deleteObservabilityLog(id: string) {
    const { data } = await apiClient.delete<{ deleted: boolean; id: string }>(`/admin/observability/logs/${id}`)
    return data
  },
  async deleteAllObservabilityLogs(params?: Record<string, string | number | undefined>) {
    const { data } = await apiClient.delete<{ deleted: number }>('/admin/observability/logs', { params })
    return data
  },
  async deleteBulkObservabilityLogs(ids: string[]) {
    const { data } = await apiClient.post<{ deleted: number }>('/admin/observability/logs/bulk-delete', { ids })
    return data
  },
  async observabilityTrace(requestId: string) {
    const { data } = await apiClient.get<{ requestId: string; metric: unknown; timeline: ObservabilityLogRow[] }>(
      `/admin/observability/trace/${encodeURIComponent(requestId)}`,
    )
    return data
  },
  async updateScreen(page: string, payload: { label?: string; fields?: ScreenContent['fields'] }) {
    const { data } = await apiClient.put<{ screen: ScreenContent }>(`/admin/screens/${page}`, payload)
    return data.screen
  },
  async subscriptionOverview() {
    const { data } = await apiClient.get<SubscriptionOverview>('/admin/subscriptions/overview')
    return data
  },
  async subscriptions(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<SubscriptionListResponse>('/admin/subscriptions', { params })
    return data
  },
  async subscriptionDetail(userId: string) {
    const { data } = await apiClient.get<SubscriptionDetailResponse>(`/admin/subscriptions/${userId}`)
    return data
  },
  async paymentTransactions(params: Record<string, string | number | undefined>) {
    const { data } = await apiClient.get<PaymentTransactionListResponse>('/admin/payments/transactions', { params })
    return data
  },
}

export interface ScreenContent {
  page: string
  label: string
  group: string
  order: number
  fields: Record<string, string | { en?: string; hi?: string }>
  defaults?: Record<string, string | { en?: string; hi?: string }>
  fieldMeta?: Record<string, { hint?: string }>
  effective?: Record<string, { en?: string; hi?: string } | string>
  sources?: Record<string, 'default' | 'custom'>
  appConfigLinks?: Array<{ label: string; path: string }>
  appConfigPreview?: Record<string, unknown> | null
  updatedAt?: string
}

export interface ActivityOverview {
  onlineUsers: number
  onlineDevices: number
  aiAsksToday: number
  aiAsks7d: number
  errorsToday: number
  errors7d: number
  chatTurnsTotal: number
  usersWithErrors7d: number
  usersWithAiChat: number
}

export interface ActivityUser {
  id: string
  name?: string
  deleted?: boolean   // account delete ho chuka, par activity data maujood hai
  phone?: string
  email?: string
  plan: 'free' | 'premium'
  blocked?: boolean
  avatar?: string
  joinedAt?: string
  online: boolean
  lastSeen?: string
  lastScreen?: string
  lastEvent?: string
  device?: string
  platform?: string
  osVersion?: string
  appVersion?: string
  city?: string
  country?: string
  locSource?: 'gps' | 'ip' | null
  events: number
  sessions: number
  devices: number
  errorEvents?: number
  aiEvents?: number
  aiTurns?: number
}

export interface ActivityUsersResponse {
  users: ActivityUser[]
  total: number
  page: number
  onlineNow: number
}

export interface ActivityTimelineEvent {
  _id: string
  name: string
  screen?: string
  props?: Record<string, unknown>
  platform?: string
  city?: string
  country?: string
  deviceBrand?: string
  deviceModel?: string
  sessionId?: string
  createdAt: string
}

export interface ActivityUserDetail {
  user: {
    id: string
    name?: string
    deleted?: boolean   // account delete ho chuka, par activity data maujood hai
    phone?: string
    email?: string
    plan: 'free' | 'premium'
    blocked?: boolean
    joinedAt?: string
    lastLoginAt?: string
    interests?: string[]
    avatar?: string
    place?: string
  }
  summary: { events: number; sessions: number; firstSeen?: string; lastSeen?: string; online: boolean; errorEvents?: number; aiEvents?: number }
  ai?: { turns: number; lastAt?: string | null; lastQuestion?: string | null; analyticsAsks?: number }
  errors?: ActivityTimelineEvent[]
  recentAi?: ActivityAiTurn[]
  devices: { deviceId: string; device?: string; platform?: string; osVersion?: string; appVersion?: string; lastSeen?: string; events: number }[]
  locations: { city?: string; region?: string; country?: string; locSource?: 'gps' | 'ip' | null; count: number; lastSeen?: string }[]
  topScreens: { screen: string; count: number }[]
  perDay: { date: string; count: number }[]
  timeline: ActivityTimelineEvent[]
}

export interface ActivityAiTurn {
  id: string
  question: string
  response?: Record<string, unknown> | null
  error?: string | null
  lang?: string
  createdAt: string
}

export interface ActivityAiChatResponse {
  turns: ActivityAiTurn[]
  hasMore: boolean
}

export interface ActivityIssue {
  _id: string
  name: string
  screen?: string | null
  props?: Record<string, unknown> | null
  platform?: string | null
  appVersion?: string | null
  city?: string | null
  country?: string | null
  device?: string | null
  createdAt: string
  userId?: string | null
  userName?: string | null
  userPlan?: 'free' | 'premium' | null
  userPhone?: string | null
}

export interface ActivityIssuesResponse {
  issues: ActivityIssue[]
  total: number
  page: number
}

export interface ActivityLiveEvent {
  _id: string
  name: string
  screen?: string
  props?: Record<string, unknown>
  user?: string
  userName?: string
  userPlan?: 'free' | 'premium'
  deviceId?: string
  platform?: string
  city?: string
  country?: string
  createdAt: string
}

export interface ActivityLiveResponse {
  now: string
  onlineUsers: number
  onlineDevices: number
  events: ActivityLiveEvent[]
}

export interface LibraryOverviewResponse {
  live: boolean
  at: string
  source: string
  cmsBooks: { total: number; published: number }
  scriptures: {
    gitaChapters: number
    ramayanSargas: number
    ramcharitmanasKandas: number
    rigvedaSuktas: number
    vedaTextSections: number
    vedaBreakdown: { veda: string; sections: number }[]
  }
  media: { total: number; published: number; byCategory: { category: string; count: number }[] }
  appUsage: { userDataProfiles: number }
}

export interface AnalyticsStats {
  totals: { totalEvents: number; eventsToday: number; events7d: number }
  activeDevices: { today: number; last7Days: number; last30Days: number }
  activeUsers: { today: number; last7Days: number }
  perDay: { date: string; count: number; devices: number }[]
  topScreens: { screen: string; count: number }[]
  platforms: { platform: string; count: number }[]
  countries: { country: string; count: number }[]
  cities: { city: string; country?: string; count: number }[]
  recent: { _id: string; name: string; screen?: string; platform?: string; city?: string; country?: string; createdAt: string }[]
}

export interface SubscriptionOverview {
  at: string
  pricing: { trialInr: number; trialDays: number; monthlyInr: number; currency: string }
  subscriptions: {
    total: number
    activePremium: number
    trialActive: number
    trialStarted: number
    convertedAfterTrial: number
    conversionRatePercent: number
    cancelled: number
  }
  revenue: {
    totalInr: number
    totalPaise: number
    trialInr: number
    recurringInr: number
    transactionCount: number
    trialPayments: number
    recurringPayments: number
  }
  paymentMethods: { method: string; count: number; totalInr: number }[]
  dailyRevenue: { date: string; totalInr: number; count: number }[]
  topPayers: { user: { id: string; name: string; email?: string; phone?: string } | null; totalInr: number; payments: number }[]
  recentTransactions: PaymentTransactionRow[]
  webhooks: Record<string, number>
  milestones: {
    firstSubscriber: { user: { id: string; name: string; email?: string } | null; at: string } | null
    latestSubscriber: { user: { id: string; name: string; email?: string } | null; at: string } | null
  }
}

export interface PaymentTransactionRow {
  id: string
  userId: string
  providerPaymentId: string
  providerSubscriptionId: string
  providerInvoiceId: string
  providerOrderId: string
  amountPaise: number
  amountInr: number
  currency: string
  status: string
  captured: boolean
  method: string
  methodLabel?: string
  bank: string
  wallet: string
  vpa: string
  cardLast4: string
  cardNetwork: string
  email: string
  contact: string
  isTrial: boolean
  billingPeriodType: string
  eventType: string
  capturedAt: string
  createdAt: string
  user?: { id: string; name: string; email?: string; phone?: string } | null
}

export interface SubscriptionRow {
  subscription: {
    id: string
    userId: string
    providerSubscriptionId: string
    status: string
    entitlementActive: boolean
    initialPeriodType: string
    trialConsumedAt?: string
    checkoutVerifiedAt?: string
    startAt?: string
    currentPeriodEnd?: string
    nextChargeAt?: string
    accessUntil?: string
    cancelAtCycleEnd: boolean
    paidCount: number
    lastPaymentId: string
    createdAt: string
    updatedAt: string
  }
  user: { id: string; name: string; email?: string; phone?: string; plan: string; createdAt?: string } | null
  totalPaidInr: number
  paymentCount: number
  lastPaymentAt?: string | null
  segment: string
}

export interface SubscriptionListResponse {
  subscriptions: SubscriptionRow[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface SubscriptionDetailResponse {
  user: { id: string; name: string; email?: string; phone?: string; plan: string; createdAt?: string }
  subscription: SubscriptionRow['subscription'] | null
  summary: { totalPaidInr: number; paymentCount: number; trialPayments: number; recurringPayments: number }
  transactions: PaymentTransactionRow[]
  webhooks: { id: string; eventType: string; status: string; error: string; createdAt: string; processedAt?: string }[]
}

export interface PaymentTransactionListResponse {
  transactions: PaymentTransactionRow[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export interface ObservabilityOverview {
  requestsLastHour: number
  errorsLastHour: number
  slowLastHour: number
  errorRatePct: number
  openErrorGroups: number
  newErrorGroups24h: number
  host: { cpu?: { usagePct?: number }; memory?: { usagePct?: number }; disk?: { usagePct?: number } } | null
}

export interface ObservabilityErrorGroup {
  fingerprint: string
  title: string
  error_code?: string
  error_name?: string
  route?: string
  severity: string
  status: string
  occurrence_count: number
  affected_users: number
  platforms?: string[]
  app_versions?: string[]
  first_seen: string
  last_seen: string
  last_request_id?: string
  last_trace_id?: string
  stack_sample?: string
  assigned_to?: string
  notes?: string
}

export interface ObservabilityErrorsResponse {
  items: ObservabilityErrorGroup[]
  total: number
  page: number
}

export interface ObservabilityApiEndpoint {
  method: string
  route: string
  requests: number
  errorPct: number
  avgMs: number
  p95Ms: number
  lastError?: string | null
}

export interface ObservabilityLogRow {
  _id: string
  timestamp: string
  level: string
  service?: string
  environment?: string
  event_name: string
  message: string
  request_id?: string
  trace_id?: string
  span_id?: string
  user_id?: string
  session_id?: string
  route?: string
  method?: string
  status_code?: number
  duration_ms?: number
  app_version?: string
  platform?: string
  os_version?: string
  device_brand?: string
  device_model?: string
  error_code?: string
  error_name?: string
  stack?: string
  metadata?: Record<string, unknown>
  client_source?: 'mobile' | 'website' | 'admin' | 'server' | 'unknown'
}

export interface ObservabilityLogsResponse {
  logs: ObservabilityLogRow[]
  total: number
  page: number
  limit?: number
  pages?: number
}
