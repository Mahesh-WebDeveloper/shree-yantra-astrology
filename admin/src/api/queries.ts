import { useQuery } from '@tanstack/react-query'

import { endpoints } from './endpoints'

export const queryKeys = {
  stats: ['stats'] as const,
  users: (params: Record<string, unknown>) => ['users', params] as const,
  books: ['books'] as const,
  media: (params: Record<string, unknown>) => ['media', params] as const,
  plans: ['plans'] as const,
  notifications: (params: Record<string, unknown>) => ['notifications', params] as const,
  appConfig: ['app-config'] as const,
  faq: ['faq'] as const,
  settings: ['settings'] as const,
  aiCache: (params: Record<string, unknown>) => ['ai-cache', params] as const,
  analytics: ['analytics'] as const,
  screens: ['screens'] as const,
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: endpoints.stats })
}

export function useUsers(params: Record<string, string | number | undefined>) {
  return useQuery({ queryKey: queryKeys.users(params), queryFn: () => endpoints.users(params) })
}

export function useBooks() {
  return useQuery({ queryKey: queryKeys.books, queryFn: endpoints.books })
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
