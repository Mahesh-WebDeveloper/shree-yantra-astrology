import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '@/i18n/LangProvider'
import { useCountUp, useInViewOnce, useReducedMotion } from './hooks/useSiteMotion'

gsap.registerPlugin(ScrollTrigger)

type Beat = {
  id: string
  /** The number that counts up. */
  n: number
  /** Suffix rendered next to the number, e.g. "/767". */
  suffix?: string
  unit: { hi: string; en: string }
  title: { hi: string; en: string }
  body: { hi: string; en: string }
  notes: { hi: string; en: string }[]
}

/* Only verified, real facts live here. Nothing is invented. */
const BEATS: Beat[] = [
  {
    id: 'drik',
    n: 767,
    suffix: '/767',
    unit: { hi: 'तिथियाँ मिलान में सही', en: 'dates matched' },
    title: {
      hi: 'हर पर्व, हर व्रत — दृक पंचांग से मिलान किया गया',
      en: 'Every festival, every vrat — cross-checked against Drik Panchang',
    },
    body: {
      hi: '2026, 2027 और 2050 के पर्व व व्रत की तिथियाँ दृक पंचांग से मिलाई गईं — 767 में से 767 सही, कई शहरों की क्रॉस-जाँच सहित।',
      en: 'Festival and vrat dates for 2026, 2027 and 2050 were verified against Drik Panchang — 767 out of 767 correct, including multi-city cross-checks.',
    },
    notes: [
      {
        hi: 'बाहर के वर्ष 2028–2035 अलग से जाँचे गए — हर वर्ष 22/22',
        en: 'Out-of-sample years 2028–2035 verified separately — 22/22 each',
      },
    ],
  },
  {
    id: 'ephemeris',
    n: 0,
    unit: { hi: 'हार्डकोडेड मान', en: 'hardcoded values' },
    title: {
      hi: 'ग्रह-स्थिति सटीक इफ़ेमेरिस से — अनुमान से नहीं',
      en: 'Planetary positions from a precise ephemeris — never estimated',
    },
    body: {
      hi: 'ग्रहों की स्थिति स्विस-इफ़ेमेरिस स्तर की सटीकता से निकाली जाती है, लाहिड़ी (चित्रा पक्ष) अयनांश के साथ। सूर्योदय, सूर्यास्त और तिथि–नक्षत्र की संधियाँ हर बार गणना से आती हैं — कभी तालिका से नहीं।',
      en: 'Positions are computed at Swiss-ephemeris-grade precision using the Lahiri (Chitra Paksha) ayanamsa. Sunrise, sunset and tithi/nakshatra boundaries are calculated every single time — never read from a hardcoded table.',
    },
    notes: [
      { hi: 'लाहिड़ी (चित्रा पक्ष) अयनांश', en: 'Lahiri (Chitra Paksha) ayanamsa' },
      { hi: 'स्थान-आधारित सूर्योदय/सूर्यास्त', en: 'Location-based sunrise / sunset' },
    ],
  },
  {
    id: 'choghadiya',
    n: 16,
    suffix: '/16',
    unit: { hi: 'चौघड़िया अवधि सत्यापित', en: 'choghadiya periods verified' },
    title: {
      hi: 'दिन और रात — पूरे 24 घंटे का चौघड़िया मिलान',
      en: 'Day and night — the full 24-hour choghadiya, matched',
    },
    body: {
      hi: 'दिन के 8 और रात के 8 — कुल 16 चौघड़िया अवधियाँ दृक पंचांग से मिलाई गईं और पूरी तरह सही निकलीं।',
      en: 'Eight day periods and eight night periods — all 16 choghadiya windows were verified against Drik Panchang and matched exactly.',
    },
    notes: [{ hi: 'स्थानीय सूर्योदय–सूर्यास्त से गणना', en: 'Derived from local sunrise and sunset' }],
  },
  {
    id: 'grounded',
    n: 100,
    suffix: '%',
    unit: { hi: 'कुंडली-आधारित उत्तर', en: 'chart-grounded answers' },
    title: {
      hi: 'ज्योतिषी जो कभी अपनी ओर से कुछ नहीं गढ़ता',
      en: 'An astrologer that never invents',
    },
    body: {
      hi: 'हर उत्तर आपकी अपनी कुंडली पर टिका होता है — जन्म कुंडली, पूरी विंशोत्तरी दशा समयरेखा, नौ ग्रहों का गोचर और साढ़ेसाती की अवधियाँ। जो बात आपके डेटा में नहीं है, ज्योतिषी साफ़ कह देता है कि नहीं है — और गलत दावे पर विनम्रता से सुधार भी करता है, हाँ में हाँ नहीं मिलाता।',
      en: "Every answer rests on your own chart — your kundli, the full Vimshottari dasha timeline, the 9-planet gochar and your Sade Sati windows. If a fact isn't in your data, the astrologer says so plainly — and will politely correct a wrong claim rather than agree with it.",
    },
    notes: [
      { hi: 'कुंडली · दशा · गोचर · साढ़ेसाती', en: 'Kundli · Dasha · Gochar · Sade Sati' },
      { hi: 'डेटा में नहीं? तो उत्तर में भी नहीं', en: 'Not in the data? Not in the answer' },
    ],
  },
]

