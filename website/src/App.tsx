import { ThemeProvider } from '@/theme/ThemeProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { ScrollToTopButton } from '@/components/site/ScrollToTopButton'
import { SeoHead } from '@/components/seo/SeoHead'
import { GoogleAnalytics } from '@/components/seo/GoogleAnalytics'
import { AppProviders } from '@/providers/AppProviders'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { BrowserRouter } from 'react-router-dom'

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AppProviders>
          <ErrorBoundary>
          <BrowserRouter>
            <SeoHead />
            <GoogleAnalytics />
            <SmoothScroll>
              <ScrollToTopButton />
              <AppRoutes />
            </SmoothScroll>
          </BrowserRouter>
          </ErrorBoundary>
        </AppProviders>
      </LangProvider>
    </ThemeProvider>
  )
}
