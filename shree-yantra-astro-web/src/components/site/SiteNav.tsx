import { useCallback, useEffect, useRef, useState } from 'react'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { scrollToHash, scrollToTop } from './hooks/useSiteMotion'

type NavItem = { id: string; hi: string; en: string }

const NAV_ITEMS: NavItem[] = [
  { id: 'features', hi: 'ऐप की विशेषताएँ', en: 'App features' },
  { id: 'accuracy', hi: 'गणना का आधार', en: 'Methodology' },
  { id: 'library', hi: 'धार्मिक पुस्तकालय', en: 'Library' },
  { id: 'faq', hi: 'सामान्य प्रश्न', en: 'FAQ' },
]

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

export function SiteNav() {
  const { hi, setLang } = useLang()
  const { name: themeName, toggle: toggleTheme } = useTheme()
  const [solid, setSolid] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const burgerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        setSolid(window.scrollY > 28)
        // Scroll-spy: the last section whose top has passed the upper third.
        const mark = window.scrollY + window.innerHeight * 0.34
        let current: string | null = null
        for (const item of NAV_ITEMS) {
          const el = document.getElementById(item.id)
          if (el && el.getBoundingClientRect().top + window.scrollY <= mark) current = item.id
        }
        setActive(current)
        raf = 0
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Lock the page behind the mobile menu, close on Escape, keep focus
  // trapped inside the dialog, and hand focus back to the burger on close.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const root = menuRef.current
      if (!root) return
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement as HTMLElement | null
      const inside = !!current && root.contains(current)
      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (!inside || current === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      burgerRef.current?.focus()
    }
  }, [menuOpen])

  const go = useCallback((hash: string) => {
    setMenuOpen(false)
    // let the overlay unmount before measuring
    requestAnimationFrame(() => {
      if (hash === '#top' || !scrollToHash(hash)) scrollToTop()
    })
  }, [])

  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <>
      <header className={`sy-nav sy-site${solid ? ' sy-nav--solid' : ''}`}>
        <nav className="sy-container sy-nav__bar" aria-label={t('मुख्य नेविगेशन', 'Main navigation')}>
          <a
            className="sy-nav__brand"
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              go('#top')
            }}
          >
            <ShreeYantraLogo size={34} pulse={false} />
            <span>
              <span className="sy-nav__word">Shree Yantra</span>
              <span className="sy-nav__tag">{t('वैदिक ज्योतिष', 'Vedic Astrology')}</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="sy-nav__link"
                aria-current={active === item.id ? 'true' : undefined}
                onClick={() => go(`#${item.id}`)}
              >
                {t(item.hi, item.en)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label={t('भाषा', 'Language')}>
              <button
                type="button"
                className={`sy-nav__icon sy-nav__icon--deva${hi ? ' sy-nav__icon--on' : ''}`}
                onClick={() => setLang('hi')}
                aria-pressed={hi}
                lang="hi"
              >
                हिं
              </button>
              <button
                type="button"
                className={`sy-nav__icon${!hi ? ' sy-nav__icon--on' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={!hi}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              className="sy-nav__icon"
              onClick={toggleTheme}
              aria-label={
                themeName === 'dark' ? t('लाइट मोड चुनें', 'Switch to light mode') : t('डार्क मोड चुनें', 'Switch to dark mode')
              }
            >
              {themeName === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <a
              className="sy-btn-gold sy-btn-sm hidden sm:inline-flex"
              href="#download"
              onClick={(e) => {
                e.preventDefault()
                go('#download')
              }}
            >
              {t('ऐप डाउनलोड करें', 'Download app')}
            </a>

            <button
              type="button"
              ref={burgerRef}
              className="sy-nav__icon sy-nav__burger lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={t('मेन्यू खोलें', 'Open menu')}
              aria-expanded={menuOpen}
            >
              <span className="block">
                <span />
                <span />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div
          className="sy-menu sy-site"
          role="dialog"
          aria-modal="true"
          aria-label={t('मेन्यू', 'Menu')}
          ref={menuRef}
        >
          <div className="sy-nav__bar">
            <span className="sy-nav__brand">
              <ShreeYantraLogo size={34} pulse={false} />
              <span className="sy-nav__word">Shree Yantra</span>
            </span>
            <button
              type="button"
              className="sy-nav__icon"
              onClick={() => setMenuOpen(false)}
              aria-label={t('मेन्यू बंद करें', 'Close menu')}
              autoFocus
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="mt-6 flex-1">
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className="sy-menu__item"
                style={{ animationDelay: `${60 + i * 55}ms` }}
                onClick={() => go(`#${item.id}`)}
              >
                <span className="sy-menu__index">{`0${i + 1}`}</span>
                {t(item.hi, item.en)}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              className="sy-btn-gold w-full"
              href="#download"
              onClick={(e) => {
                e.preventDefault()
                go('#download')
              }}
            >
              {t('Android ऐप डाउनलोड करें', 'Download the Android app')}
            </a>
            <p className="sy-micro text-center">
              {t('Android के लिए • भारत में बना', 'For Android • Made in India')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
