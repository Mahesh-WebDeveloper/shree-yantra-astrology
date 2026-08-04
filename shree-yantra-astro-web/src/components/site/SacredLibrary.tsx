import { useLang } from '@/i18n/LangProvider'
import { Marquee, TiltCard, type MarqueeItem } from './parts/motionBits'
import { useRevealChildren } from './hooks/useSiteMotion'
import './sections.css'

/**
 * Sacred reading and listening copy for the public website.
 * Keep it devotional, useful and premium without turning the section into
 * a table of counts.
 */

type Bi = { hi: string; en: string }
type Purana = { hi: string; en: string; meta: Bi; katha?: boolean }

const PURANAS: Purana[] = [
  { hi: 'स्कन्द पुराण', en: 'Skanda Purana', meta: { hi: 'अध्याय-वार पाठ', en: 'chapter-wise reading' } },
  { hi: 'पद्म पुराण', en: 'Padma Purana', meta: { hi: 'धार्मिक कथा', en: 'sacred narrative' } },
  { hi: 'शिव पुराण', en: 'Shiva Purana', meta: { hi: 'कथा सहित', en: 'with katha' }, katha: true },
  { hi: 'अग्नि पुराण', en: 'Agni Purana', meta: { hi: 'विषय-आधारित ज्ञान', en: 'thematic knowledge text' } },
  { hi: 'श्रीमद् भागवत', en: 'Bhagavata Purana', meta: { hi: 'भक्ति कथा', en: 'devotional katha' }, katha: true },
  { hi: 'गरुड़ पुराण', en: 'Garuda Purana', meta: { hi: 'धर्म और नीति', en: 'dharma and guidance' }, katha: true },
  { hi: 'मत्स्य पुराण', en: 'Matsya Purana', meta: { hi: 'पुराण पाठ', en: 'purana reading' } },
  { hi: 'ब्रह्मवैवर्त पुराण', en: 'Brahmavaivarta Purana', meta: { hi: 'लीला और भक्ति', en: 'leela and bhakti' } },
  { hi: 'ब्रह्म पुराण', en: 'Brahma Purana', meta: { hi: 'तीर्थ और कथा', en: 'tirtha and katha' } },
  { hi: 'वराह पुराण', en: 'Varaha Purana', meta: { hi: 'धार्मिक पाठ', en: 'devotional text' } },
  { hi: 'नारद पुराण', en: 'Narada Purana', meta: { hi: 'भक्ति मार्ग', en: 'path of bhakti' } },
  { hi: 'ब्रह्माण्ड पुराण', en: 'Brahmanda Purana', meta: { hi: 'सृष्टि कथा', en: 'cosmic narrative' } },
  { hi: 'मार्कण्डेय पुराण', en: 'Markandeya Purana', meta: { hi: 'देवी महिमा', en: 'Devi tradition' } },
  { hi: 'विष्णु पुराण', en: 'Vishnu Purana', meta: { hi: 'विष्णु कथा', en: 'Vishnu katha' }, katha: true },
  { hi: 'वामन पुराण', en: 'Vamana Purana', meta: { hi: 'अवतार कथा', en: 'avatar katha' } },
  { hi: 'कूर्म पुराण', en: 'Kurma Purana', meta: { hi: 'पुराण पाठ', en: 'purana reading' } },
  { hi: 'भविष्य पुराण', en: 'Bhavishya Purana', meta: { hi: 'अध्याय-वार पाठ', en: 'chapter-wise reading' } },
  { hi: 'लिङ्ग पुराण', en: 'Linga Purana', meta: { hi: 'शिव परंपरा', en: 'Shaiva tradition' } },
]

const VEDAS = [
  { hi: 'ऋग्वेद', en: 'Rigveda', meta: { hi: 'सूक्त पाठ', en: 'sukta reading' } },
  { hi: 'अथर्ववेद', en: 'Atharvaveda', meta: { hi: 'मंत्र और सूक्त', en: 'mantra and sukta' } },
  { hi: 'सामवेद', en: 'Samaveda', meta: { hi: 'स्वर परंपरा', en: 'chant tradition' } },
  { hi: 'यजुर्वेद', en: 'Yajurveda', meta: { hi: 'यज्ञ परंपरा', en: 'yajna tradition' } },
  { hi: 'उपनिषद्', en: 'Upanishads', meta: { hi: 'दार्शनिक पाठ', en: 'philosophical texts' } },
]

const AUDIO = [
  { hi: 'आरती संग्रह', en: 'Aarti collection', meta: { hi: 'दैनिक पूजा के लिए', en: 'for daily puja' } },
  {
    hi: 'मंत्र और भजन',
    en: 'Mantras and bhajans',
    meta: { hi: 'सुनने और जप के लिए', en: 'for listening and chanting' },
  },
  { hi: 'ध्यान संगीत', en: 'Meditation music', meta: { hi: 'वाद्य संगीत', en: 'instrumental audio' } },
  { hi: 'रामायण कथा', en: 'Ramayan katha', meta: { hi: 'भाग-दर-भाग', en: 'episode-wise' } },
  { hi: 'महाभारत कथा', en: 'Mahabharat katha', meta: { hi: 'कथा श्रवण', en: 'katha audio' } },
  { hi: 'यथार्थ गीता', en: 'Yatharth Geeta', meta: { hi: 'श्रवण पाठ', en: 'audio paath' } },
]

