import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { LangProvider } from '@/i18n/LangProvider'
import { SmoothScroll } from '@/components/layout/SmoothScroll'
import { SiteNav } from '@/components/site/SiteNav'
import { Hero } from '@/components/site/Hero'
import { LiveProof } from '@/components/site/LiveProof'
import { AccuracyManifesto } from '@/components/site/AccuracyManifesto'
import { SiteFooterNew } from '@/components/site/SiteFooterNew'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LangProvider>
        <BrowserRouter>
          <SmoothScroll>
            <SiteNav />
            <main>
              <Hero />
              <LiveProof />
              <AccuracyManifesto />
              <section id="download" className="sy-section sy-container">
                <p className="sy-eyebrow">placeholder</p>
                <h2 className="sy-h2 mt-4">Download section (other agent)</h2>
              </section>
            </main>
            <SiteFooterNew />
          </SmoothScroll>
        </BrowserRouter>
      </LangProvider>
    </ThemeProvider>
  </StrictMode>,
)
