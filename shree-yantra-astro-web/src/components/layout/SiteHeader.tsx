import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { PLAY_STORE_URL } from '@/data/brandShowcase'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { cn } from '@/lib/cn'

const NAV = [
  { href: '/#app-tour', en: 'Features', hi: 'सुविधाएँ' },
  { href: '/#how', en: 'How it works', hi: 'कैसे काम करता है' },
  { href: '/#trust', en: 'Why Shree Yantraa', hi: 'क्यों श्री यंत्रा' },
  { href: '/#intelligence', en: 'AI + Vedic', hi: 'AI + वैदिक' },
  { href: '/#faq', en: 'FAQ', hi: 'प्रश्नोत्तर' },
]

export function SiteHeader() {
  const { toggle, theme } = useTheme()
  const { lang, setLang, hi } = useLang()
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="sy-header-wrap pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-none mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <header className={cn('sy-header pointer-events-auto', scrolled && 'sy-header--scrolled')}>
          <Link to="/" className="sy-header__brand" aria-label="Shree Yantraa Astrology home">
            <ShreeYantraLogo size={30} pulse={false} />
            <span>
              <strong>Shree Yantraa</strong>
              <small>Astrology</small>
            </span>
          </Link>

          <nav className={cn('sy-header__nav', mobileOpen && 'sy-header__nav--open')} aria-label="Primary">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={onHome ? item.href.replace('/#', '#') : item.href}
                onClick={closeMobile}
              >
                {hi ? item.hi : item.en}
              </a>
            ))}
          </nav>

          <div className="sy-header__actions">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="sy-header__utility sy-header__language"
              aria-label={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            >
              {lang === 'en' ? 'हिंदी' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggle}
              className={cn('sy-header__utility sy-header__theme', theme.isDark ? 'is-dark' : 'is-light')}
              aria-label={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme.isDark ? '☀' : '☾'}
            </button>
            <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="sy-header__download">
              <span>{hi ? 'डाउनलोड' : 'Download'}</span>
              <svg viewBox="0 0 20 20" aria-hidden>
                <path d="M10 3v10m0 0 4-4m-4 4L6 9M4 16h12" />
              </svg>
            </a>

            <button
              type="button"
              className="sy-header__utility sy-header__menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sy-header__mobile-backdrop"
            onClick={closeMobile}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </div>
  )
}