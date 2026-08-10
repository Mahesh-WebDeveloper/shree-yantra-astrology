import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LEGAL_CONTACT, LEGAL_PRIVACY, LEGAL_TERMS, LEGAL_UPDATED } from '@/data/legal'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useLang } from '@/i18n/LangProvider'

function tabFromPath(pathname: string): 'privacy' | 'terms' {
  if (pathname === '/terms') return 'terms'
  return 'privacy'
}

export function LegalPage() {
  const { hi } = useLang()
  const { pathname } = useLocation()
  const [tab, setTab] = useState<'privacy' | 'terms'>(() => tabFromPath(pathname))
  const sections = tab === 'privacy' ? LEGAL_PRIVACY : LEGAL_TERMS

  useEffect(() => {
    setTab(tabFromPath(pathname))
  }, [pathname])

  return (
    <div className="page-shell showcase-page min-h-screen">
      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-28 sm:px-8">
        <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
          ← {hi ? 'होम' : 'Home'}
        </Link>
        <h1 className="mt-6 font-playfair text-3xl font-bold text-[var(--sy-text)]">
          {tab === 'privacy'
            ? hi
              ? 'गोपनीयता नीति'
              : 'Privacy Policy'
            : hi
              ? 'सेवा शर्तें'
              : 'Terms of Service'}
        </h1>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className={`showcase-tab ${tab === 'privacy' ? 'showcase-tab--on' : ''}`}
            onClick={() => setTab('privacy')}
          >
            {hi ? 'गोपनीयता' : 'Privacy'}
          </button>
          <button
            type="button"
            className={`showcase-tab ${tab === 'terms' ? 'showcase-tab--on' : ''}`}
            onClick={() => setTab('terms')}
          >
            {hi ? 'शर्तें' : 'Terms'}
          </button>
        </div>
        <p className="mt-4 text-xs text-[var(--sy-text-muted)]">{hi ? LEGAL_UPDATED.hi : LEGAL_UPDATED.en}</p>
        <div className="mt-8 space-y-8">
          {sections.map((sec, i) => (
            <section key={i}>
              <h2 className="font-display text-base font-semibold text-[var(--sy-text)]">
                {hi ? sec.h.hi : sec.h.en}
              </h2>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[var(--sy-text-soft)]">
                {hi ? sec.b.hi : sec.b.en}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-[var(--sy-text-muted)]">
          {hi ? 'संपर्क' : 'Contact'}:{' '}
          <a className="text-[var(--sy-accent)] hover:underline" href={`mailto:${LEGAL_CONTACT}`}>
            {LEGAL_CONTACT}
          </a>
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
