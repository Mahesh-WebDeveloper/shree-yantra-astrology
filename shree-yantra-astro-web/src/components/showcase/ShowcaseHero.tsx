import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { AccentText } from '@/components/ui/AccentText'
import { AppPhoneMockup } from '@/components/showcase/AppPhoneMockup'
import { StoreButtons } from '@/components/showcase/StoreButtons'
import { SHOWCASE_METRICS, SHOWCASE_PROMISES } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'
import { getScreen } from '@/data/appScreens'

const QUICK_FEATURES = [
  { en: 'Kundli', hi: 'कुंडली' },
  { en: 'Rashifal', hi: 'राशिफल' },
  { en: 'Panchang', hi: 'पंचांग' },
  { en: 'Muhurat', hi: 'मुहूर्त' },
]

export function ShowcaseHero() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 48])
  const haloRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 18])
  const phoneOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 1, 0])

  const scrollToTour = () => {
    document.getElementById('app-tour')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  const mainScreen = getScreen('home')
  const leftScreen = getScreen('kundli')
  const rightScreen = getScreen('choghadiya')

  return (
    <section
      ref={ref}
      id="hero"
      className="showcase-hero relative isolate overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="showcase-hero__sky" aria-hidden />
      <div className="showcase-hero__grain" aria-hidden />
      <motion.div
        style={{ rotate: haloRotate }}
        className="showcase-hero__mandala"
        aria-hidden
      />
      <div className="showcase-hero__orb showcase-hero__orb--a" aria-hidden />
      <div className="showcase-hero__orb showcase-hero__orb--b" aria-hidden />

      <div className="showcase-hero__content relative z-20 mx-auto grid min-h-[100svh] w-full max-w-[1360px] items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24 lg:pt-32">
        <div className="max-w-2xl text-center lg:text-left">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="showcase-kicker mx-auto mb-5 w-fit lg:mx-0"
          >
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'वैदिक ज्योतिष मोबाइल ऐप' : 'Vedic astrology mobile app'}</span>
          </motion.div>

          <motion.h1
            id="hero-title"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="font-playfair text-[2.25rem] font-bold leading-[1.08] tracking-tight text-[var(--sy-text)] sm:text-[3.25rem] lg:text-[3.75rem] max-w-[16ch]"
          >
            {hi ? (
              <>
                प्राचीन ज्ञान।
                <br />
                आधुनिक ज्योतिष।
                <br />
                <AccentText>एक सुंदर ऐप।</AccentText>
              </>
            ) : (
              <>
                Ancient wisdom.
                <br />
                Modern astrology.
                <br />
                <AccentText>One beautiful app.</AccentText>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.65 }}
            className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--sy-text-soft)] sm:text-[17px] lg:mx-0"
          >
            {hi
              ? 'कुंडली, राशिफल, पंचांग, मुहूर्त, AI ज्योतिषी, वास्तु, उपाय और दिव्य पुस्तकालय — सब आपके फोन में।'
              : 'Kundli, Rashifal, Panchang, Muhurat, AI Astrologer, Vastu, Remedies and the Divine Library — all on mobile.'}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26, duration: 0.65 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <StoreButtons size="lg" />
            <button
              type="button"
              onClick={scrollToTour}
              className="showcase-link-btn"
            >
              {hi ? 'ऐप का अनुभव देखें' : 'Explore the app experience'}
            </button>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34, duration: 0.6 }}
            className="mt-4 text-center text-[13px] font-semibold text-[var(--sy-gold-strong)] lg:text-left"
          >
            {hi ? '₹1 में 7 दिन का प्रीमियम ट्रायल' : '7-day premium trial at just ₹1'}
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.65 }}
            className="mt-9 grid gap-3 sm:grid-cols-3"
          >
            {SHOWCASE_METRICS.map((metric) => (
              <div key={metric.value.en} className="showcase-metric">
                <strong>{hi ? metric.value.hi : metric.value.en}</strong>
                <span>{hi ? metric.label.hi : metric.label.en}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          style={{ y: phoneY, opacity: phoneOpacity, rotate: haloRotate }}
          className="relative z-10 mx-auto w-full max-w-[520px]"
        >
          <div className="showcase-device-scene">
            <div className="showcase-device-scene__ring" aria-hidden />

            <AppPhoneMockup
              screen={mainScreen}
              alt={hi ? mainScreen.alt.hi : mainScreen.alt.en}
              className="app-phone-mockup--hero-main"
              priority
              glow
            />

            <AppPhoneMockup
              screen={leftScreen}
              alt={hi ? leftScreen.alt.hi : leftScreen.alt.en}
              className="app-phone-mockup--hero-left"
              priority
            />

            <AppPhoneMockup
              screen={rightScreen}
              alt={hi ? rightScreen.alt.hi : rightScreen.alt.en}
              className="app-phone-mockup--hero-right"
              priority
            />

            <div className="showcase-floating-note showcase-floating-note--top">
              <ShreeYantraLogo size={18} pulse={false} />
              <span>{hi ? 'जन्म कुंडली' : 'Birth Kundli'}</span>
            </div>
            <div className="showcase-floating-note showcase-floating-note--bottom">
              <ShreeYantraLogo size={18} pulse={false} />
              <span>{hi ? 'दैनिक पंचांग' : 'Daily Panchang'}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {QUICK_FEATURES.map((feature) => (
              <div key={feature.en} className="showcase-mini-pill">
                {hi ? feature.hi : feature.en}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="showcase-hero__content relative z-20 mx-auto -mt-10 max-w-[1100px] px-5 pb-12 sm:px-8 lg:-mt-20">
        <div className="showcase-promise-strip">
          {SHOWCASE_PROMISES.map((promise) => (
            <div key={promise.en}>
              <span aria-hidden />
              <p>{hi ? promise.hi : promise.en}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="showcase-scroll-cue"
        onClick={scrollToTour}
        aria-label={hi ? 'ऐप अनुभव के लिए स्क्रॉल करें' : 'Scroll to explore the app'}
      >
        <span>{hi ? 'ऐप अनुभव' : 'Explore the app'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 4v15m0 0 6-6m-6 6-6-6" />
        </svg>
      </button>
    </section>
  )
}