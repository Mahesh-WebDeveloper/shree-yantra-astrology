import { useLang } from '@/i18n/LangProvider'
import './sections.css'

/**
 * The trust-clincher: an honest, plain-words comparison.
 * No competitor is ever named — the other column is simply "typical
 * astrology apps". Each row leads with the thing an ordinary person cares
 * about, then says in one line why it matters, and only then compares.
 *
 * Desktop is three columns (topic · them · us) with the "us" column lit in
 * gold by a single continuous overlay, so there is no banding between rows.
 * Below 860px every row becomes its own card and the two claims stack.
 */

type Row = {
  id: string
  topic: { hi: string; en: string }
  why: { hi: string; en: string }
  them: { hi: string; en: string }
  us: { hi: string; en: string }
}

const ROWS: Row[] = [
  {
    id: 'rashifal',
    topic: { hi: 'आपका राशिफल', en: 'Your rashifal' },
    why: {
      hi: 'एक ही राशिफल करोड़ों लोगों पर सही नहीं बैठ सकता।',
      en: 'One rashifal cannot possibly fit crores of people.',
    },
    them: {
      hi: 'सिर्फ़ सूर्य-राशि देखकर लिखा गया एक जैसा टेक्स्ट — सबके लिए वही।',
      en: 'The same text for everyone, written from the sun sign alone.',
    },
    us: {
      hi: 'आपकी अपनी जन्म कुंडली से बनी भविष्यवाणी — आपके भाव, ग्रह और चल रही दशा के हिसाब से।',
      en: 'A reading built from your own birth chart — your houses, your planets, the period you are actually in.',
    },
  },
  {
    id: 'dates',
    topic: { hi: 'त्योहार और व्रत की तारीख', en: 'Festival and vrat dates' },
    why: {
      hi: 'व्रत एक दिन आगे-पीछे रह जाए तो पूरा दिन बेकार चला जाता है।',
      en: 'A vrat kept a day early is a whole day wasted.',
    },
    them: {
      hi: 'तारीख़ कभी-कभी पंचांग से अलग निकल आती है।',
      en: 'Dates that sometimes disagree with the panchang.',
    },
    us: {
      hi: 'हर तारीख़ पंचांग से मिलाकर जाँची हुई — 2026, 2027 और 2050 की सभी 767 तारीखें सही निकलीं।',
      en: 'Every date checked against the panchang — all 767 across 2026, 2027 and 2050 came out right.',
    },
  },
  {
    id: 'answer',
    topic: { hi: 'सवाल का जवाब', en: 'When you ask a question' },
    why: {
      hi: 'जो सुनने में अच्छा लगे, ज़रूरी नहीं कि वही सच हो।',
      en: 'What is pleasant to hear is not always what is true.',
    },
    them: {
      hi: 'आप जो कह दें, चैट उसी में हाँ मिला देती है।',
      en: 'Whatever you claim, the chat simply agrees with it.',
    },
    us: {
      hi: 'जवाब आपकी कुंडली के आधार पर — और ज़रूरत हो तो विनम्रता से सुधार भी कर दिया जाता है।',
      en: 'The answer comes from your chart — and where you are wrong, you are politely corrected.',
    },
  },
  {
    id: 'granth',
    topic: { hi: 'ग्रंथ और पाठ', en: 'Scriptures to read' },
    why: {
      hi: 'पढ़ने या सुनने का मन करे तो सब कुछ एक ही जगह मिलना चाहिए।',
      en: 'When you feel like reading or listening, it should all be in one place.',
    },
    them: {
      hi: 'थोड़ा-बहुत — कुछ पन्ने पढ़े और खत्म।',
      en: 'A little of everything — a few pages, and then nothing.',
    },
    us: {
      hi: '18 पुराण, 4 वेद, गीता, रामायण और महाभारत — मूल पाठ के साथ, और सुनने के लिए ऑडियो भी।',
      en: '18 Puranas, 4 Vedas, the Gita, Ramayan and Mahabharat — with the original text, and audio to listen to.',
    },
  },
  {
    id: 'lang',
    topic: { hi: 'भाषा', en: 'Language' },
    why: {
      hi: 'जो बात पढ़ने में ही समझ न आए, उस पर भरोसा कैसे हो।',
      en: 'You cannot trust what you cannot comfortably read.',
    },
    them: {
      hi: 'ज़्यादातर सिर्फ़ English में।',
      en: 'Mostly English, and only English.',
    },
    us: {
      hi: 'पूरा ऐप हिंदी और English दोनों में — एक बटन दबाइए, भाषा बदल जाती है।',
      en: 'The whole app in both Hindi and English — one tap switches it.',
    },
  },
  {
    id: 'cost',
    topic: { hi: 'खर्च', en: 'What it costs' },
    why: {
      hi: 'पैसे की बात पहले साफ़ होनी चाहिए, बाद में नहीं।',
      en: 'Money should be clear before you pay, not after.',
    },
    them: {
      hi: 'छिपे हुए चार्ज, जो बाद में पता चलते हैं।',
      en: 'Hidden charges that you only find out about later.',
    },
    us: {
      hi: 'साफ़-साफ़ प्लान — कीमत पहले ही दिख जाती है, कोई छिपा शुल्क नहीं।',
      en: 'Plain plans — the price is shown up front, and nothing is hidden.',
    },
  },
  {
    id: 'data',
    topic: { hi: 'आपका जन्म विवरण', en: 'Your birth details' },
    why: {
      hi: 'जन्म की तारीख, समय और जगह बहुत निजी बात है।',
      en: 'Your date, time and place of birth are deeply personal.',
    },
    them: {
      hi: 'विज्ञापन के लिए आगे साझा कर दिया जाता है।',
      en: 'Passed along to others so you can be advertised to.',
    },
    us: {
      hi: 'आपका जन्म विवरण आपका ही रहता है — सिर्फ़ आपकी कुंडली बनाने के काम आता है।',
      en: 'Your birth details stay yours — they are used only to work out your own chart.',
    },
  },
]

