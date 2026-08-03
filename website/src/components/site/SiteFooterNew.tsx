import { Link } from 'react-router-dom'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { useLang } from '@/i18n/LangProvider'
import { scrollToHash, scrollToTop } from './hooks/useSiteMotion'

type Bi = { hi: string; en: string }
type Col = { head: Bi; links: { label: Bi; to?: string; hash?: string; href?: string }[] }

const COLUMNS: Col[] = [
  {
    head: { hi: 'उत्पाद', en: 'Product' },
    links: [
      { label: { hi: 'विशेषताएँ', en: 'Features' }, hash: '#features' },
      { label: { hi: 'गणना का आधार', en: 'Methodology' }, hash: '#accuracy' },
      { label: { hi: 'आज का पंचांग', en: "Today's Panchang" }, hash: '#live-proof' },
      { label: { hi: 'Android ऐप डाउनलोड करें', en: 'Download the Android app' }, hash: '#download' },
    ],
  },
  {
    head: { hi: 'धार्मिक पुस्तकालय', en: 'Spiritual Library' },
    links: [
      { label: { hi: 'भगवद्गीता', en: 'Bhagavad Gita' }, hash: '#library' },
      { label: { hi: 'रामायण · रामचरितमानस', en: 'Ramayan · Ramcharitmanas' }, hash: '#library' },
      { label: { hi: '4 वेद', en: 'The 4 Vedas' }, hash: '#library' },
      { label: { hi: 'आरती · स्तोत्र · चालीसा', en: 'Aarti · Stotra · Chalisa' }, hash: '#library' },
    ],
  },
  {
    head: { hi: 'कंपनी', en: 'Company' },
    links: [
      { label: { hi: 'सहायता केंद्र', en: 'Help centre' }, to: '/help' },
      { label: { hi: 'सामान्य प्रश्न', en: 'FAQ' }, hash: '#faq' },
      { label: { hi: 'गोपनीयता नीति', en: 'Privacy policy' }, to: '/privacy' },
      { label: { hi: 'सेवा की शर्तें', en: 'Terms of service' }, to: '/terms' },
    ],
  },
]

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function YoutubeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="4.5" />
      <path d="M10.5 9.3v5.4l4.6-2.7z" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Drawn rather than an emoji — 🇮🇳 does not render on most Windows browsers. */
function IndiaFlag() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" role="img" aria-label="India">
      <rect width="18" height="4" y="0" fill="#ff9933" />
      <rect width="18" height="4" y="4" fill="#ffffff" />
      <rect width="18" height="4" y="8" fill="#138808" />
      <circle cx="9" cy="6" r="1.5" fill="none" stroke="#000080" strokeWidth="0.5" />
      <rect x="0" y="0" width="18" height="12" fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="0.6" />
    </svg>
  )
}

export function SiteFooterNew() {
  const { hi } = useLang()
  const t = (h: string, e: string) => (hi ? h : e)
  const year = new Date().getFullYear()

  return (
    <footer className="sy-site" aria-labelledby="sy-footer-title">
      <hr className="sy-rule" />
      <div className="sy-container" style={{ paddingBlock: 'clamp(52px, 8vh, 84px)' }}>
        <h2 id="sy-footer-title" className="sr-only">
          {t('श्री यंत्र — साइट फुटर', 'Shree Yantra — site footer')}
        </h2>

        <div className="sy-footer__cols">
          <div>
            <button
              type="button"
              className="sy-nav__brand"
              onClick={scrollToTop}
              aria-label={t('ऊपर जाएँ', 'Back to top')}
            >
              <ShreeYantraLogo size={40} pulse={false} />
              <span>
                <span className="sy-nav__word">Shree Yantra</span>
                <span className="sy-nav__tag">{t('वैदिक ज्योतिष', 'Vedic Astrology')}</span>
              </span>
            </button>

            <p className="sy-body mt-5" style={{ maxWidth: '34ch' }}>
              {t(
                'श्री यंत्र एक आधुनिक वैदिक ज्योतिष ऐप है, जिसमें व्यक्तिगत कुंडली, शहर के अनुसार पंचांग, सरल ज्योतिषीय व्याख्या और सुव्यवस्थित धार्मिक पुस्तकालय उपलब्ध हैं।',
                'Shree Yantra is a modern Vedic astrology app with personalised Kundli, location-based Panchang, clear astrological explanations and an organised spiritual library.',
              )}
            </p>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                className="sy-social"
                href="https://instagram.com/shreeyantraapp"
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t('इंस्टाग्राम पर श्री यंत्र', 'Shree Yantra on Instagram')}
              >
                <InstagramIcon />
              </a>
              <a
                className="sy-social"
                href="#"
                aria-label={t('यूट्यूब पर श्री यंत्र (जल्द)', 'Shree Yantra on YouTube (coming soon)')}
              >
                <YoutubeIcon />
              </a>
            </div>

            <a className="sy-footer__link mt-5 block" href="mailto:support@shreeyantra.app">
              support@shreeyantra.app
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.head.en} aria-label={hi ? col.head.hi : col.head.en}>
              <p className="sy-footer__head">{hi ? col.head.hi : col.head.en}</p>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label.en}>
                    {l.to ? (
                      <Link className="sy-footer__link" to={l.to}>
                        {hi ? l.label.hi : l.label.en}
                      </Link>
                    ) : (
                      <a
                        className="sy-footer__link"
                        href={l.hash ?? l.href ?? '#'}
                        onClick={(e) => {
                          if (!l.hash) return
                          e.preventDefault()
                          scrollToHash(l.hash)
                        }}
                      >
                        {hi ? l.label.hi : l.label.en}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <hr className="sy-rule mt-12" />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="sy-micro sy-num">
            © {year} Shree Yantra. {t('सर्वाधिकार सुरक्षित।', 'All rights reserved.')}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link className="sy-footer__link" to="/privacy">
              {t('गोपनीयता', 'Privacy')}
            </Link>
            <Link className="sy-footer__link" to="/terms">
              {t('शर्तें', 'Terms')}
            </Link>
            <Link className="sy-footer__link" to="/help">
              {t('सहायता', 'Help')}
            </Link>
          </div>
          <p className="sy-micro inline-flex items-center gap-2">
            {t('भारत में श्रद्धा के साथ बनाया गया', 'Made with devotion in India')}
            <IndiaFlag />
          </p>
        </div>
      </div>
    </footer>
  )
}
