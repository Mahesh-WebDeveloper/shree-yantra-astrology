import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { LEGAL_CONTACT } from '@/data/legal'
import { useLang } from '@/i18n/LangProvider'

const FAQS = [
  {
    en: {
      q: 'Is this website the full app?',
      a: 'No. This website introduces Shree Yantra and previews selected app features. Personal Kundli, Panchang, astrological guidance and the spiritual library are available inside the Android app.',
    },
    hi: {
      q: 'क्या यह वेबसाइट पूरा ऐप है?',
      a: 'नहीं। यह वेबसाइट श्री यंत्र और उसकी प्रमुख सुविधाओं का परिचय देती है। व्यक्तिगत कुंडली, पंचांग, ज्योतिषीय जानकारी और धार्मिक पुस्तकालय Android ऐप में उपलब्ध हैं।',
    },
  },
  {
    en: {
      q: 'Where do I create my kundli?',
      a: 'Install the app and add your birth details once. Your Kundli and personalised readings will then remain available with your account.',
    },
    hi: {
      q: 'कुंडली कहाँ बनाएँ?',
      a: 'ऐप इंस्टॉल करने के बाद अपना जन्म विवरण एक बार जोड़ें। आपकी कुंडली और व्यक्तिगत ज्योतिषीय जानकारी आपके खाते में उपलब्ध रहेगी।',
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
  const apkUrl = import.meta.env.VITE_APK_DOWNLOAD_URL?.trim()
  const downloadHref =
    apkUrl ||
    `mailto:${LEGAL_CONTACT}?subject=${encodeURIComponent('Shree Yantra Android download link')}`

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
            ? 'श्री यंत्र एक वैदिक ज्योतिष और धार्मिक सामग्री ऐप है। नीचे ऐप तथा डाउनलोड से जुड़े सामान्य प्रश्नों के उत्तर दिए गए हैं।'
            : 'Shree Yantra is a Vedic astrology and spiritual-content app. Find answers to common app and download questions below.'}
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
          href={downloadHref}
          {...(apkUrl ? { download: true } : {})}
          className="sy-btn-primary mt-10 inline-flex rounded-xl px-5 py-3 text-sm font-semibold"
        >
          {hi ? 'Android ऐप डाउनलोड करें' : 'Download the Android app'}
        </a>
      </main>
      <SiteFooter />
    </div>
  )
}

