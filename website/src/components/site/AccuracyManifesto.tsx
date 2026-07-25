import { useLang } from '@/i18n/LangProvider'
import { scrollToHash, useReducedMotion, useRevealChildren } from './hooks/useSiteMotion'
import { TrustArrowUp, TrustGlyph, TrustSeal, TrustTick, type GlyphName } from './parts/trustMarks'
import './sections.css'

type Bi = { hi: string; en: string }

/* ─────────────────────────────────────────────────────────────
   Only checked, real facts live in this file. Nothing here is
   invented, rounded up or dramatised beyond what was measured.
   ───────────────────────────────────────────────────────────── */

/** The concordance: what we showed, what the panchang says, one row per check. */
type Row = { id: string; ours: string; theirs: string; what: Bi }

const ROWS: Row[] = [
  {
    id: 'dates',
    ours: '767',
    theirs: '767',
    what: {
      hi: 'त्योहार और व्रत की तारीख़ें — 2026, 2027 और 2050, कई शहरों में अलग-अलग',
      en: 'Festival and vrat dates — 2026, 2027 and 2050, checked across several cities',
    },
  },
  {
    id: 'years',
    ours: '22',
    theirs: '22',
    what: {
      hi: 'हर साल अलग से — 2028 से 2035 तक, एक-एक साल का पूरा मिलान',
      en: 'Each year on its own — 2028 through 2035, every year checked separately',
    },
  },
  {
    id: 'choghadiya',
    ours: '16',
    theirs: '16',
    what: {
      hi: 'चौघड़िया — दिन की आठ और रात की आठ, पूरे चौबीस घंटे',
      en: 'Choghadiya — the eight day windows and the eight night ones, a full day and night',
    },
  },
]

/** The four proofs. Heading says what it means for you; the figure sits quietly under it. */
type Proof = {
  id: string
  glyph: GlyphName
  title: Bi
  body: Bi
  stat: Bi
  note: Bi
}

const PROOFS: Proof[] = [
  {
    id: 'dates',
    glyph: 'calendar',
    title: {
      hi: 'तारीख़ एक दिन खिसकी, तो व्रत उसी दिन छूटता है',
      en: 'If the date slips by a day, the vrat is missed on exactly that day',
    },
    body: {
      hi: 'इसलिए त्योहार और व्रत की एक-एक तारीख़ दृक पंचांग से मिलाकर देखी गई — 2026, 2027 और 2050 की, और कई शहरों के लिए अलग-अलग, क्योंकि शहर बदलने पर तिथि भी बदल सकती है।',
      en: 'So every festival and vrat date was checked, one at a time, against Drik Panchang — for 2026, 2027 and 2050, and separately for several cities, because the tithi can change when the city does.',
    },
    stat: { hi: '767 में से 767', en: '767 of 767' },
    note: {
      hi: 'हर त्योहार और व्रत की तारीख़ मिली। फिर 2028 से 2035 तक साल-दर-साल जाँचा गया — हर साल 22 में से 22।',
      en: 'Every festival and vrat date matched. 2028 to 2035 was then checked year by year — 22 of 22, every year.',
    },
  },
  {
    id: 'choghadiya',
    glyph: 'dial',
    title: {
      hi: 'शुभ घड़ी वही है जो आपके शहर की हो',
      en: 'A good hour is only good where you are standing',
    },
    body: {
      hi: 'नया काम, यात्रा या पूजा — लोग समय चौघड़िया देखकर तय करते हैं। दिन की आठ और रात की आठ अवधियाँ आपके अपने सूर्योदय और सूर्यास्त से बनती हैं, इसलिए हर शहर में थोड़ी अलग होती हैं। पूरे चौबीस घंटे की सूची मिलाकर देखी गई।',
      en: 'A new venture, a journey, a puja — people choose the hour by the choghadiya. The eight day windows and eight night windows are built from your own sunrise and sunset, so they shift from city to city. The full twenty-four hours was compared.',
    },
    stat: { hi: '16 में से 16', en: '16 of 16' },
    note: {
      hi: 'दिन और रात की हर चौघड़िया दृक पंचांग से मिली — शुभ भी, अशुभ भी।',
      en: 'Every window of the day and night matched Drik Panchang — the good ones and the ones to avoid.',
    },
  },
  {
    id: 'computed',
    glyph: 'sunrise',
    title: {
      hi: 'कोई पहले से भरी हुई तालिका नहीं',
      en: 'Nothing here is read off a stored table',
    },
    body: {
      hi: 'तिथि, नक्षत्र, सूर्योदय और सूर्यास्त हर बार नए सिरे से गिने जाते हैं — आपके अपने शहर के लिए। दिन की तिथि वही मानी जाती है जो सूर्योदय के समय चल रही हो, यानी उदया तिथि — वही नियम जो पंडित जी लगाते हैं।',
      en: 'Tithi, nakshatra, sunrise and sunset are worked out afresh every time, for your own city. The day’s tithi is the one running at sunrise — the udaya rule, the same one a pandit applies.',
    },
    stat: { hi: 'हर बार नई गणना', en: 'Computed every time' },
    note: {
      hi: 'लाहिड़ी (चित्रा पक्ष) अयनांश · तिथि सूर्योदय (उदय) के अनुसार · समय आपके शहर के हिसाब से',
      en: 'Lahiri (Chitra Paksha) ayanamsa · tithi by the sunrise (udaya) rule · timings from your own city',
    },
  },
  {
    id: 'grounded',
    glyph: 'chart',
    title: {
      hi: 'ज्योतिषी वही कहता है जो आपकी कुंडली में है',
      en: 'The astrologer says only what your own chart says',
    },
    body: {
      hi: 'हर पाठ आपकी कुंडली, पूरी विंशोत्तरी दशा की समयरेखा, नौ ग्रहों के चल रहे गोचर और आपकी साढ़ेसाती की अवधि — इन्हीं से बनता है। और अगर आपकी कोई धारणा कुंडली से मेल नहीं खाती, तो हाँ में हाँ नहीं मिलाई जाती; विनम्रता से सुधार दिया जाता है।',
      en: 'Every reading is built from your chart, the full Vimshottari dasha timeline, where the nine planets are moving now and the window of your Sade Sati. And if an assumption of yours does not match the chart, it is not agreed with — it is politely corrected.',
    },
    stat: { hi: 'सिर्फ़ आपके अपने आँकड़ों से', en: 'Only from your own data' },
    note: {
      hi: 'कुंडली · विंशोत्तरी दशा · नौ ग्रहों का गोचर · साढ़ेसाती',
      en: 'Chart · Vimshottari dasha · transits of the nine planets · Sade Sati',
    },
  },
]