function Mandala() {
  return (
    <svg className="sy-mandala" viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="100" cy="100" r="96" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="78" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="52" strokeWidth="0.6" />
      <circle cx="100" cy="100" r="26" strokeWidth="0.6" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2
        return (
          <line
            key={i}
            x1={100 + Math.cos(a) * 26}
            y1={100 + Math.sin(a) * 26}
            x2={100 + Math.cos(a) * 96}
            y2={100 + Math.sin(a) * 96}
            strokeWidth="0.5"
          />
        )
      })}
      <polygon points="100,30 161,135 39,135" strokeWidth="0.8" />
      <polygon points="100,170 39,65 161,65" strokeWidth="0.8" />
    </svg>
  )
}

function BeatBlock({ beat, index, hi }: { beat: Beat; index: number; hi: boolean }) {
  const { ref, seen } = useInViewOnce<HTMLElement>('-20% 0px -20% 0px')
  const value = useCountUp(beat.n, seen, 1400 + index * 120)

  return (
    <article className="sy-beat" ref={ref} aria-labelledby={`sy-beat-${beat.id}`}>
      {index === 1 && <Mandala />}
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="sy-beat__num sy-gold-text sy-num">
          {value}
          {beat.suffix}
        </span>
        <span className="sy-beat__unit">{hi ? beat.unit.hi : beat.unit.en}</span>
      </div>

      <h3 id={`sy-beat-${beat.id}`} className="sy-h3">
        {hi ? beat.title.hi : beat.title.en}
      </h3>
      <p className="sy-body" style={{ maxWidth: '58ch' }}>
        {hi ? beat.body.hi : beat.body.en}
      </p>

      <ul className="flex flex-wrap gap-2">
        {beat.notes.map((n) => (
          <li key={n.en}>
            <span className="sy-chip sy-num">
              <span className="sy-chip__dot" aria-hidden />
              {hi ? n.hi : n.en}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function AccuracyManifesto() {
  const { hi } = useLang()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const beatsRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const beats = beatsRef.current
    const rail = railRef.current
    if (!beats || !rail) return

    if (reduced) {
      rail.style.setProperty('--sy-rail', '100%')
      return
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: beats,
        start: 'top 72%',
        end: 'bottom 78%',
        scrub: 0.6,
        onUpdate: (self) => {
          rail.style.setProperty('--sy-rail', `${Math.round(self.progress * 100)}%`)
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [reduced])

  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <section
      className="sy-section sy-site"
      id="accuracy"
      ref={sectionRef}
      aria-labelledby="sy-accuracy-title"
    >
      <div className="sy-container">
        <div className="sy-manifesto__layout">
          <div className="sy-manifesto__aside">
            <p className="sy-eyebrow">{t('सटीकता का घोषणापत्र', 'The accuracy manifesto')}</p>
            <h2 id="sy-accuracy-title" className="sy-h2 mt-5">
              {t('भरोसा दावों से नहीं बनता — ', 'Trust is not claimed. ')}
              <span className="sy-gold-text">{t('जाँच से बनता है', "It's verified")}</span>
            </h2>
            <p className="sy-lead mt-5">
              {t(
                'ज्योतिष में सबसे बड़ा धोखा है — गलत तिथि। इसलिए हमने हर पर्व, हर मुहूर्त और हर गणना को स्वतंत्र रूप से मिलाया, और परिणाम यहाँ खुले रखे हैं।',
                'The deepest failure in astrology apps is a wrong date. So we verified every festival, every muhurat and every calculation independently — and we are publishing the results here.',
              )}
            </p>

            <div className="mt-8 flex items-stretch gap-4">
              <span className="sy-manifesto__rail" aria-hidden>
                <span className="sy-manifesto__rail-fill" ref={railRef} />
              </span>
              <p className="sy-micro" style={{ maxWidth: '34ch' }}>
                {t(
                  'नीचे चार जाँचें हैं। हर एक स्वतंत्र रूप से दोहराई जा सकती है — दृक पंचांग खोलिए और मिलाइए।',
                  'Four checks follow. Each one is independently repeatable — open Drik Panchang and compare for yourself.',
                )}
              </p>
            </div>
          </div>

          <div ref={beatsRef}>
            {BEATS.map((beat, i) => (
              <BeatBlock key={beat.id} beat={beat} index={i} hi={hi} />
            ))}
          </div>
        </div>

        <hr className="sy-rule mt-12" />
      </div>
    </section>
  )
}
