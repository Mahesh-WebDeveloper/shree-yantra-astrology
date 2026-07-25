import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { VedicIcon } from '@/components/cosmic/VedicIcon'
import { ZodiacWheel } from '@/components/cosmic/ZodiacWheel'
import { AppPhoneMockup } from '@/components/showcase/AppPhoneMockup'
import { ScrollShowcase } from '@/components/showcase/ScrollShowcase'
import { StoreButtons } from '@/components/showcase/StoreButtons'
import { useLang } from '@/i18n/LangProvider'
import { APP_SCREENS, getScreen } from '@/data/appScreens'
import {
  BRAND_PROMISE,
  DOWNLOAD_FINALE_COPY,
  FAQ_ITEMS,
  FAQ_SECTION,
  FEATURE_JOURNEYS,
  HERO_COPY,
  HOW_IT_WORKS,
  HOW_SECTION,
  INTELLIGENCE_COPY,
  JOURNEYS_SECTION,
  METHOD_POINTS,
  METHOD_SECTION,
  SACRED_LIBRARY_BOOKS,
  SACRED_LIBRARY_COPY,
  type LocalizedText,
} from '@/data/brandShowcase'
import { SHOWCASE_TRUST, SHOWCASE_BIG_STATS } from '@/data/showcase'

function copy(text: LocalizedText, hi: boolean) {
  return hi ? text.hi : text.en
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ArrowDown() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 4v15m0 0 6-6m-6 6-6-6" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="sy-section-label">
      <span aria-hidden />
      {children}
    </p>
  )
}

function Hero() {
  const { hi } = useLang()
  const reduceMotion = useReducedMotion()
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const visualY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 48])
  const visualRotate = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -1.5])
  const wheelOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.25, 0.15])
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0])

  return (
    <section ref={heroRef} id="hero" className="sy-hero" aria-labelledby="hero-title">
      <div className="sy-hero__sky" aria-hidden>
        <span className="sy-star sy-star--1" />
        <span className="sy-star sy-star--2" />
        <span className="sy-star sy-star--3" />
        <span className="sy-star sy-star--4" />
        <span className="sy-star sy-star--5" />
        <span className="sy-orbit sy-orbit--one" />
        <span className="sy-orbit sy-orbit--two" />
      </div>

      <div className="sy-hero__layout">
        <motion.div
          className="sy-hero__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sy-product-pill">
            <ShreeYantraLogo size={22} pulse={false} />
            <span>{copy(HERO_COPY.eyebrow, hi)}</span>
          </div>

          <h1 id="hero-title" className="sy-hero__title">
            <span className="sy-hero__title-line">{copy(HERO_COPY.headlineLine1, hi)}</span>
            <span className="sy-hero__title-line sy-hero__title-line--accent">{copy(HERO_COPY.headlineLine2, hi)}</span>
            <span className="sy-hero__title-line">{copy(HERO_COPY.headlineLine3, hi)}</span>
          </h1>

          <p className="sy-hero__lead">{copy(HERO_COPY.lead, hi)}</p>

          <div className="sy-hero__actions">
            <StoreButtons size="lg" />
            <button type="button" className="sy-text-action" onClick={() => scrollToId('app-tour')}>
              {copy(HERO_COPY.exploreCta, hi)}
              <ArrowDown />
            </button>
          </div>

          <div className="sy-hero__facts" aria-label={hi ? 'मुख्य ऐप विशेषताएँ' : 'Key app qualities'}>
            <span>{copy(HERO_COPY.factAndroid, hi)}</span>
            <span>{copy(HERO_COPY.factLang, hi)}</span>
            <span>{copy(HERO_COPY.factTrial, hi)}</span>
          </div>
        </motion.div>

        <motion.div
          className="sy-hero__visual"
          style={{ y: visualY, rotate: visualRotate }}
        >
          <motion.div
            className="sy-hero__wheel"
            aria-hidden
            style={{ opacity: wheelOpacity }}
          >
            <ZodiacWheel prominent />
          </motion.div>

          <AppPhoneMockup
            screen={APP_SCREENS.home}
            alt={copy(APP_SCREENS.home.alt, hi)}
            className="sy-device sy-device--hero-main"
            priority
            glow
          />
          <AppPhoneMockup
            screen={APP_SCREENS.kundli}
            alt={copy(APP_SCREENS.kundli.alt, hi)}
            className="sy-device sy-device--hero-left"
            priority
          />
          <AppPhoneMockup
            screen={APP_SCREENS.choghadiya}
            alt={copy(APP_SCREENS.choghadiya.alt, hi)}
            className="sy-device sy-device--hero-right"
            priority
          />

          <div className="sy-floating-note sy-floating-note--top">
            <VedicIcon name="kundli" size={18} />
            <span>{copy(HERO_COPY.noteKundli, hi)}</span>
          </div>
          <div className="sy-floating-note sy-floating-note--bottom">
            <VedicIcon name="panchang" size={18} />
            <span>{copy(HERO_COPY.notePanchang, hi)}</span>
          </div>
        </motion.div>
      </div>

      <motion.button
        type="button"
        className="sy-scroll-cue"
        onClick={() => scrollToId('app-tour')}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ opacity: phoneOpacity }}
      >
        <span>{copy(HERO_COPY.scrollCue, hi)}</span>
        <ArrowDown />
      </motion.button>
    </section>
  )
}

