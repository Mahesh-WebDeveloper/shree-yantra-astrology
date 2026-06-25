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
  async updateUser(id: string, payload: Partial<Pick<User, 'name' | 'plan' | 'role' | 'blocked'>>) {
    const { data } = await apiClient.patch<{ user: User }>(`/admin/users/${id}`, payload)
    return data.user
  },
  async deleteUser(id: string) {
    await apiClient.delete(`/admin/users/${id}`)
  },
  async uploadImage(file: File) {
    const body = new FormData()
    body.set('image', file)
    const { data } = await apiClient.post<{ url: string }>('/admin/uploads/image', body)
    return data.url
  },
  async books() {
    const { data } = await apiClient.get<{ books: Book[] }>('/admin/library')
    return data.books
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
  async saveMedia(payload: Partial<MediaItem> & { thumbnailFile?: File }) {
    const body = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'thumbnailFile' || key === '_id' || value === undefined) return
      body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    })
    if (payload.thumbnailFile) body.set('image', payload.thumbnailFile)
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
  async updateScreen(page: string, payload: { label?: string; fields?: ScreenContent['fields'] }) {
    const { data } = await apiClient.put<{ screen: ScreenContent }>(`/admin/screens/${page}`, payload)
    return data.screen
  },
}

export interface ScreenContent {
  page: string
  label: string
  group: string
  order: number
  fields: Record<string, string | { en?: string; hi?: string }>
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
