import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FAQ_ITEMS, FEATURE_JOURNEYS, PLAY_STORE_URL, PRODUCT_SCREENS } from '@/data/brandShowcase'
import { trackEvent } from '@/components/seo/GoogleAnalytics'
import { useLang } from '@/i18n/LangProvider'

export function AppLandingPage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page min-h-screen">
        <main className="mx-auto max-w-[840px] px-5 pb-16 pt-28 sm:px-8">
          <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
            ← {hi ? 'होम' : 'Home'}
          </Link>
          <h1 className="mt-6 font-playfair text-3xl font-bold text-[var(--sy-text)] sm:text-4xl">
            {hi ? 'श्री यंत्र एस्ट्रोलॉजी ऐप' : 'Shree Yantra Astrology App'}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--sy-text-soft)]">
            {hi
              ? 'Android के लिए एक आधुनिक वैदिक ज्योतिष ऐप — कुंडली, राशिफल, पंचांग, मुहूर्त, कुंडली मिलान, अंकशास्त्र, वास्तु और दिव्य पुस्तकालय एक ही अनुभव में।'
              : 'A modern Vedic astrology app for Android — Kundli, Rashifal, Panchang, Muhurat, Kundli Milan, numerology, Vastu and a sacred library in one experience.'}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="showcase-tab showcase-tab--on px-5 py-2.5 text-sm font-semibold"
              onClick={() => trackEvent('app_download_click', { source: 'app_landing', platform: 'play_store' })}
            >
              {hi ? 'Google Play से डाउनलोड करें' : 'Download on Google Play'}
            </a>
            <Link to="/shree-yantra" className="showcase-tab px-5 py-2.5 text-sm font-semibold">
              {hi ? 'श्री यंत्र गाइड' : 'Shree Yantra guide'}
            </Link>
            <Link to="/kundli" className="showcase-tab px-5 py-2.5 text-sm font-semibold">
              {hi ? 'वेब पर कुंडली' : 'Kundli on web'}
            </Link>
          </div>

          <section className="mt-12" aria-labelledby="app-screens">
            <h2 id="app-screens" className="font-display text-xl font-semibold text-[var(--sy-text)]">
              {hi ? 'मुख्य स्क्रीन' : 'Core app screens'}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {PRODUCT_SCREENS.map((screen) => (
                <li key={screen.id} className="sy-stat-tile">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--sy-accent)]">
                    {hi ? screen.eyebrow.hi : screen.eyebrow.en}
                  </p>
                  <h3 className="mt-1 font-semibold text-[var(--sy-text)]">{hi ? screen.title.hi : screen.title.en}</h3>
                  <p className="mt-2 text-sm text-[var(--sy-text-soft)]">{hi ? screen.body.hi : screen.body.en}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="app-journeys">
            <h2 id="app-journeys" className="font-display text-xl font-semibold text-[var(--sy-text)]">
              {hi ? 'ऐप यात्राएँ' : 'App journeys'}
            </h2>
            <ul className="mt-4 space-y-4">
              {FEATURE_JOURNEYS.map((j) => (
                <li key={j.id} className="sy-stat-tile">
                  <h3 className="font-semibold text-[var(--sy-text)]">{hi ? j.title.hi : j.title.en}</h3>
                  <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{hi ? j.body.hi : j.body.en}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {j.features.map((f) => (
                      <li key={f.en} className="rounded-full border border-[var(--sy-glass-border)] px-3 py-1 text-xs text-[var(--sy-text-muted)]">
                        {hi ? f.hi : f.en}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="app-faq">
            <h2 id="app-faq" className="font-display text-xl font-semibold text-[var(--sy-text)]">
              {hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently asked questions'}
            </h2>
            <dl className="mt-4 space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q.en} className="sy-stat-tile">
                  <dt className="font-semibold text-[var(--sy-text)]">{hi ? item.q.hi : item.q.en}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">{hi ? item.a.hi : item.a.en}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-10 text-sm text-[var(--sy-text-muted)]">
            {hi ? 'अस्वीकरण: ' : 'Disclaimer: '}
            <Link to="/disclaimer" className="text-[var(--sy-accent)] hover:underline">
              {hi ? 'ज्योतिष मार्गदर्शन की सीमाएँ' : 'limits of astrological guidance'}
            </Link>
          </p>
        </main>
        <SiteFooter />
      </div>
  )
}