function BrandPromise() {
  const { hi } = useLang()

  return (
    <section id="brand-promise" className="sy-promise" aria-label={hi ? 'हमारा दृष्टिकोण' : 'Our approach'}>
      <p>{copy(BRAND_PROMISE.tagline, hi)}</p>
      <div>
        {BRAND_PROMISE.items.map((item) => (
          <span key={item.en}>
            <i aria-hidden />
            {copy(item, hi)}
          </span>
        ))}
      </div>
    </section>
  )
}

function FeatureJourneys() {
  const { hi } = useLang()

  return (
    <section id="features" className="sy-section sy-journeys" aria-labelledby="journeys-title">
      <div className="sy-container">
        <div className="sy-section__intro sy-section__intro--center">
          <SectionLabel>{copy(JOURNEYS_SECTION.eyebrow, hi)}</SectionLabel>
          <h2 id="journeys-title">
            {copy(JOURNEYS_SECTION.headline1, hi)}
            <span>{copy(JOURNEYS_SECTION.headline2, hi)}</span>
          </h2>
          <p>{copy(JOURNEYS_SECTION.body, hi)}</p>
        </div>

        <div className="sy-journey-list">
          {FEATURE_JOURNEYS.map((journey, index) => (
            <motion.article
              key={journey.id}
              className="sy-journey"
              initial={{ opacity: 0.25, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px -15%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="sy-journey__number">{journey.index}</div>
              <div className="sy-journey__icon">
                <VedicIcon name={journey.icon} size={26} />
              </div>
              <div className="sy-journey__copy">
                <span>{copy(journey.eyebrow, hi)}</span>
                <h3>{copy(journey.title, hi)}</h3>
                <p>{copy(journey.body, hi)}</p>
              </div>
              <ul className="sy-journey__features" aria-label={copy(journey.eyebrow, hi)}>
                {journey.features.map((feature, i) => (
                  <li key={feature.en}>
                    <i aria-hidden>{String(i + 1).padStart(2, '0')}</i>
                    {copy(feature, hi)}
                  </li>
                ))}
              </ul>
              {journey.screenId && (
                <div className="sy-journey__phone">
                  <AppPhoneMockup
                    screen={getScreen(journey.screenId)}
                    alt={copy(getScreen(journey.screenId).alt, hi)}
                    className="sy-device sy-device--journey"
                    glow={index % 2 === 0}
                  />
                </div>
              )}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Trust() {
  const { hi } = useLang()

  return (
    <section id="trust" className="sy-section sy-trust" aria-labelledby="trust-title">
      <div className="sy-container">
        <div className="sy-section__intro sy-section__intro--center">
          <SectionLabel>{hi ? 'भरोसे का आधार' : 'Built on authenticity'}</SectionLabel>
          <h2 id="trust-title">
            {hi ? 'शास्त्रीय गणना, आधुनिक सटीकता' : 'Classical Vedic rules, modern precision'}
          </h2>
          <p>
            {hi
              ? 'श्री यंत्रा में हर गणना प्रामाणिक वैदिक पद्धति से होती है — कोई शॉर्टकट नहीं, कोई अनुमान नहीं।'
              : 'Every calculation in Shree Yantraa follows authentic Vedic methodology — no shortcuts, no guesswork.'}
          </p>
        </div>

        <div className="sy-trust-grid">
          {SHOWCASE_TRUST.map((item: typeof SHOWCASE_TRUST[0], i: number) => (
            <motion.article
              key={item.title.en}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 3) * 0.06, duration: 0.55 }}
              className="sy-trust-card"
            >
              <span className="sy-trust-card__icon" aria-hidden>
                {item.icon}
              </span>
              <h3>{hi ? item.title.hi : item.title.en}</h3>
              <p>{hi ? item.body.hi : item.body.en}</p>
            </motion.article>
          ))}
        </div>

        <div className="sy-trust-stats">
          {SHOWCASE_BIG_STATS.map((stat: typeof SHOWCASE_BIG_STATS[0]) => (
            <div key={stat.label.en} className="sy-trust-stat">
              <strong>{hi ? stat.value.hi : stat.value.en}</strong>
              <span>{hi ? stat.label.hi : stat.label.en}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Methodology() {
  const { hi } = useLang()

  return (
    <section id="method" className="sy-section sy-method">
      <div className="sy-container sy-method__layout">
        <div className="sy-method__visual">
          <div className="sy-method__cosmos" aria-hidden>
            <span className="sy-method__sun">{copy(METHOD_SECTION.sunLabel, hi)}</span>
            <span className="sy-method__track sy-method__track--1" />
            <span className="sy-method__track sy-method__track--2" />
            <span className="sy-method__planet sy-method__planet--1" />
            <span className="sy-method__planet sy-method__planet--2" />
            <span className="sy-method__planet sy-method__planet--3" />
            <span className="sy-method__datum sy-method__datum--1">
              <b>23°</b>
              <small>{copy(METHOD_SECTION.longitude, hi)}</small>
            </span>
            <span className="sy-method__datum sy-method__datum--2">
              <b>+05:30</b>
              <small>{copy(METHOD_SECTION.timezone, hi)}</small>
            </span>
          </div>
          <AppPhoneMockup
            screen={APP_SCREENS.kundli}
            alt={copy(APP_SCREENS.kundli.alt, hi)}
            className="sy-device sy-device--method"
          />
        </div>

        <div className="sy-method__content">
          <SectionLabel>{copy(METHOD_SECTION.eyebrow, hi)}</SectionLabel>
          <h2>
            {copy(METHOD_SECTION.headline1, hi)}
            <span>{copy(METHOD_SECTION.headline2, hi)}</span>
          </h2>
          <p className="sy-method__lead">{copy(METHOD_SECTION.lead, hi)}</p>
          <div className="sy-method__points">
            {METHOD_POINTS.map((item) => (
              <article key={item.title.en}>
                <span>
                  <VedicIcon name={item.icon} size={20} />
                </span>
                <div>
                  <h3>{copy(item.title, hi)}</h3>
                  <p>{copy(item.body, hi)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Intelligence() {
  const { hi } = useLang()

  return (
    <section id="intelligence" className="sy-section sy-intelligence">
      <div className="sy-container sy-intelligence__panel">
        <div className="sy-intelligence__copy">
          <SectionLabel>{copy(INTELLIGENCE_COPY.eyebrow, hi)}</SectionLabel>
          <h2>
            {copy(INTELLIGENCE_COPY.headline1, hi)}
            <span>{copy(INTELLIGENCE_COPY.headline2, hi)}</span>
          </h2>
          <p>{copy(INTELLIGENCE_COPY.body, hi)}</p>
          <div
            className="sy-intelligence__formula"
            aria-label={hi ? 'वैदिक गणना और आधुनिक व्याख्या' : 'Vedic calculation and modern explanation'}
          >
            <span>{copy(INTELLIGENCE_COPY.formula1, hi)}</span>
            <b>+</b>
            <span>{copy(INTELLIGENCE_COPY.formula2, hi)}</span>
            <b>+</b>
            <span>{copy(INTELLIGENCE_COPY.formula3, hi)}</span>
          </div>
          <p className="sy-intelligence__note">{copy(INTELLIGENCE_COPY.note, hi)}</p>
        </div>

        <div className="sy-intelligence__visual">
          <AppPhoneMockup
            screen={APP_SCREENS.ai}
            alt={copy(APP_SCREENS.ai.alt, hi)}
            className="sy-device sy-device--intelligence"
            glow
          />
        </div>
      </div>
    </section>
  )
}

function SacredLibrary() {
  const { hi } = useLang()

  return (
    <section id="library" className="sy-section sy-library">
      <div className="sy-container sy-library__layout">
        <div className="sy-library__copy">
          <SectionLabel>{copy(SACRED_LIBRARY_COPY.eyebrow, hi)}</SectionLabel>
          <h2>
            {copy(SACRED_LIBRARY_COPY.headline1, hi)}
            <span>{copy(SACRED_LIBRARY_COPY.headline2, hi)}</span>
          </h2>
          <p>{copy(SACRED_LIBRARY_COPY.body, hi)}</p>
          <ul>
            {SACRED_LIBRARY_BOOKS.map((book) => (
              <li key={book.en}>{copy(book, hi)}</li>
            ))}
          </ul>
        </div>

        <div className="sy-library__visual">
          <div className="sy-library__moon" aria-hidden />
          <AppPhoneMockup
            screen={APP_SCREENS.gita}
            alt={copy(APP_SCREENS.gita.alt, hi)}
            className="sy-device sy-device--library"
          />
          <div className="sy-library__verse">
            <span>॥</span>
            <p>{copy(SACRED_LIBRARY_COPY.verse, hi)}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const { hi } = useLang()

  return (
    <section id="how" className="sy-section sy-how">
      <div className="sy-container">
        <div className="sy-section__intro sy-section__intro--center">
          <SectionLabel>{copy(HOW_SECTION.eyebrow, hi)}</SectionLabel>
          <h2>
            {copy(HOW_SECTION.headline1, hi)}
            <span>{copy(HOW_SECTION.headline2, hi)}</span>
          </h2>
        </div>

        <ol className="sy-how__steps">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.n}>
              <div className="sy-how__line" aria-hidden>
                <span>{step.n}</span>
                {index < HOW_IT_WORKS.length - 1 && <i />}
              </div>
              {step.screenId && (
                <div className="sy-how__phone">
                  <AppPhoneMockup
                    screen={getScreen(step.screenId)}
                    alt={copy(getScreen(step.screenId).alt, hi)}
                    className="sy-device sy-device--how"
                  />
                </div>
              )}
              <h3>{copy(step.title, hi)}</h3>
              <p>{copy(step.body, hi)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Faq() {
  const { hi } = useLang()
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="sy-section sy-faq">
      <div className="sy-container sy-faq__layout">
        <div className="sy-faq__intro">
          <SectionLabel>{hi ? 'स्पष्ट जानकारी' : 'Clear answers'}</SectionLabel>
          <h2>{copy(FAQ_SECTION.headline, hi)}</h2>
          <p>{copy(FAQ_SECTION.body, hi)}</p>
        </div>
        <div className="sy-faq__list">
          {FAQ_ITEMS.map((item, index) => {
            const expanded = open === index
            return (
              <article key={item.q.en} className={expanded ? 'is-open' : ''}>
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? -1 : index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{copy(item.q, hi)}</strong>
                  <i aria-hidden />
                </button>
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p>{copy(item.a, hi)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DownloadFinale() {
  const { hi } = useLang()

  return (
    <section id="download" className="sy-finale">
      <div className="sy-finale__cosmos" aria-hidden>
        <ZodiacWheel prominent />
      </div>
      <div className="sy-finale__content">
        <ShreeYantraLogo size={58} pulse={false} />
        <SectionLabel>{copy(DOWNLOAD_FINALE_COPY.eyebrow, hi)}</SectionLabel>
        <h2>
          {copy(DOWNLOAD_FINALE_COPY.headline1, hi)}
          <span>{copy(DOWNLOAD_FINALE_COPY.headline2, hi)}</span>
        </h2>
        <p>{copy(DOWNLOAD_FINALE_COPY.body, hi)}</p>
        <div className="sy-finale__phone">
          <AppPhoneMockup
            screen={APP_SCREENS.home}
            alt={copy(APP_SCREENS.home.alt, hi)}
            className="sy-device sy-device--finale"
            glow
          />
        </div>
        <StoreButtons size="lg" />
        <small>{copy(DOWNLOAD_FINALE_COPY.trial, hi)}</small>
      </div>
    </section>
  )
}

export function AppShowcaseExperience() {
  useEffect(() => {
    document.documentElement.classList.add('showcase-active')
    return () => document.documentElement.classList.remove('showcase-active')
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <main className="sy-showcase">
        <Hero />
        <BrandPromise />
        <ScrollShowcase />
        <FeatureJourneys />
        <Trust />
        <Methodology />
        <Intelligence />
        <SacredLibrary />
        <HowItWorks />
        <Faq />
        <DownloadFinale />
      </main>
    </MotionConfig>
  )
}