const BOOKS = [
  {
    id: 'gita',
    glyph: 'ॐ',
    hi: 'भगवद्गीता',
    en: 'Bhagavad Gita',
    metaHi: 'अध्याय-वार पाठ',
    metaEn: 'chapter-wise reading',
    descHi: 'अध्याय के अनुसार संस्कृत श्लोक और उपलब्ध हिंदी अर्थ।',
    descEn: 'Sanskrit verses organised by chapter, with available Hindi meaning.',
  },
  {
    id: 'ramayan',
    glyph: 'श्री',
    hi: 'वाल्मीकि रामायण',
    en: 'Valmiki Ramayana',
    metaHi: 'सर्ग-दर-सर्ग',
    metaEn: 'sarga by sarga',
    descHi: 'कांड और सर्ग के अनुसार व्यवस्थित वाल्मीकि रामायण पाठ।',
    descEn: 'Valmiki Ramayana organised by kanda and sarga.',
  },
  {
    id: 'manas',
    glyph: 'रा',
    hi: 'रामचरितमानस',
    en: 'Ramcharitmanas',
    metaHi: 'कांड-वार',
    metaEn: 'kanda-wise',
    descHi: 'कांड के अनुसार तुलसीदास की चौपाइयाँ और उपलब्ध हिंदी अर्थ।',
    descEn: 'Tulsidas’s verses organised by kanda, with available Hindi meaning.',
  },
  {
    id: 'mahabharat',
    glyph: 'भा',
    hi: 'महाभारत',
    en: 'Mahabharata',
    metaHi: 'पर्व-वार पाठ',
    metaEn: 'parva-wise reading',
    descHi: 'पर्व और खंड के अनुसार व्यवस्थित महाभारत पाठ।',
    descEn: 'Mahabharata organised by parva and readable sections.',
  },
]

