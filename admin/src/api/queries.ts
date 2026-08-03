import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { endpoints } from './endpoints'

export const queryKeys = {
  stats: ['stats'] as const,
  users: (params: Record<string, unknown>) => ['users', params] as const,
  books: ['books'] as const,
  libraryOverview: ['library-overview'] as const,
  media: (params: Record<string, unknown>) => ['media', params] as const,
  plans: ['plans'] as const,
  notifications: (params: Record<string, unknown>) => ['notifications', params] as const,
  appConfig: ['app-config'] as const,
  faq: ['faq'] as const,
  settings: ['settings'] as const,
  aiCache: (params: Record<string, unknown>) => ['ai-cache', params] as const,
  analytics: ['analytics'] as const,
  screens: ['screens'] as const,
  activityUsers: (q: string, page: number) => ['activity-users', q, page] as const,
  activityUser: (id: string) => ['activity-user', id] as const,
  activityLive: ['activity-live'] as const,
  serverMonitor: ['server-monitor'] as const,
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

export function useBooks(params?: { search?: string; published?: string }) {
  return useQuery({
    queryKey: [...queryKeys.books, params ?? {}],
    queryFn: () => endpoints.books(params),
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

export function useActivityUsers(q: string, page: number) {
  return useQuery({
    queryKey: queryKeys.activityUsers(q, page),
    queryFn: () => endpoints.activityUsers({ q: q || undefined, page, limit: 12 }),
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