const STEPS: Bi[] = [
  {
    hi: 'जिस पंचांग पर आप भरोसा करते हैं, उसे खोलिए — कोई भी, कागज़ का हो या ऐप का।',
    en: 'Open whichever panchang you trust — any one, printed or on a screen.',
  },
  {
    hi: 'इसी पन्ने पर ऊपर “आज का पंचांग” खुला हुआ है। वह अभी, आपके शहर के लिए गिना गया है।',
    en: 'Higher up this same page, today’s panchang is already open. It was worked out just now, for your city.',
  },
  {
    hi: 'आज की तिथि, नक्षत्र और सूर्योदय — दोनों जगह मिलाकर देख लीजिए।',
    en: 'Compare today’s tithi, nakshatra and sunrise in both.',
  },
]

function Ledger({ hi, still }: { hi: boolean; still: boolean }) {
  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <div className="syj-ledger" data-sy-reveal="60">
      <div className="syj-ledger__crest">
        <TrustSeal still={still} />
        <p className="syj-ledger__label">{t('एक-एक करके मिलाया गया', 'Checked one by one')}</p>
      </div>

      <div className="syj-ledger__book">
        <div className="syj-ledger__head" aria-hidden>
          <span className="syj-ledger__who syj-ledger__who--a">
            {t('श्री यंत्र ने जो दिखाया', 'What Shree Yantra showed')}
          </span>
          <span className="syj-ledger__who syj-ledger__who--mid">{t('मिलान', 'Match')}</span>
          <span className="syj-ledger__who syj-ledger__who--b">
            {t('दृक पंचांग में जो लिखा है', 'What Drik Panchang says')}
          </span>
        </div>

        {ROWS.map((row, i) => (
          <div className="syj-ledger__row" key={row.id} data-sy-reveal={90 + i * 90}>
            <span className="syj-ledger__n syj-ledger__n--a">
              <span className="syj-sr">{t('श्री यंत्र — ', 'Shree Yantra — ')}</span>
              {row.ours}
            </span>

            <span className="syj-ledger__bridge">
              <i className="syj-ledger__wire syj-ledger__wire--a" aria-hidden />
              <TrustTick className="syj-ledger__tick" />
              <i className="syj-ledger__wire syj-ledger__wire--b" aria-hidden />
            </span>

            <span className="syj-ledger__n syj-ledger__n--b">
              <span className="syj-sr">{t('दृक पंचांग — ', 'Drik Panchang — ')}</span>
              {row.theirs}
            </span>

            <p className="syj-ledger__what">{hi ? row.what.hi : row.what.en}</p>
          </div>
        ))}
      </div>

      <p className="syj-ledger__foot">
        {t(
          'तीनों जाँचों में एक भी फ़र्क़ नहीं निकला।',
          'Across all three checks, not one difference turned up.',
        )}
      </p>
    </div>
  )
}