export function SacredLibrary() {
  const { hi, lang } = useLang()
  const revealRef = useRevealChildren<HTMLElement>()

  const rowOne: MarqueeItem[] = PURANAS.map((p) => ({
    key: p.en,
    label: hi ? p.hi : p.en,
    meta: hi ? p.meta.hi : p.meta.en,
  }))

  const rowTwo: MarqueeItem[] = [
    { key: 'gita', label: hi ? 'भगवद्गीता' : 'Bhagavad Gita', meta: hi ? 'अर्थ सहित' : 'with meaning' },
    { key: 'ramayan', label: hi ? 'वाल्मीकि रामायण' : 'Valmiki Ramayana', meta: hi ? 'सर्ग-दर-सर्ग' : 'sarga-wise' },
    { key: 'manas', label: hi ? 'रामचरितमानस' : 'Ramcharitmanas', meta: hi ? 'कांड-वार' : 'kanda-wise' },
    { key: 'mb', label: hi ? 'महाभारत' : 'Mahabharata', meta: hi ? 'पर्व-वार' : 'parva-wise' },
    { key: 'rig', label: hi ? 'ऋग्वेद' : 'Rigveda', meta: hi ? 'सूक्त पाठ' : 'sukta reading' },
    { key: 'atharva', label: hi ? 'अथर्ववेद' : 'Atharvaveda', meta: hi ? 'मंत्र और सूक्त' : 'mantra and sukta' },
    { key: 'sama', label: hi ? 'सामवेद' : 'Samaveda', meta: hi ? 'स्वर परंपरा' : 'chant tradition' },
    { key: 'yajur', label: hi ? 'यजुर्वेद' : 'Yajurveda', meta: hi ? 'यज्ञ परंपरा' : 'yajna tradition' },
    { key: 'upanishad', label: hi ? 'उपनिषद्' : 'Upanishads', meta: hi ? 'ज्ञान पाठ' : 'wisdom texts' },
    { key: 'aarti', label: hi ? 'आरती संग्रह' : 'Aarti collection', meta: hi ? 'पूजा के लिए' : 'for puja' },
    { key: 'mantra', label: hi ? 'मंत्र संग्रह' : 'Mantra collection', meta: hi ? 'ऑडियो' : 'with audio' },
    { key: 'stotra', label: hi ? 'स्तोत्र संग्रह' : 'Stotra collection', meta: hi ? 'ऑडियो' : 'with audio' },
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
          <p className="syj-kicker">{hi ? 'धार्मिक ग्रंथ और भक्ति सामग्री' : 'Scriptures and devotional content'}</p>
          <h2 id="syj-library-h" className="syj-title">
            {hi ? (
              <>
                पढ़ें, अर्थ समझें <em>और सुविधानुसार सुनें</em>
              </>
            ) : (
              <>
                Read the text, understand the meaning, <em>or listen at your convenience</em>
              </>
            )}
          </h2>
          <p className="syj-sub">
            {hi
              ? 'भगवद्गीता, रामायण, रामचरितमानस, महाभारत, वेद, पुराण, आरती, मंत्र और स्तोत्र — दैनिक पाठ, स्वाध्याय और परिवार के साथ सुनने के लिए एक व्यवस्थित संग्रह।'
              : 'An organised collection of the Bhagavad Gita, Ramayana, Ramcharitmanas, Mahabharata, Vedas, Puranas, aarti, mantras and stotras for daily reading, study and family listening.'}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 'clamp(2.5rem, 5vw, 3.5rem)' }} data-sy-reveal="120">
        <Marquee
          key={`puranas-${lang}`}
          items={rowOne}
          seconds={64}
          ariaLabel={hi ? 'पुराणों की सूची' : 'List of Puranas'}
        />
        <Marquee
          key={`epics-${lang}`}
          items={rowTwo}
          reverse
          seconds={58}
          ariaLabel={hi ? 'वेद और महाकाव्य' : 'Vedas and epics'}
        />
      </div>

      <div className="sy-container">
        <ul className="syj-stats" data-sy-reveal="60">
          <li>
            <b>{hi ? 'शास्त्र' : 'Scriptures'}</b>
            <span>{hi ? 'गीता, रामायण, वेद और पुराण' : 'Gita, Ramayan, Vedas and Puranas'}</span>
          </li>
          <li>
            <b>{hi ? 'अर्थ' : 'Meaning'}</b>
            <span>{hi ? 'संस्कृत के साथ सरल हिंदी व्याख्या' : 'Simple Hindi explanation with Sanskrit text'}</span>
          </li>
          <li>
            <b>{hi ? 'श्रवण' : 'Audio'}</b>
            <span>{hi ? 'आरती, मंत्र, भजन और कथा' : 'Aarti, mantra, bhajan and katha'}</span>
          </li>
          <li>
            <b>{hi ? 'प्रगति' : 'Progress'}</b>
            <span>{hi ? 'पढ़ने और सुनने की प्रगति सहेजें' : 'Save your reading and listening progress'}</span>
          </li>
          <li>
            <b>{hi ? 'दैनिक' : 'Daily'}</b>
            <span>{hi ? 'आज का श्लोक और भक्ति सामग्री' : 'Verse of the day and devotional content'}</span>
          </li>
          <li>
            <b>{hi ? 'परिवार' : 'Family use'}</b>
            <span>{hi ? 'परिवार के साथ पढ़ने और सुनने के लिए' : 'Designed for reading and listening together'}</span>
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
            <p className="syj-kicker">{hi ? 'महापुराणों का संग्रह' : 'Collection of Mahapuranas'}</p>
            <h3>
              {hi
                ? 'पुराणों को अध्याय के अनुसार खोजने और पढ़ने के लिए व्यवस्थित किया गया है'
                : 'The Puranas are organised by chapter for easier browsing and reading'}
            </h3>
            <ul className="syj-corpus__list syj-corpus__list--cols">
              {PURANAS.map((p) => (
                <li key={p.en}>
                  <b>
                    {hi ? p.hi : p.en}
                    {p.katha ? <em>{hi ? 'कथा' : 'katha'}</em> : null}
                  </b>
                  <span>
                    {hi ? p.meta.hi : p.meta.en}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="syj-corpus__card" data-sy-reveal="120">
            <p className="syj-kicker">{hi ? 'वेद और उपनिषद्' : 'Vedas and Upanishads'}</p>
            <h3>{hi ? 'सूक्त और खंड के अनुसार व्यवस्थित वैदिक पाठ' : 'Vedic texts organised by sukta and section'}</h3>
            <ul className="syj-corpus__list">
              {VEDAS.map((v) => (
                <li key={v.en}>
                  <b>{hi ? v.hi : v.en}</b>
                  <span>{hi ? v.meta.hi : v.meta.en}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="syj-corpus__card" data-sy-reveal="180">
            <p className="syj-kicker">{hi ? 'भक्ति ऑडियो' : 'Devotional audio'}</p>
            <h3>
              {hi
                ? 'पूजा, जप और ध्यान के लिए आरती, भजन, मंत्र और कथाएँ'
                : 'Aarti, bhajans, mantras and devotional stories for puja, chanting and meditation'}
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
              ? 'जहाँ सरल अर्थ या कथा उपलब्ध है, उसे मूल पाठ से अलग दिखाया जाता है। इससे पाठक मूल ग्रंथ और उसकी व्याख्या, दोनों को स्पष्ट रूप से समझ सकता है।'
              : 'Where a simplified meaning or retelling is available, it is clearly separated from the source text so readers can distinguish the original from its explanation.'}
          </span>
        </p>
      </div>
    </section>
  )
}
