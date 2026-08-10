import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { endpoints } from './endpoints'

export const queryKeys = {
  stats: ['stats'] as const,
  users: (params: Record<string, unknown>) => ['users', params] as const,
  user: (id: string) => ['user', id] as const,
  books: ['books'] as const,
  book: (id: string) => ['book', id] as const,
  libraryOverview: ['library-overview'] as const,
  media: (params: Record<string, unknown>) => ['media', params] as const,
  mediaItem: (id: string) => ['media-item', id] as const,
  plans: ['plans'] as const,
  notifications: (params: Record<string, unknown>) => ['notifications', params] as const,
  appConfig: ['app-config'] as const,
  faq: ['faq'] as const,
  settings: ['settings'] as const,
  aiCache: (params: Record<string, unknown>) => ['ai-cache', params] as const,
  analytics: ['analytics'] as const,
  screens: ['screens'] as const,
  activityUsers: (params: Record<string, unknown>) => ['activity-users', params] as const,
  activityUser: (id: string) => ['activity-user', id] as const,
  activityUserAiChat: (id: string, params: Record<string, unknown>) => ['activity-user-ai-chat', id, params] as const,
  activityOverview: ['activity-overview'] as const,
  activityIssues: (params: Record<string, unknown>) => ['activity-issues', params] as const,
  activityLive: ['activity-live'] as const,
  serverMonitor: ['server-monitor'] as const,
  subscriptionOverview: ['subscription-overview'] as const,
  subscriptions: (params: Record<string, unknown>) => ['subscriptions', params] as const,
  subscriptionDetail: (id: string) => ['subscription-detail', id] as const,
  paymentTransactions: (params: Record<string, unknown>) => ['payment-transactions', params] as const,
  observabilityOverview: ['observability-overview'] as const,
  observabilityErrors: (params: Record<string, unknown>) => ['observability-errors', params] as const,
  observabilityError: (fp: string) => ['observability-error', fp] as const,
  observabilityApiStats: (hours: number) => ['observability-api-stats', hours] as const,
  observabilityLogs: (params: Record<string, unknown>) => ['observability-logs', params] as const,
  observabilityLog: (id: string) => ['observability-log', id] as const,
  observabilityTrace: (id: string) => ['observability-trace', id] as const,
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: endpoints.stats })
}

export function useUsers(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => endpoints.users(params),
    placeholderData: keepPreviousData,
  })
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: queryKeys.user(id || ''),
    queryFn: () => endpoints.getUser(id!),
    enabled: !!id,
  })
}

export function useBooks(params?: { search?: string; published?: string }) {
  return useQuery({
    queryKey: [...queryKeys.books, params ?? {}],
    queryFn: () => endpoints.books(params),
  })
}

export function useBook(id?: string) {
  return useQuery({
    queryKey: queryKeys.book(id || ''),
    queryFn: () => endpoints.getBook(id!),
    enabled: !!id,
  })
}

export function useLibraryOverview() {
  return useQuery({
    queryKey: queryKeys.libraryOverview,
    queryFn: endpoints.libraryOverview,
    refetchInterval: 30_000,
  })
}

export function useMedia(params: Record<string, string | undefined>) {
  return useQuery({ queryKey: queryKeys.media(params), queryFn: () => endpoints.media(params) })
}

export function useMediaItem(id?: string) {
  return useQuery({
    queryKey: queryKeys.mediaItem(id || ''),
    queryFn: () => endpoints.getMediaItem(id!),
    enabled: !!id,
  })
}

export function usePlans() {
  return useQuery({ queryKey: queryKeys.plans, queryFn: endpoints.plans })
}

export function useNotifications(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: queryKeys.notifications(params), queryFn: () => endpoints.notifications(params) })
}

export function useAppConfig() {
  return useQuery({ queryKey: queryKeys.appConfig, queryFn: endpoints.appConfig })
}

export function useFaq() {
  return useQuery({ queryKey: queryKeys.faq, queryFn: endpoints.faq })
}

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: endpoints.settings })
}

export function useAiCache(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: queryKeys.aiCache(params), queryFn: () => endpoints.aiCache(params) })
}

export function useAnalytics() {
  return useQuery({ queryKey: queryKeys.analytics, queryFn: endpoints.analytics })
}

export function useScreens() {
  return useQuery({ queryKey: queryKeys.screens, queryFn: endpoints.screens })
}

export function useActivityOverview() {
  return useQuery({
    queryKey: queryKeys.activityOverview,
    queryFn: endpoints.activityOverview,
    refetchInterval: 15_000,
  })
}

export function useActivityUsers(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.activityUsers(params),
    queryFn: () => endpoints.activityUsers(params),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  })
}

export function useActivityUser(id: string) {
  return useQuery({
    queryKey: queryKeys.activityUser(id),
    queryFn: () => endpoints.activityUser(id),
    enabled: !!id,
  })
}

export function useActivityIssues(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.activityIssues(params),
    queryFn: () => endpoints.activityIssues(params),
    refetchInterval: 12_000,
    placeholderData: keepPreviousData,
  })
}

export function useActivityUserAiChat(id: string, params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.activityUserAiChat(id, params),
    queryFn: () => endpoints.activityUserAiChat(id, params as { before?: string; limit?: number; q?: string }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useActivityLive() {
  return useQuery({
    queryKey: queryKeys.activityLive,
    queryFn: () => endpoints.activityLive(),
    refetchInterval: 5_000,
    staleTime: 0,
  })
}

export function useServerMonitor() {
  return useQuery({
    queryKey: queryKeys.serverMonitor,
    queryFn: endpoints.serverMonitor,
    refetchInterval: 4_000,
    staleTime: 0,
    placeholderData: keepPreviousData,
  })
}

export function useSubscriptionOverview() {
  return useQuery({
    queryKey: queryKeys.subscriptionOverview,
    queryFn: endpoints.subscriptionOverview,
    refetchInterval: 30_000,
  })
}

export function useSubscriptions(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.subscriptions(params),
    queryFn: () => endpoints.subscriptions(params),
    placeholderData: keepPreviousData,
  })
}

export function useSubscriptionDetail(userId: string) {
  return useQuery({
    queryKey: queryKeys.subscriptionDetail(userId),
    queryFn: () => endpoints.subscriptionDetail(userId),
    enabled: !!userId,
  })
}

export function usePaymentTransactions(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.paymentTransactions(params),
    queryFn: () => endpoints.paymentTransactions(params),
    placeholderData: keepPreviousData,
  })
}

export function useObservabilityOverview() {
  return useQuery({
    queryKey: queryKeys.observabilityOverview,
    queryFn: endpoints.observabilityOverview,
    refetchInterval: 15_000,
  })
}

export function useObservabilityErrors(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.observabilityErrors(params),
    queryFn: () => endpoints.observabilityErrors(params),
    refetchInterval: 20_000,
  })
}

export function useObservabilityApiStats(hours = 24) {
  return useQuery({
    queryKey: queryKeys.observabilityApiStats(hours),
    queryFn: () => endpoints.observabilityApiStats({ hours }),
    refetchInterval: 30_000,
  })
}

export function useObservabilityLogs(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: queryKeys.observabilityLogs(params),
    queryFn: () => endpoints.observabilityLogs(params),
    refetchInterval: 10_000,
  })
}

export function useObservabilityLog(id: string | null) {
  return useQuery({
    queryKey: queryKeys.observabilityLog(id || ''),
    queryFn: () => endpoints.observabilityLog(id!),
    enabled: !!id,
  })
}
