import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { PLAY_STORE_URL } from '@/data/showcase'
import { LEGAL_CONTACT } from '@/data/legal'
import { useLang } from '@/i18n/LangProvider'

const FAQS = [
  {
    en: {
      q: 'Is this website the full app?',
      a: 'No. This site showcases Shree Yantra. Kundli, panchang, library and personal guidance live in the mobile app on Google Play.',
    },
    hi: {
      q: 'क्या यह वेबसाइट पूरा ऐप है?',
      a: 'नहीं। यह साइट श्री यंत्रा ऐप की झलक है। कुंडली, पंचांग, पुस्तकालय और व्यक्तिगत मार्गदर्शन Google Play पर मोबाइल ऐप में हैं।',
    },
  },
  {
    en: {
      q: 'Where do I create my kundli?',
      a: 'Install the app, add your birth details once, and your kundli plus personalised readings stay with your account.',
    },
    hi: {
      q: 'कुंडली कहाँ बनाएँ?',
      a: 'ऐप इंस्टॉल करें, जन्म विवरण एक बार जोड़ें — कुंडली और व्यक्तिगत रीडिंग आपके खाते के साथ रहती है।',
    },
  },
  {
    en: {
      q: 'How do I get support?',
      a: `Email ${LEGAL_CONTACT} or use Help inside the app after you sign in.`,
    },
    hi: {
      q: 'सहायता कैसे मिले?',
      a: `${LEGAL_CONTACT} पर लिखें, या साइन-इन के बाद ऐप में सहायता देखें।`,
    },
  },
]

export function HelpPage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page min-h-screen">
      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-28 sm:px-8">
        <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
          ← {hi ? 'होम' : 'Home'}
        </Link>
        <h1 className="mt-6 font-playfair text-3xl font-bold text-[var(--sy-text)]">
          {hi ? 'सहायता' : 'Help'}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
          {hi
            ? 'श्री यंत्रा एक मोबाइल ऐप है। नीचे सामान्य प्रश्न हैं।'
            : 'Shree Yantra is a mobile app. Common questions below.'}
        </p>

        <ul className="mt-10 space-y-6">
          {FAQS.map((f) => (
            <li key={f.en.q} className="border-b border-[var(--sy-glass-border)] pb-6">
              <h2 className="font-display text-base font-semibold text-[var(--sy-text)]">
                {hi ? f.hi.q : f.en.q}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--sy-text-soft)]">
                {hi ? f.hi.a : f.en.a}
              </p>
            </li>
          ))}
        </ul>

        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="sy-btn-primary mt-10 inline-flex rounded-xl px-5 py-3 text-sm font-semibold"
        >
          {hi ? 'Google Play पर ऐप पाएँ' : 'Get the app on Google Play'}
        </a>
      </main>
      <SiteFooter />
    </div>
  )
}