function MarkCross() {
  return (
    <svg className="syj-vs2__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path
        d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MarkCheck() {
  return (
    <svg className="syj-vs2__mark" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
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

export function WhyDifferent() {
  const { hi } = useLang()

  const themLabel = hi ? 'आम ज्योतिष ऐप' : 'Typical astrology apps'
  const usLabel = hi ? 'श्री यंत्र' : 'Shree Yantra'

  return (
    <section className="syj sy-section syj-why" aria-labelledby="syj-why-h">
      <span className="syj-why__bg" aria-hidden />
      <div className="sy-container">
        <div className="syj-intro">
          <p className="syj-kicker">{hi ? 'फ़र्क़ क्या है' : 'What is different'}</p>
          <h2 id="syj-why-h" className="syj-title">
            {hi ? (
              <>
                देखने में एक जैसा। <em>अंदर से बिलकुल नहीं।</em>
              </>
            ) : (
              <>
                It looks the same. <em>Inside, it is not.</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'नीचे सात बातें हैं — वही सात, जिनकी वजह से लोग ऐप छोड़ देते हैं। हर एक आप खुद ऐप खोलकर मिला सकते हैं।'
              : 'Seven things below — the same seven that make people give up on an astrology app. You can open the app and check every one of them.'}
          </p>
        </div>

        <div className="syj-vs2" role="table" aria-label={hi ? 'तुलना' : 'Comparison'}>
          <span className="syj-vs2__lit" aria-hidden />

          <div className="syj-vs2__row syj-vs2__row--head" role="row">
            <div className="syj-vs2__topic" role="columnheader">
              <span className="syj-vs2__headnote">
                {hi ? 'सात बातें, आमने-सामने' : 'Seven things, side by side'}
              </span>
            </div>
            <div className="syj-vs2__head syj-vs2__head--them" role="columnheader">
              <em>{hi ? 'दूसरी जगह' : 'Elsewhere'}</em>
              <b>{themLabel}</b>
            </div>
            <div className="syj-vs2__head syj-vs2__head--us" role="columnheader">
              <em>{hi ? 'यहाँ' : 'Here'}</em>
              <b>{usLabel}</b>
            </div>
          </div>

          {ROWS.map((row) => (
            <div className="syj-vs2__row" role="row" key={row.id}>
              <div className="syj-vs2__topic" role="rowheader">
                <h3>{hi ? row.topic.hi : row.topic.en}</h3>
                <p>{hi ? row.why.hi : row.why.en}</p>
              </div>

              <div className="syj-vs2__cell syj-vs2__them" role="cell">
                <span className="syj-vs2__who">{themLabel}</span>
                <span className="syj-vs2__line">
                  <MarkCross />
                  <span>{hi ? row.them.hi : row.them.en}</span>
                </span>
              </div>

              <div className="syj-vs2__cell syj-vs2__us" role="cell">
                <span className="syj-vs2__who">{usLabel}</span>
                <span className="syj-vs2__line">
                  <MarkCheck />
                  <strong>{hi ? row.us.hi : row.us.en}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="syj-vs2__foot">
          <p>
            {hi
              ? 'ऊपर लिखी एक भी बात मान लेने की ज़रूरत नहीं — ऐप खोलिए और खुद मिलाकर देख लीजिए।'
              : 'You do not have to take a single line above on trust — open the app and check it yourself.'}
          </p>
          <a className="sy-btn-gold sy-btn-sm" href="#download">
            {hi ? 'ऐप डाउनलोड कीजिए' : 'Download the app'}
          </a>
        </div>
      </div>
    </section>
  )
}
