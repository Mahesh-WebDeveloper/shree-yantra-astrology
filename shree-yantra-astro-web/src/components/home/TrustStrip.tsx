import { useLang } from '@/i18n/LangProvider'

const ITEMS = [
  {
    key: 'planets',
    en: 'Real planetary positions',
    hi: 'वास्तविक ग्रह-स्थिति',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <circle cx="12" cy="12" r="3.2" />
        <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-25 12 12)" />
      </svg>
    ),
  },
  {
    key: 'calc',
    en: 'Classical Vedic calculations',
    hi: 'शास्त्रीय वैदिक गणना',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="4.5" y="3" width="15" height="18" rx="2" />
        <path d="M8 7h8M8 11h3M13 11h3M8 15h3M13 15h3" />
      </svg>
    ),
  },
  {
    key: 'location',
    en: 'Panchang by location',
    hi: 'स्थान अनुसार पंचांग',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    key: 'lang',
    en: 'Hindi + English guidance',
    hi: 'हिंदी + अंग्रेज़ी मार्गदर्शन',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9Z" />
      </svg>
    ),
  },
]

export function TrustStrip() {
  const { hi } = useLang()

  return (
    <div className="trust-strip">
      {ITEMS.map((item) => (
        <div key={item.key} className="trust-item">
          <span className="trust-icon" aria-hidden>
            {item.icon}
          </span>
          <span className="trust-item-label text-[14px] font-bold leading-snug text-[var(--sy-text)] sm:text-[15px]">
            {hi ? item.hi : item.en}
          </span>
        </div>
      ))}
    </div>
  )
}
