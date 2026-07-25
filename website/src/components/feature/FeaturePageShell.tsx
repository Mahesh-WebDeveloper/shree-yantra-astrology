import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { VedicIcon } from '@/components/cosmic/VedicIcon'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { serviceTintStyle } from '@/data/welcomeServices'
import { serviceForRoute } from '@/lib/featureMeta'
import { useLang } from '@/i18n/LangProvider'
import { Panel } from '@/components/ui/Panel'

export function FeaturePageShell({
  route,
  titleEn,
  titleHi,
  subtitleEn,
  subtitleHi,
  children,
}: {
  route: string
  titleEn?: string
  titleHi?: string
  subtitleEn?: string
  subtitleHi?: string
  children: ReactNode
}) {
  const { hi } = useLang()
  const svc = serviceForRoute(route)
  const title = hi ? titleHi || svc?.hi.title : titleEn || svc?.en.title
  const subtitle = hi ? subtitleHi || svc?.hi.sub : subtitleEn || svc?.en.sub
  const accent = svc?.accent ?? '#f6d27a'
  const tintKey = svc?.key ?? 'step1'

  return (
    <div className="page-shell feature-page relative min-h-screen pb-8">
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6">
        <Link to="/" className="mb-6 inline-flex text-sm font-medium text-[var(--sy-accent)] hover:underline">
          {hi ? '← होम' : '← Home'}
        </Link>
        <div className="mb-8 flex items-start gap-4">
          {svc ? (
            <span
              className="feature-page-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--sy-glass-border)]"
              style={serviceTintStyle(tintKey, accent)}
            >
              <VedicIcon name={svc.icon} size={32} className="text-[var(--svc-accent)]" />
            </span>
          ) : null}
          <SectionHeading eyebrow={hi ? 'श्री यंत्र' : 'Shree Yantra'} title={title ?? route} subtitle={subtitle} />
        </div>
        <Panel className="home-color-card feature-page-panel" style={serviceTintStyle(tintKey, accent)}>
          <span className="bento-card-shine" aria-hidden />
          {children}
        </Panel>
        <SiteFooter />
      </div>
    </div>
  )
}
