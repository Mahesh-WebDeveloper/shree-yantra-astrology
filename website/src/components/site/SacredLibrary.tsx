import { useLang } from '@/i18n/LangProvider'
import { CountUp, Marquee, TiltCard, type MarqueeItem } from './parts/motionBits'
import { useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

/**
 * The corpus that actually ships inside the app. Every number here is real —
 * nothing is rounded up, and the two partial Puranas are named as partial.
 */

type Purana = { hi: string; en: string; adhyaya: number | null; katha?: boolean }

const PURANAS: Purana[] = [
  { hi: 'स्कन्द पुराण', en: 'Skanda Purana', adhyaya: 1748 },
  { hi: 'पद्म पुराण', en: 'Padma Purana', adhyaya: 693 },
  { hi: 'शिव पुराण', en: 'Shiva Purana', adhyaya: 457, katha: true },
  { hi: 'अग्नि पुराण', en: 'Agni Purana', adhyaya: 383 },
  { hi: 'श्रीमद् भागवत', en: 'Bhagavata Purana', adhyaya: 335, katha: true },
  { hi: 'गरुड़ पुराण', en: 'Garuda Purana', adhyaya: 318, katha: true },
  { hi: 'मत्स्य पुराण', en: 'Matsya Purana', adhyaya: 291 },
  { hi: 'ब्रह्मवैवर्त पुराण', en: 'Brahmavaivarta Purana', adhyaya: 275 },
  { hi: 'ब्रह्म पुराण', en: 'Brahma Purana', adhyaya: 246 },
  { hi: 'वराह पुराण', en: 'Varaha Purana', adhyaya: 218 },
  { hi: 'नारद पुराण', en: 'Narada Purana', adhyaya: 195 },
  { hi: 'ब्रह्माण्ड पुराण', en: 'Brahmanda Purana', adhyaya: 156 },
  { hi: 'मार्कण्डेय पुराण', en: 'Markandeya Purana', adhyaya: 134 },
  { hi: 'विष्णु पुराण', en: 'Vishnu Purana', adhyaya: 126, katha: true },
  { hi: 'वामन पुराण', en: 'Vamana Purana', adhyaya: 96 },
  { hi: 'कूर्म पुराण', en: 'Kurma Purana', adhyaya: 95 },
  { hi: 'भविष्य पुराण', en: 'Bhavishya Purana', adhyaya: null },
  { hi: 'लिङ्ग पुराण', en: 'Linga Purana', adhyaya: null },
]

const VEDAS = [
  { hi: 'ऋग्वेद', en: 'Rigveda', count: '1,028', unitHi: 'सूक्त', unitEn: 'suktas' },
  { hi: 'अथर्ववेद', en: 'Atharvaveda', count: '736', unitHi: 'सूक्त', unitEn: 'suktas' },
  { hi: 'सामवेद', en: 'Samaveda', count: '189', unitHi: 'सूक्त', unitEn: 'suktas' },
  { hi: 'यजुर्वेद', en: 'Yajurveda', count: '40', unitHi: 'खंड', unitEn: 'sections' },
  { hi: 'उपनिषद्', en: 'Upanishads', count: '8', unitHi: 'ग्रंथ', unitEn: 'texts' },
]

const AUDIO = [
  { hi: 'आरती संग्रह', en: 'Aarti sangrah', meta: { hi: '18 आरती', en: '18 aartis' } },
  {
    hi: 'मंत्र और भजन',
    en: 'Mantras and bhajans',
    meta: { hi: 'महामृत्युंजय 108 सहित', en: 'incl. Mahamrityunjay 108' },
  },
  { hi: 'ध्यान संगीत', en: 'Meditation instrumentals', meta: { hi: 'वादन', en: 'instrumental' } },
  { hi: 'रामायण कथा', en: 'Ramayan katha', meta: { hi: '120 भाग', en: '120 episodes' } },
  { hi: 'महाभारत कथा', en: 'Mahabharat katha', meta: { hi: '100 भाग', en: '100 episodes' } },
  { hi: 'यथार्थ गीता', en: 'Yatharth Geeta', meta: { hi: '20 अध्याय', en: '20 chapters' } },
]

const BOOKS = [
  {
    id: 'gita',
    glyph: 'ॐ',
    hi: 'भगवद्गीता',
    en: 'Bhagavad Gita',
    metaHi: '18 अध्याय',
    metaEn: '18 chapters',
    descHi: 'संस्कृत श्लोक, हिंदी अर्थ और अध्याय-वार पाठ।',
    descEn: 'Sanskrit verse, Hindi meaning, chapter-by-chapter reading.',
  },
  {
    id: 'ramayan',
    glyph: 'श्री',
    hi: 'वाल्मीकि रामायण',
    en: 'Valmiki Ramayana',
    metaHi: '648 सर्ग',
    metaEn: '648 sargas',
    descHi: 'सातों कांड, सर्ग-दर-सर्ग मूल पाठ के साथ।',
    descEn: 'All seven kandas, sarga by sarga, with the original text.',
  },
  {
    id: 'manas',
    glyph: 'रा',
    hi: 'रामचरितमानस',
    en: 'Ramcharitmanas',
    metaHi: '7 कांड',
    metaEn: '7 kandas',
    descHi: 'तुलसीदास की चौपाइयाँ, हिंदी अर्थ के साथ।',
    descEn: 'Tulsidas in full, with the meaning in Hindi.',
  },
  {
    id: 'mahabharat',
    glyph: 'भा',
    hi: 'महाभारत',
    en: 'Mahabharata',
    metaHi: '1,995 खंड',
    metaEn: '1,995 sections',
    descHi: 'पर्व-दर-पर्व, खंडों में बँटा हुआ पाठ।',
    descEn: 'Parva by parva, divided into readable sections.',
  },
]

export function SacredLibrary() {
  const { hi } = useLang()
  const revealRef = useRevealChildren<HTMLElement>()

  const rowOne: MarqueeItem[] = PURANAS.map((p) => ({
    key: p.en,
    label: hi ? p.hi : p.en,
    meta: p.adhyaya
      ? `${p.adhyaya.toLocaleString('en-US')} ${hi ? 'अध्याय' : 'adhyayas'}`
      : hi
        ? 'आंशिक'
        : 'partial',
  }))

  const rowTwo: MarqueeItem[] = [
    { key: 'gita', label: hi ? 'भगवद्गीता' : 'Bhagavad Gita', meta: hi ? '18 अध्याय' : '18 chapters' },
    { key: 'ramayan', label: hi ? 'वाल्मीकि रामायण' : 'Valmiki Ramayana', meta: hi ? '648 सर्ग' : '648 sargas' },
    { key: 'manas', label: hi ? 'रामचरितमानस' : 'Ramcharitmanas', meta: hi ? '7 कांड' : '7 kandas' },
    { key: 'mb', label: hi ? 'महाभारत' : 'Mahabharata', meta: hi ? '1,995 खंड' : '1,995 sections' },
    { key: 'rig', label: hi ? 'ऋग्वेद' : 'Rigveda', meta: hi ? '1,028 सूक्त' : '1,028 suktas' },
    { key: 'atharva', label: hi ? 'अथर्ववेद' : 'Atharvaveda', meta: hi ? '736 सूक्त' : '736 suktas' },
    { key: 'sama', label: hi ? 'सामवेद' : 'Samaveda', meta: hi ? '189 सूक्त' : '189 suktas' },
    { key: 'yajur', label: hi ? 'यजुर्वेद' : 'Yajurveda', meta: hi ? '40 खंड' : '40 sections' },
    { key: 'upanishad', label: hi ? 'उपनिषद्' : 'Upanishads', meta: hi ? '8 ग्रंथ' : '8 texts' },
    { key: 'aarti', label: hi ? 'आरती संग्रह' : 'Aarti sangrah', meta: hi ? '18 आरती' : '18 aartis' },
    { key: 'mantra', label: hi ? 'मंत्र संग्रह' : 'Mantra sangrah', meta: hi ? 'ऑडियो' : 'with audio' },
    { key: 'stotra', label: hi ? 'स्तोत्र संग्रह' : 'Stotra sangrah', meta: hi ? 'ऑडियो' : 'with audio' },
    { key: 'chalisa', label: hi ? 'हनुमान चालीसा' : 'Hanuman Chalisa', meta: hi ? 'ऑडियो' : 'with audio' },
    { key: 'yatharth', label: hi ? 'यथार्थ गीता' : 'Yatharth Geeta', meta: hi ? '20 अध्याय' : '20 chapters' },
  ]

  return (
    <section
      id="library"
      className="syj sy-section syj-library"
      aria-labelledby="syj-library-h"
      ref={revealRef}
    >
      <span className="syj-library__bg" aria-hidden />

      <div className="sy-container">
        <div className="syj-intro" data-sy-reveal="0">
          <p className="syj-kicker">{hi ? 'पढ़ने और सुनने के लिए' : 'To read and to listen'}</p>
          <h2 id="syj-library-h" className="syj-title">
            {hi ? (
              <>
                घर भर का शास्त्र, <em>आपके फ़ोन में</em>
              </>
            ) : (
              <>
                A whole shelf of scriptures, <em>in your phone</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'गीता, रामायण, महाभारत और अठारहों पुराण — पढ़िए भी, और सुनिए भी। संस्कृत श्लोक के साथ उसका हिंदी अर्थ रहता है, इसलिए बात समझ में आती है; और जब पढ़ने का मन न हो, तो आरती, भजन, मंत्र और कथा सुन लीजिए। नीचे की हर संख्या वही है जो ऐप में सचमुच मौजूद है।'
              : 'The Gita, the Ramayan, the Mahabharat and all eighteen Puranas — to read, and to listen to. Every Sanskrit verse carries its meaning in Hindi, so it actually makes sense; and when you would rather not read, there is aarti, bhajan, mantra and katha to listen to. Every number below is what is really in the app.'}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }} data-sy-reveal="120">
        <Marquee
          items={rowOne}
          seconds={64}
          ariaLabel={hi ? 'पुराणों की सूची' : 'List of Puranas'}
        />
        <Marquee
          items={rowTwo}
          reverse
          seconds={58}
          ariaLabel={hi ? 'वेद और महाकाव्य' : 'Vedas and epics'}
        />
      </div>

      <div className="sy-container">
        <ul className="syj-stats" data-sy-reveal="60">
          <li>
            <b>
              <CountUp value={18} />
            </b>
            <span>{hi ? 'पुराण' : 'Puranas'}</span>
          </li>
          <li>
            <b>
              <CountUp value={5750} suffix="+" />
            </b>
            <span>{hi ? 'अध्याय' : 'Adhyayas'}</span>
          </li>
          <li>
            <b>
              <CountUp value={334000} />
            </b>
            <span>{hi ? 'श्लोक' : 'Shlokas'}</span>
          </li>
          <li>
            <b>
              <CountUp value={4} />
            </b>
            <span>{hi ? 'वेद' : 'Vedas'}</span>
          </li>
          <li>
            <b>
              <CountUp value={648} />
            </b>
            <span>{hi ? 'रामायण सर्ग' : 'Ramayana sargas'}</span>
          </li>
          <li>
            <b>
              <CountUp value={1995} />
            </b>
            <span>{hi ? 'महाभारत खंड' : 'Mahabharata sections'}</span>
          </li>
        </ul>

        <div className="syj-books">
          {BOOKS.map((book, i) => (
            <TiltCard key={book.id} reveal={60 + i * 70}>
              <article className="syj-book">
                <span className="syj-book__glyph" aria-hidden>
                  {book.glyph}
                </span>
                <h3>{hi ? book.hi : book.en}</h3>
                <strong>{hi ? book.metaHi : book.metaEn}</strong>
                <p>{hi ? book.descHi : book.descEn}</p>
              </article>
            </TiltCard>
          ))}
        </div>

        <div className="syj-corpus">
          <article className="syj-corpus__card syj-corpus__card--wide" data-sy-reveal="60">
            <p className="syj-kicker">{hi ? 'अठारह महापुराण' : 'The eighteen Mahapuranas'}</p>
            <h3>
              {hi
                ? 'हर पुराण में कितने अध्याय हैं — जितने ऐप में सचमुच हैं'
                : 'How many chapters each one has — exactly as many as the app really has'}
            </h3>
            <ul className="syj-corpus__list syj-corpus__list--cols">
              {PURANAS.map((p) => (
                <li key={p.en}>
                  <b>
                    {hi ? p.hi : p.en}
                    {p.katha ? <em>{hi ? 'कथा' : 'katha'}</em> : null}
                  </b>
                  <span>
                    {p.adhyaya
                      ? `${p.adhyaya.toLocaleString('en-US')} ${hi ? 'अध्याय' : 'adhyayas'}`
                      : hi
                        ? 'आंशिक'
                        : 'partial'}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="syj-corpus__card" data-sy-reveal="120">
            <p className="syj-kicker">{hi ? 'चारों वेद' : 'All four Vedas'}</p>
            <h3>{hi ? 'मूल पाठ, जैसा है वैसा' : 'The original text, just as it is'}</h3>
            <ul className="syj-corpus__list">
              {VEDAS.map((v) => (
                <li key={v.en}>
                  <b>{hi ? v.hi : v.en}</b>
                  <span>
                    {v.count} {hi ? v.unitHi : v.unitEn}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="syj-corpus__card" data-sy-reveal="180">
            <p className="syj-kicker">{hi ? 'सुनने के लिए' : 'To listen'}</p>
            <h3>
              {hi
                ? 'आरती, भजन और कथा — पूजा के समय चला लीजिए'
                : 'Aarti, bhajan and katha — put it on while you do the puja'}
            </h3>
            <ul className="syj-corpus__list">
              {AUDIO.map((a) => (
                <li key={a.en}>
                  <b>{hi ? a.hi : a.en}</b>
                  <span>{hi ? a.meta.hi : a.meta.en}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="syj-note" data-sy-reveal="0">
          <b aria-hidden>—</b>
          <span>
            {hi
              ? 'साफ़-साफ़ बात: 18 में से 16 पुराण पूरे हैं। भविष्य पुराण और लिङ्ग पुराण अभी अधूरे हैं, क्योंकि इनका पूरा डिजिटल पाठ कहीं मिलता ही नहीं। जिस दिन मिल जाएगा, जोड़ दिया जाएगा — तब तक इन पर "आंशिक" ही लिखा रहेगा, यहाँ भी और ऐप में भी।'
              : 'Said plainly: 16 of the 18 Puranas are complete. The Bhavishya and Linga Puranas are still partial, because no complete digital text of them exists anywhere. The day one turns up, it goes in — until then they stay labelled partial, here and inside the app.'}
          </span>
        </p>
      </div>
    </section>
  )
}