function ProofCard({ proof, index, hi }: { proof: Proof; index: number; hi: boolean }) {
  return (
    <article className="syj-trust__card" data-sy-reveal={String(60 + index * 70)}>
      <header className="syj-trust__cardhead">
        <span className="syj-trust__glyph" aria-hidden>
          <TrustGlyph name={proof.glyph} />
        </span>
        <span className="syj-trust__idx sy-num" aria-hidden>
          {String(index + 1).padStart(2, '0')}
        </span>
      </header>

      <h3 className="sy-h3 syj-trust__cardtitle">{hi ? proof.title.hi : proof.title.en}</h3>
      <p className="sy-body syj-trust__cardbody">{hi ? proof.body.hi : proof.body.en}</p>

      <p className="syj-trust__ev">
        <TrustTick className="syj-trust__evtick" />
        <b className="sy-num">{hi ? proof.stat.hi : proof.stat.en}</b>
        <span className="sy-num">{hi ? proof.note.hi : proof.note.en}</span>
      </p>
    </article>
  )
}

export function AccuracyManifesto() {
  const { hi } = useLang()
  const reduced = useReducedMotion()
  const rootRef = useRevealChildren<HTMLElement>()

  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <section
      className="syj sy-section sy-site syj-trust"
      id="accuracy"
      ref={rootRef}
      aria-labelledby="sy-accuracy-title"
    >
      <span className="syj-trust__aura" aria-hidden />

      <div className="sy-container syj-trust__inner">
        <div className="syj-trust__intro" data-sy-reveal="0">
          <p className="sy-eyebrow sy-eyebrow--center">
            {t('मिलान का हिसाब', 'The verification record')}
          </p>
          <h2 id="sy-accuracy-title" className="sy-h2 syj-trust__h2">
            {t('भरोसा कहने से नहीं आता — ', 'Trust does not come from claims. ')}
            <span className="sy-gold-text">
              {t('मिलाकर देखने से आता है', 'It comes from checking.')}
            </span>
          </h2>
          <p className="sy-lead syj-trust__lead">
            {t(
              'ज्योतिष ऐप की सबसे भारी गलती होती है गलत तारीख़ — व्रत उसी दिन छूटता है, मुहूर्त उसी दिन निकल जाता है। इसलिए हमने अंदाज़े पर कुछ नहीं छोड़ा: हर तारीख़ और हर चौघड़िया दृक पंचांग से एक-एक करके मिलाया, और नतीजा जैसा निकला वैसा ही यहाँ रख दिया है।',
              'The costliest thing an astrology app can get wrong is a date — the vrat is missed on exactly that day, the muhurat passes on exactly that day. So nothing was left to assumption: every date and every choghadiya was compared with Drik Panchang, one at a time, and the result is set down here exactly as it came out.',
            )}
          </p>
        </div>

        <Ledger hi={hi} still={reduced} />

        <div className="syj-trust__cards">
          {PROOFS.map((proof, i) => (
            <ProofCard key={proof.id} proof={proof} index={i} hi={hi} />
          ))}
        </div>

        <div className="syj-trust__invite" data-sy-reveal="60">
          <div>
            <p className="syj-kicker">{t('खुद जाँचिए', 'Check it yourself')}</p>
            <h3 className="sy-h3 syj-trust__invitetitle">
              {t(
                'हमारी बात मानने की ज़रूरत नहीं — मिलाकर देख लीजिए।',
                'You do not have to take our word for it — compare.',
              )}
            </h3>
            <ol className="syj-trust__steps">
              {STEPS.map((step) => (
                <li key={step.en}>{hi ? step.hi : step.en}</li>
              ))}
            </ol>
          </div>

          <div className="syj-trust__invitecta">
            <a
              className="sy-btn-gold"
              href="#live-proof"
              onClick={(e) => {
                e.preventDefault()
                scrollToHash('#live-proof')
              }}
            >
              <TrustArrowUp />
              {t('ऊपर आज का पंचांग देखिए', 'See today’s panchang')}
            </a>
            <p className="syj-trust__invitenote">
              {t(
                'ऊपर जो पंचांग दिख रहा है वह कोई तस्वीर नहीं है — वही गणना है जो ऐप में चलती है। मिलान में फ़र्क़ नहीं आना चाहिए। पूरी बात इतनी ही है।',
                'The panchang up there is not a screenshot — it is the same engine the app runs on. There should be no difference between the two. That is the whole point.',
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
