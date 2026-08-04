import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { ScrollToTopButton } from '@/components/site/ScrollToTopButton'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { HomePage } from '@/pages/HomePage'

const LegalPage = lazy(() => import('@/pages/LegalPage').then((module) => ({ default: module.LegalPage })))
const HelpPage = lazy(() => import('@/pages/HelpPage').then((module) => ({ default: module.HelpPage })))

function RouteFallback() {
  return <div className="min-h-screen bg-[var(--sy-bg)]" aria-busy="true" />
}

/** Header + page shell for the standalone routes (legal, help). */
function ChromePage() {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <SmoothScroll>
            <ScrollToTopButton />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Home carries its own SiteNav — its links are in-page anchors. */}
                <Route path="/" element={<HomePage />} />
                {/* Legal & help keep the plain header (no section anchors to point at). */}
                <Route element={<ChromePage />}>
                  <Route path="/legal" element={<LegalPage />} />
                  <Route path="/privacy" element={<LegalPage />} />
                  <Route path="/privacy-security" element={<LegalPage />} />
                  <Route path="/terms" element={<LegalPage />} />
                  <Route path="/help" element={<HelpPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SmoothScroll>
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  )
}
