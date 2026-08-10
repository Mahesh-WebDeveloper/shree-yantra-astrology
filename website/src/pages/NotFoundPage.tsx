import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useLang } from '@/i18n/LangProvider'

export function NotFoundPage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page flex min-h-screen flex-col">
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-5 pb-16 pt-28 text-center sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sy-accent)]">404</p>
        <h1 className="mt-4 font-playfair text-3xl font-bold text-[var(--sy-text)]">
          {hi ? 'पृष्ठ नहीं मिला' : 'Page not found'}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
          {hi
            ? 'यह URL मौजूद नहीं है। होम पर लौटें या ऐप की मुख्य सेवाएँ देखें।'
            : 'This URL does not exist. Return home or browse main app services.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="showcase-tab showcase-tab--on px-5 py-2">
            {hi ? 'होम' : 'Home'}
          </Link>
          <Link to="/services" className="showcase-tab px-5 py-2">
            {hi ? 'सेवाएँ' : 'Services'}
          </Link>
          <Link to="/app" className="showcase-tab px-5 py-2">
            {hi ? 'ऐप' : 'App'}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
