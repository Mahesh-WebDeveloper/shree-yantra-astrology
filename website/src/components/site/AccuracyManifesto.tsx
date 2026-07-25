import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '@/i18n/LangProvider'
import { useReducedMotion } from './hooks/useSiteMotion'
import './sections.css'

gsap.registerPlugin(ScrollTrigger)

type Bi = { hi: string; en: string }

type Beat = {
  id: string
  /** Human sentence first — this is the heading. */
  title: Bi
  body: Bi
  /** The quiet evidence line. The number, if any, sits inside the sentence. */
  proof: { pre: Bi; n?: number; suffix?: string; post?: Bi }
  /** Traditional / technical terms, for the people who look for them. */
  notes: Bi[]
}

/* Only verified, real facts live here. Nothing is invented. */
const BEATS: Beat[] = [
  {
    id: 'dates',
    title: {
      hi: 'हर त्योहार और व्रत की तारीख — पंचांग से मिलाकर जाँची हुई',
      en: 'Every festival and vrat date — checked against the panchang',
    },
    body: {
      hi: 'बहुत से ऐप में त्योहार की तारीख़ एक दिन आगे-पीछे हो जाती है, और व्रत ठीक उसी दिन छूट जाता है। इसलिए हमने एक-एक तारीख़ दृक पंचांग से मिलाकर देखी — और अलग-अलग शहरों के लिए अलग से भी।',
      en: 'In a lot of apps the festival date slips by a day, and the vrat is missed on exactly that day. So we compared every single date against Drik Panchang — and did it separately for several cities.',
    },
    proof: {
      pre: { hi: '2026, 2027 और 2050 की सभी ', en: 'All ' },
      n: 767,
      post: { hi: ' तारीखें सही निकलीं', en: ' dates for 2026, 2027 and 2050 came out right' },
    },
    notes: [
      {
        hi: '2028 से 2035 तक हर साल अलग से जाँचा — हर साल 22 में से 22',
        en: '2028 to 2035 checked separately — 22 of 22 every year',
      },
      { hi: 'कई शहरों में अलग-अलग मिलान', en: 'Cross-checked across several cities' },
    ],
  },
  {
    id: 'maths',
    title: {
      hi: 'गणना वही, जो पंडित जी करते हैं',
      en: 'The same maths a pandit uses',
    },
    body: {
      hi: 'ग्रहों की जगह, सूर्योदय, सूर्यास्त और तिथि के बदलने का ठीक समय — सब कुछ हर बार नए सिरे से गिना जाता है, आपके अपने शहर के हिसाब से। कोई पहले से बनी तालिका नहीं, कोई अंदाज़ा नहीं।',
      en: 'Where the planets are, when the sun rises and sets, the exact moment a tithi turns — all of it is worked out fresh every time, for your own city. No pre-made table, no guesswork.',
    },
    proof: {
      pre: {
        hi: 'ऐप में एक भी तारीख़ या समय पहले से भरा हुआ नहीं है',
        en: 'Not one date or time in the app is filled in beforehand',
      },
    },
    notes: [
      { hi: 'लाहिड़ी (चित्रा पक्ष) अयनांश', en: 'Lahiri (Chitra Paksha) ayanamsa' },
      { hi: 'तिथि सूर्योदय के समय के अनुसार', en: 'Tithi taken at sunrise (udaya)' },
      { hi: 'सूर्योदय–सूर्यास्त आपके शहर से', en: 'Sunrise and sunset from your own city' },
    ],
  },
  {
    id: 'choghadiya',
    title: {
      hi: 'शुभ समय देखना हो, तो पूरे दिन और रात का चौघड़िया',
      en: 'Looking for a good hour? The choghadiya for the whole day and night',
    },
    body: {
      hi: 'नया काम, यात्रा या पूजा — लोग समय चौघड़िया देखकर तय करते हैं। दिन की आठ और रात की आठ अवधियाँ आपके शहर के सूर्योदय और सूर्यास्त से बनती हैं, इसलिए हर शहर में थोड़ी अलग होती हैं।',
      en: 'A new venture, a journey, a puja — people pick the hour by the choghadiya. The eight day windows and eight night windows are built from your own city’s sunrise and sunset, so they shift a little from city to city.',
    },
    proof: {
      pre: { hi: 'पूरे चौबीस घंटे की सभी ', en: 'All ' },
      n: 16,
      post: {
        hi: ' अवधियाँ मिलान में सही निकलीं',
        en: ' windows across the full twenty-four hours matched',
      },
    },
    notes: [{ hi: 'स्थानीय सूर्योदय और सूर्यास्त से बनी', en: 'Built from local sunrise and sunset' }],
  },
  {
    id: 'grounded',
    title: {
      hi: 'ज्योतिषी वही कहता है, जो आपकी कुंडली में है',
      en: 'The astrologer says only what your chart says',
    },
    body: {
      hi: 'हर जवाब आपकी अपनी कुंडली, चल रही दशा, नौ ग्रहों के गोचर और साढ़ेसाती की तारीखों को देखकर बनता है। जो बात आपकी कुंडली में है ही नहीं, उसके लिए साफ़ मना कर दिया जाता है — और कोई गलत बात कह दे तो विनम्रता से सुधार भी होता है।',
      en: 'Every answer is put together after looking at your own chart, the period you are running, where the nine planets are moving and the dates of your Sade Sati. If something simply is not in your chart, you are told so plainly — and a wrong claim is politely corrected instead of echoed.',
    },
    proof: {
      pre: {
        hi: 'जो आपके अपने आँकड़ों में नहीं है, वह जवाब में भी नहीं आता',
        en: 'What is not in your own data does not appear in the answer',
      },
    },
    notes: [
      { hi: 'कुंडली · दशा · गोचर · साढ़ेसाती', en: 'Chart · dasha · gochar · Sade Sati' },
      { hi: 'हाँ में हाँ नहीं मिलाई जाती', en: 'It will not agree just to please you' },
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

function Tick() {
  return (
    <svg className="syj-mf__tick" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.1" opacity="0.75" />
      <path
        d="M4.9 8.3l2.1 2.2 4.1-4.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BeatBlock({ beat, index, hi }: { beat: Beat; index: number; hi: boolean }) {
  return (
    <article className="sy-beat" aria-labelledby={`sy-beat-${beat.id}`}>
      {index === 1 && <Mandala />}

      <h3 id={`sy-beat-${beat.id}`} className="sy-h3 syj-mf__title">
        {hi ? beat.title.hi : beat.title.en}
      </h3>
      <p className="sy-body" style={{ maxWidth: '58ch' }}>
        {hi ? beat.body.hi : beat.body.en}
      </p>

      {/* The evidence line. The figure never leads — it sits inside a sentence
          an ordinary reader can follow, and it never animates from zero. */}
      <p className="syj-mf__proof">
        <Tick />
        <span>
          {hi ? beat.proof.pre.hi : beat.proof.pre.en}
          {beat.proof.n != null ? (
            <b className="sy-num">
              {beat.proof.n.toLocaleString('en-US')}
              {beat.proof.suffix}
            </b>
          ) : null}
          {beat.proof.post ? (hi ? beat.proof.post.hi : beat.proof.post.en) : null}
        </span>
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
      className="syj sy-section sy-site"
      id="accuracy"
      ref={sectionRef}
      aria-labelledby="sy-accuracy-title"
    >
      <div className="sy-container">
        <div className="sy-manifesto__layout">
          <div className="sy-manifesto__aside">
            <p className="sy-eyebrow">{t('भरोसा क्यों करें', 'Why you can trust this')}</p>
            <h2 id="sy-accuracy-title" className="sy-h2 mt-5">
              {t('भरोसा कहने से नहीं आता — ', 'Trust does not come from claims. ')}
              <span className="sy-gold-text">
                {t('मिलाकर देखने से आता है', 'It comes from checking.')}
              </span>
            </h2>
            <p className="sy-lead mt-5">
              {t(
                'ज्योतिष ऐप में सबसे बड़ी गड़बड़ी होती है गलत तारीख़ — और वही सबसे भारी पड़ती है। इसलिए हमने हर त्योहार, हर मुहूर्त और हर गणना अलग से मिलाकर देखी, और नतीजे यहीं खुले रख दिए हैं।',
                'The worst thing an astrology app can get wrong is a date — and it is the thing that costs you most. So we checked every festival, every muhurat and every calculation independently, and we are leaving the results here in the open.',
              )}
            </p>

            <div className="mt-8 flex items-stretch gap-4">
              <span className="sy-manifesto__rail" aria-hidden>
                <span className="sy-manifesto__rail-fill" ref={railRef} />
              </span>
              <p className="sy-micro" style={{ maxWidth: '34ch' }}>
                {t(
                  'नीचे चार बातें हैं। हर एक आप खुद जाँच सकते हैं — दृक पंचांग खोलिए और मिलाकर देख लीजिए।',
                  'Four things follow. You can check every one of them yourself — open Drik Panchang and compare.',
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
