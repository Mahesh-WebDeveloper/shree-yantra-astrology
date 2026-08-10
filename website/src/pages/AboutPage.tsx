import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CONTACT_EMAIL } from '@/lib/seo/config'
import { useLang } from '@/i18n/LangProvider'

export function AboutPage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page min-h-screen">
      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-28 sm:px-8">
        <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
          ← {hi ? 'होम' : 'Home'}
        </Link>
        <h1 className="mt-6 font-playfair text-3xl font-bold text-[var(--sy-text)]">
          {hi ? 'हमारे बारे में' : 'About us'}
        </h1>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
          <p>
            {hi
              ? 'श्री यंत्र एस्ट्रोलॉजी एक वैदिक ज्योतिष और आध्यात्मिक सामग्री ऐप है — कुंडली, पंचांग, राशिफल, मुहूर्त और दिव्य पुस्तकालय को हिंदी और अंग्रेजी में सुलभ बनाने के लिए।'
              : 'Shree Yantra Astrology is a Vedic astrology and spiritual-content app — built to make Kundli, Panchang, Rashifal, Muhurat and a sacred library accessible in Hindi and English.'}
          </p>
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--sy-text)]">
              {hi ? 'हमारा दृष्टिकोण' : 'Our approach'}
            </h2>
            <p className="mt-2">
              {hi
                ? 'हम गणना (खगोलीय ग्रह स्थिति, लाहिरी अयनांश) और व्याख्या (मार्गदर्शन, AI स्पष्टीकरण) को अलग रखते हैं। ज्योतिषीय परिणाम परंपरागत विश्वास और सूचनात्मक मार्गदर्शन हैं — गारंटीकृत भविष्यवाणी नहीं।'
                : 'We keep calculation (astronomical positions, Lahiri ayanamsa) separate from interpretation (guidance, AI explanations). Astrological outcomes are traditional beliefs and informational guidance — not guaranteed predictions.'}
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--sy-text)]">
              {hi ? 'संपादकीय नीति' : 'Editorial policy'}
            </h2>
            <p className="mt-2">
              {hi
                ? 'वेबसाइट की शैक्षणिक सामग्री स्पष्ट, जिम्मेदार भाषा में प्रस्तुत की जाती है। हम कृतrim समीक्षाएँ, झूठे प्रमाणपत्र या अप्रमाणित शास्त्र उद्धरण नहीं जोड़ते। [विशेषज्ञ समीक्षक नाम — सत्यापन आवश्यक]'
                : 'Educational website content is presented in clear, responsible language. We do not add fabricated reviews, credentials or unverified scriptural quotes. [Named expert reviewer — verification required]'}
            </p>
          </section>
          <section>
            <h2 className="font-display text-lg font-semibold text-[var(--sy-text)]">
              {hi ? 'संपर्क' : 'Contact'}
            </h2>
            <p className="mt-2">
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--sy-accent)] hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
        <nav className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link to="/app" className="text-[var(--sy-accent)] hover:underline">{hi ? 'ऐप' : 'App'}</Link>
          <Link to="/shree-yantra" className="text-[var(--sy-accent)] hover:underline">{hi ? 'श्री यंत्र गाइड' : 'Shree Yantra guide'}</Link>
          <Link to="/legal" className="text-[var(--sy-accent)] hover:underline">{hi ? 'गोपनीयता' : 'Privacy'}</Link>
          <Link to="/disclaimer" className="text-[var(--sy-accent)] hover:underline">{hi ? 'अस्वीकरण' : 'Disclaimer'}</Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  )
}
