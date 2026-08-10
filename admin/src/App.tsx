import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthProvider, useAuth } from '@/store/AuthContext'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const UserDetailPage = lazy(() => import('@/pages/UserDetailPage'))
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const LibraryBookEditorPage = lazy(() => import('@/pages/LibraryBookEditorPage'))
const MediaPage = lazy(() => import('@/pages/MediaPage'))
const MediaEditorPage = lazy(() => import('@/pages/MediaEditorPage'))
const PlansPage = lazy(() => import('@/pages/PlansPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const AppConfigPage = lazy(() => import('@/pages/AppConfigPage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const FaqEditorPage = lazy(() => import('@/pages/FaqEditorPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AiCachePage = lazy(() => import('@/pages/AiCachePage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const UserActivityPage = lazy(() => import('@/pages/UserActivityPage'))
const UserActivityDetailPage = lazy(() => import('@/pages/UserActivityDetailPage'))
const ServerMonitorPage = lazy(() => import('@/pages/ServerMonitorPage'))
const ObservabilityPage = lazy(() => import('@/pages/ObservabilityPage'))
const SubscriptionsPage = lazy(() => import('@/pages/SubscriptionsPage'))
const ScreensPage = lazy(() => import('@/pages/ScreensPage'))
const ScreenEditorPage = lazy(() => import('@/pages/ScreenEditorPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function LoadingScreen() {
  return (
    <div className="grid min-h-svh place-items-center bg-background text-foreground">
      <Loader2 className="size-7 animate-spin text-primary" aria-label="Loading" />
    </div>
  )
}

function ProtectedRoute() {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <AdminLayout />
}

function GuestRoute() {
  const { token } = useAuth()
  if (token) return <Navigate to="/" replace />
  return <LoginPage />
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/login" element={<GuestRoute />} />
              <Route element={<ProtectedRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserDetailPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="library/new" element={<LibraryBookEditorPage />} />
                <Route path="library/edit/:id" element={<LibraryBookEditorPage />} />
                <Route path="media" element={<MediaPage />} />
                <Route path="media/new" element={<MediaEditorPage />} />
                <Route path="media/edit/:id" element={<MediaEditorPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="app-config" element={<AppConfigPage />} />
                <Route path="pages" element={<ScreensPage />} />
                <Route path="pages/edit/:page" element={<ScreenEditorPage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="faq/new" element={<FaqEditorPage />} />
                <Route path="faq/edit/:id" element={<FaqEditorPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="ai-cache" element={<AiCachePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="activity" element={<UserActivityPage />} />
                <Route path="activity/user/:id" element={<UserActivityDetailPage />} />
                <Route path="server-monitor" element={<ServerMonitorPage />} />
                <Route path="server-logs" element={<ObservabilityPage />} />
                <Route path="observability" element={<Navigate to="/server-logs" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
