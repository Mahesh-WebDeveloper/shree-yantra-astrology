import { useLang } from '@/i18n/LangProvider'
import { scrollToHash, useReducedMotion, useRevealChildren } from './hooks/useSiteMotion'
import { TrustArrowUp, TrustGlyph, TrustSeal, TrustTick, type GlyphName } from './parts/trustMarks'
import './sections.css'

type Bi = { hi: string; en: string }

/* ─────────────────────────────────────────────────────────────
   Trust copy for the public website. Keep it professional:
   explain the method and user benefit without noisy test-counts.
   ───────────────────────────────────────────────────────────── */

/** The concordance: what we showed, what the panchang says, one row per check. */
type Row = { id: string; ours: Bi; theirs: Bi; what: Bi }

const ROWS: Row[] = [
  {
    id: 'dates',
    ours: { hi: 'जन्म विवरण', en: 'Birth details' },
    theirs: { hi: 'ग्रह-स्थिति की गणना', en: 'Planetary calculation' },
    what: {
      hi: 'जन्म तिथि, सटीक समय और स्थान से व्यक्तिगत कुंडली तैयार होती है',
      en: 'Date, exact time and place of birth are used to prepare a personal chart',
    },
  },
  {
    id: 'years',
    ours: { hi: 'स्थान-आधारित पंचांग', en: 'Location-based Panchang' },
    theirs: { hi: 'स्थानीय सूर्योदय', en: 'Local sunrise' },
    what: {
      hi: 'शहर बदलने पर सूर्योदय, सूर्यास्त और उनसे जुड़े पंचांग समय भी बदलते हैं',
      en: 'Changing the city updates sunrise, sunset and the Panchang timings derived from them',
    },
  },
  {
    id: 'choghadiya',
    ours: { hi: 'तिथि और मुहूर्त', en: 'Tithi and Muhurat' },
    theirs: { hi: 'लाहिड़ी अयनांश व उदय तिथि', en: 'Lahiri ayanamsa and Udaya Tithi' },
    what: {
      hi: 'परिणाम को प्रभावित करने वाली प्रमुख गणना-पद्धतियाँ स्पष्ट बताई जाती हैं',
      en: 'The key conventions that affect a result are stated clearly',
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
      hi: 'कुंडली की सही शुरुआत आपके जन्म विवरण से होती है',
      en: 'A reliable birth chart begins with accurate birth details',
    },
    body: {
      hi: 'जन्म समय या स्थान में छोटा अंतर भी लग्न और भावों की स्थिति बदल सकता है। इसलिए ऐप कुंडली बनाने से पहले जन्म तिथि, समय और स्थान को आधार बनाता है।',
      en: 'Even a small difference in birth time or place can change the lagna and house positions. The app therefore uses your date, time and place of birth as the foundation of the chart.',
    },
    stat: { hi: 'जन्म विवरण', en: 'Birth details' },
    note: {
      hi: 'जन्म तिथि · सटीक समय · जन्म स्थान',
      en: 'Date of birth · exact time · place of birth',
    },
  },
  {
    id: 'choghadiya',
    glyph: 'dial',
    title: {
      hi: 'पंचांग का समय आपके शहर के अनुसार बदलता है',
      en: 'Panchang timings should match your location',
    },
    body: {
      hi: 'हर शहर में सूर्योदय और सूर्यास्त का समय अलग होता है। इसी कारण पंचांग, चौघड़िया और दैनिक शुभ समय चुने गए स्थान के अनुसार दिखाए जाते हैं।',
      en: 'Sunrise and sunset vary by location. Panchang, Choghadiya and daily auspicious timings are therefore shown for the city you select.',
    },
    stat: { hi: 'स्थान अनुसार', en: 'Location-aware' },
    note: {
      hi: 'शुभ, लाभ, अमृत, काल, रोग, उद्वेग — हर अवधि स्पष्ट रंग और अर्थ के साथ।',
      en: 'Shubh, Labh, Amrit, Kaal, Rog and Udveg are shown with clear meaning and visual priority.',
    },
  },
  {
    id: 'computed',
    glyph: 'sunrise',
    title: {
      hi: 'गणना-पद्धति की जानकारी स्पष्ट रूप से दी जाती है',
      en: 'The calculation method is explained clearly',
    },
    body: {
      hi: 'लाहिड़ी अयनांश, उदय तिथि और स्थान के अनुसार सूर्योदय जैसी पद्धतियाँ परिणाम को प्रभावित करती हैं। ऐप इन प्रमुख आधारों को स्पष्ट रूप से बताता है।',
      en: 'Conventions such as Lahiri ayanamsa, Udaya Tithi and local sunrise affect the result. The app identifies these important calculation choices clearly.',
    },
    stat: { hi: 'स्पष्ट पद्धति', en: 'Clear methodology' },
    note: {
      hi: 'गणना और ज्योतिषीय व्याख्या को अलग-अलग समझाया जाता है।',
      en: 'Calculation and astrological interpretation are presented separately.',
    },
  },
  {
    id: 'grounded',
    glyph: 'chart',
    title: {
      hi: 'कुंडली की जानकारी सरल भाषा में समझाई जाती है',
      en: 'Birth-chart insights are explained in plain language',
    },
    body: {
      hi: 'व्यक्तिगत व्याख्या तैयार करते समय जन्म कुंडली, दशा और वर्तमान गोचर को ध्यान में रखा जाता है। इससे तकनीकी ज्योतिषीय संकेतों को सामान्य भाषा में समझना आसान होता है।',
      en: 'Personal explanations consider the birth chart, dasha and current transits, making technical astrological indications easier to understand.',
    },
    stat: { hi: 'सरल व्याख्या', en: 'Clear explanation' },
    note: {
      hi: 'कुंडली · दशा · गोचर · संबंधित उपाय',
      en: 'Kundli · dasha · transits · relevant remedies',
    },
  },
]

