import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ZodiacWheel } from '@/components/cosmic/ZodiacWheel'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { GoldButton } from '@/components/ui/GoldButton'
import { TrustStrip } from '@/components/home/TrustStrip'
import { todayLabel } from '@/lib/location'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'

export function CinematicHero() {
  const { hi } = useLang()
  const { theme } = useTheme()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 64])
  const wheelScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08])
  const wheelRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 26])

  const scrollToToday = () => {
    document.getElementById('today')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={ref}
      className="home-hero relative -mt-[4.75rem] flex min-h-[670px] items-center justify-center overflow-hidden bg-[var(--sy-bg)] sm:min-h-[720px]"
    >
      <div className="hero-layout relative z-10 mx-auto w-full max-w-[1280px] flex-col-reverse gap-10 px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pt-40">
        <motion.div
          style={{ y: contentY, willChange: 'transform' }}
          className="hero-copy-shell flex w-full min-w-0 flex-col items-center text-center lg:items-start lg:text-left"
        >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="hero-eyebrow flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--sy-accent)]" aria-hidden />
          <span className="text-[13px] font-bold uppercase tracking-widest text-[var(--sy-accent)]">
            {todayLabel(hi)}
          </span>
          <span className="text-[13px] font-bold uppercase tracking-wide text-[var(--sy-text-muted)]">• {hi ? 'सटीक वैदिक गणना' : 'Precise Vedic calculation'}</span>
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="hero-title mt-6 w-full max-w-[22rem] text-balance font-playfair text-[2.2rem] font-bold leading-[1.15] tracking-tight text-[var(--sy-text)] sm:max-w-xl sm:text-[3rem] lg:max-w-none lg:text-[3.35rem]"
        >
          {hi ? (
            <>
              <span className="hero-accent">कुंडली, राशिफल</span> और पंचांग अब आसान भाषा में
            </>
          ) : (
            <>
              <span className="hero-accent">Kundli, Rashifal</span> and Panchang in simple guidance
            </>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.65 }}
          className="mt-6 w-full max-w-[22rem] text-balance text-[16px] font-bold leading-[1.65] text-[var(--sy-text-soft)] sm:max-w-xl sm:text-[17px] lg:max-w-none"
        >
          {hi
            ? 'वास्तविक ग्रह स्थिति, दशा, गोचर और शास्त्रीय वैदिक नियमों के आधार पर स्पष्ट मार्गदर्शन पाएं।'
            : 'Get clear guidance based on real planetary positions, graha dasha, gochar and classical Vedic rules.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.65 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
        >
          <Link to="/kundli" aria-label={hi ? 'निःशुल्क कुंडली बनाएं' : 'Create your free kundli'}>
            <GoldButton type="button" size="lg" className="hero-primary-cta shadow-lg transition-transform hover:scale-[1.02]">
              {hi ? 'निःशुल्क कुंडली बनाएं' : 'Create Free Kundli'}
            </GoldButton>
          </Link>
          <button type="button" className="sy-btn-secondary flex items-center justify-center rounded-xl px-6 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.02]" onClick={scrollToToday}>
            {hi ? 'आज का पंचांग देखें' : "View Today's Panchang"}
          </button>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.65 }}
          className="hero-trust-wrap mt-12 w-full"
        >
          <TrustStrip />
        </motion.div>
        </motion.div>

        <motion.div
          style={{ scale: wheelScale, willChange: 'transform' }}
          className="hero-wheel-stage relative flex w-full min-w-0 max-w-[300px] items-center justify-center sm:max-w-[360px] lg:max-w-[380px] lg:justify-self-end"
          aria-hidden
        >
          <motion.div style={{ rotate: wheelRotate, willChange: 'transform' }} className="relative flex w-full items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 180, ease: "linear" }}
              className="relative w-full aspect-square"
            >
              <div className="hero-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-70" />
              <div className="hero-mandala relative aspect-square w-full">
            <div className="hero-wheel-ring">
              <ZodiacWheel
                tone={theme.isDark ? 'gold' : 'ink'}
                prominent={theme.isDark}
                className={
                  theme.isDark
                    ? 'hero-zodiac-wheel h-full w-full text-[#f6d27a]'
                    : 'h-full w-full text-[#8a5a10] opacity-[0.45]'
                }
              />
            </div>
            <div className="hero-wheel-center">
              <ShreeYantraLogo pulse={false} className="h-full w-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.18)]" />
            </div>
          </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
