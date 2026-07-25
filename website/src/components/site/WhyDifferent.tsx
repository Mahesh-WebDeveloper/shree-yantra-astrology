import { Fragment } from 'react'
import { useLang } from '@/i18n/LangProvider'
import './sections.css'

/**
 * Two columns, interleaved in the DOM so every pair of claims shares a grid
 * row and stays aligned no matter how the text wraps. No competitor is named.
 */

type Row = { id: string; them: { hi: string; en: string }; us: { hi: string; en: string } }

const ROWS: Row[] = [
  {
    id: 'reading',
    them: {
      hi: 'सिर्फ़ सूर्य राशि का सामान्य पाठ — सबके लिए एक ही पैराग्राफ़।',
      en: 'Generic sun-sign text — the same paragraph handed to everyone.',
    },
    us: {
      hi: 'पाठ आपकी अपनी जन्म कुंडली से बनता है — भाव, ग्रह, नक्षत्र और दशा के साथ।',
      en: 'Readings are built from your own birth chart — houses, planets, nakshatras and dasha.',
    },
  },
  {
    id: 'dates',
    them: {
      hi: 'त्योहार और व्रत की तारीखें अक्सर पंचांग से खिसक जाती हैं।',
      en: 'Festival and vrat dates that quietly drift away from the panchang.',
    },
    us: {
      hi: 'दृक-सिद्ध गणना — त्योहारों की 767 में से 767 तारीखें मिलान में सही निकलीं।',
      en: 'A Drik-verified engine — 767 of 767 festival dates matched on checking.',
    },
  },
  {
    id: 'chat',
    them: {
      hi: 'चैट हर बात में हाँ मिला देती है, चाहे बात कुंडली से मेल खाए या नहीं।',
      en: 'A chat that agrees with anything you say, whether or not the chart supports it.',
    },
    us: {
      hi: 'उत्तर कुंडली के आँकड़ों पर बनते हैं — गलत बात को विनम्रता से सुधारा जाता है।',
      en: 'Answers are grounded on chart data — a wrong claim is politely corrected, not echoed.',
    },
  },
  {
    id: 'content',
    them: {
      hi: 'सामग्री पतली — कुछ पन्ने पढ़े और खत्म।',
      en: 'Thin content — a few pages to read and then nothing.',
    },
    us: {
      hi: '18 पुराण, 4 वेद, गीता, रामायण और महाभारत — ऑडियो के साथ।',
      en: '18 Puranas, 4 Vedas, the Gita, the Ramayana and the Mahabharata — with audio.',
    },
  },
  {
    id: 'pricing',
    them: {
      hi: 'छिपे हुए शुल्क, जो बाद में सामने आते हैं।',
      en: 'Hidden charges that only show up later.',
    },
    us: {
      hi: 'साफ़ योजनाएँ — कीमत पहले से दिखती है, कोई छिपा शुल्क नहीं।',
      en: 'Transparent plans — the price is shown up front, with nothing hidden.',
    },
  },
]

function MarkCross() {
  return (
    <svg className="syj-cell__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MarkCheck() {
  return (
    <svg className="syj-cell__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.9 8.3l2.1 2.2 4.1-4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WhyDifferent() {
  const { hi } = useLang()

  return (
    <section className="syj sy-section syj-why" aria-labelledby="syj-why-h">
      <div className="sy-container">
        <div className="syj-intro">
          <p className="syj-kicker">{hi ? 'फ़र्क़' : 'The difference'}</p>
          <h2 id="syj-why-h" className="syj-title">
            {hi ? (
              <>
                देखने में एक जैसा। <em>अंदर से नहीं।</em>
              </>
            ) : (
              <>
                It looks the same. <em>Inside, it is not.</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'नीचे की हर बात जाँची जा सकती है — ऐप खोलिए और मिलाकर देख लीजिए।'
              : 'Every line below can be checked — open the app and compare it yourself.'}
          </p>
        </div>

        <div className="syj-vs">
          <span className="syj-vs__glow" aria-hidden />

          <div className="syj-vs__head syj-vs__head--them">
            <em>{hi ? 'दूसरी जगह' : 'Elsewhere'}</em>
            <b>{hi ? 'आम ज्योतिष ऐप' : 'Typical astrology apps'}</b>
          </div>
          <div className="syj-vs__head syj-vs__head--us">
            <em>{hi ? 'यहाँ' : 'Here'}</em>
            <b>{hi ? 'श्री यंत्र' : 'Shree Yantra'}</b>
          </div>

          {ROWS.map((row) => (
            <Fragment key={row.id}>
              <div className="syj-cell syj-cell--them">
                <span className="syj-cell__who">{hi ? 'आम ऐप' : 'Typical app'}</span>
                <span className="syj-cell__row">
                  <MarkCross />
                  <span>{hi ? row.them.hi : row.them.en}</span>
                </span>
              </div>
              <div className="syj-cell syj-cell--us">
                <span className="syj-cell__who">{hi ? 'श्री यंत्र' : 'Shree Yantra'}</span>
                <span className="syj-cell__row">
                  <MarkCheck />
                  <strong>{hi ? row.us.hi : row.us.en}</strong>
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
