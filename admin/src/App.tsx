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
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const MediaPage = lazy(() => import('@/pages/MediaPage'))
const PlansPage = lazy(() => import('@/pages/PlansPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const AppConfigPage = lazy(() => import('@/pages/AppConfigPage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const AiCachePage = lazy(() => import('@/pages/AiCachePage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const ScreensPage = lazy(() => import('@/pages/ScreensPage'))

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
                <Route path="library" element={<LibraryPage />} />
                <Route path="media" element={<MediaPage />} />
                <Route path="plans" element={<PlansPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="app-config" element={<AppConfigPage />} />
                <Route path="pages" element={<ScreensPage />} />
                <Route path="faq" element={<FaqPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="ai-cache" element={<AiCachePage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
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