const STEPS: Bi[] = [
  {
    hi: 'अपना शहर चुनें और आज का पंचांग खोलें।',
    en: 'Choose your city and open today’s panchang.',
  },
  {
    hi: 'तिथि, नक्षत्र, सूर्योदय और शुभ समय एक साथ देखें।',
    en: 'View tithi, nakshatra, sunrise and auspicious timings together.',
  },
  {
    hi: 'महत्वपूर्ण संस्कार के लिए अपने स्थानीय पंचांग या पुरोहित से भी पुष्टि कर सकते हैं।',
    en: 'For an important ceremony, you can still confirm with your local panchang or family purohit.',
  },
]

function Ledger({ hi, still }: { hi: boolean; still: boolean }) {
  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <div className="syj-ledger" data-sy-reveal="60">
      <div className="syj-ledger__crest">
        <TrustSeal still={still} />
        <p className="syj-ledger__label">{t('गणना के प्रमुख आधार', 'Key calculation principles')}</p>
      </div>

      <div className="syj-ledger__book">
        <div className="syj-ledger__head" aria-hidden>
          <span className="syj-ledger__who syj-ledger__who--a">
            {t('श्री यंत्र क्या दिखाता है', 'What Shree Yantra shows')}
          </span>
          <span className="syj-ledger__who syj-ledger__who--mid">{t('आधार', 'Basis')}</span>
          <span className="syj-ledger__who syj-ledger__who--b">
            {t('पंचांग की परंपरा', 'Panchang tradition')}
          </span>
        </div>

        {ROWS.map((row, i) => (
          <div className="syj-ledger__row" key={row.id} data-sy-reveal={90 + i * 90}>
            <span className="syj-ledger__n syj-ledger__n--a">
              <span className="syj-sr">{t('श्री यंत्र — ', 'Shree Yantra — ')}</span>
              {hi ? row.ours.hi : row.ours.en}
            </span>

            <span className="syj-ledger__bridge">
              <i className="syj-ledger__wire syj-ledger__wire--a" aria-hidden />
              <TrustTick className="syj-ledger__tick" />
              <i className="syj-ledger__wire syj-ledger__wire--b" aria-hidden />
            </span>

            <span className="syj-ledger__n syj-ledger__n--b">
              <span className="syj-sr">{t('परंपरा — ', 'Tradition — ')}</span>
              {hi ? row.theirs.hi : row.theirs.en}
            </span>

            <p className="syj-ledger__what">{hi ? row.what.hi : row.what.en}</p>
          </div>
        ))}
      </div>

      <p className="syj-ledger__foot">
        {t(
          'हर परिणाम के साथ उसके आवश्यक विवरण और गणना-पद्धति को समझना आसान रखा गया है।',
          'The essential inputs and calculation method behind each result are kept easy to understand.',
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
            {t('गणना और व्याख्या', 'Calculation and interpretation')}
          </p>
          <h2 id="sy-accuracy-title" className="sy-h2 syj-trust__h2">
            {t('पारंपरिक वैदिक गणना, ', 'Traditional Vedic calculations, ')}
            <span className="sy-gold-text">
              {t('सरल भाषा में स्पष्ट जानकारी', 'explained in language you can understand')}
            </span>
          </h2>
          <p className="sy-lead syj-trust__lead">
            {t(
              'श्री यंत्र खगोलीय ग्रह-स्थितियों, स्थान के अनुसार पंचांग और प्रचलित वैदिक ज्योतिष पद्धतियों के आधार पर गणना करता है। तकनीकी परिणामों को सरल भाषा में प्रस्तुत किया जाता है, ताकि सामान्य उपयोगकर्ता भी उन्हें आसानी से समझ सके।',
              'Shree Yantra uses astronomical planetary positions, location-based Panchang rules and established Vedic astrology methods. Technical results are presented in clear language so they are easier for anyone to understand.',
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
            <p className="syj-kicker">{t('आज का उदाहरण देखें', 'View a live example')}</p>
            <h3 className="sy-h3 syj-trust__invitetitle">
              {t(
                'अपने शहर का आज का पंचांग देखें',
                'See today’s Panchang for your city',
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
              {t('आज का पंचांग देखें', 'View today’s Panchang')}
            </a>
            <p className="syj-trust__invitenote">
              {t(
                'विवाह, गृह प्रवेश या अन्य महत्वपूर्ण संस्कार के लिए अंतिम समय तय करने से पहले स्थानीय पंचांग या योग्य ज्योतिषाचार्य से पुष्टि करना उचित है।',
                'Before finalising the time for a wedding, griha pravesh or another important ceremony, it is appropriate to confirm with a local Panchang or qualified astrologer.',
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
