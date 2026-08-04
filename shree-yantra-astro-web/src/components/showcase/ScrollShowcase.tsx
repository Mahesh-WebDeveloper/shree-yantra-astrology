import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AppPhoneMockup } from '@/components/showcase/AppPhoneMockup'
import { useLang } from '@/i18n/LangProvider'
import { APP_SCREENS, SCROLL_SHOWCASE_SCREENS, type AppScreenId } from '@/data/appScreens'
import { SCROLL_SHOWCASE_COPY } from '@/data/brandShowcase'

gsap.registerPlugin(ScrollTrigger)

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="sy-section-label">
      <span aria-hidden />
      {children}
    </p>
  )
}

export function ScrollShowcase() {
  const { hi } = useLang()
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<(HTMLLIElement | null)[]>([])
  const [active, setActive] = useState(0)
  const [pinEnabled, setPinEnabled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const syncPin = () => setPinEnabled(mq.matches)
    syncPin()
    mq.addEventListener('change', syncPin)
    return () => mq.removeEventListener('change', syncPin)
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const pin = pinRef.current
    if (!stage) return

    const triggers: ScrollTrigger[] = []

    const setStep = (index: number) => {
      setActive(Math.max(0, Math.min(SCROLL_SHOWCASE_SCREENS.length - 1, index)))
    }

    stepsRef.current.forEach((el, i) => {
      if (!el) return
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 58%',
          end: 'bottom 42%',
          onEnter: () => setStep(i),
          onEnterBack: () => setStep(i),
        }),
      )
    })

    if (!reduce && pinEnabled && pin) {
      triggers.push(
        ScrollTrigger.create({
          trigger: stage,
          start: 'top 88px',
          end: 'bottom bottom',
          pin,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        }),
      )
    }

    const refresh = () => ScrollTrigger.refresh()
    const imgs = stage.querySelectorAll('img')
    imgs.forEach((img) => {
      if (img.complete) return
      img.addEventListener('load', refresh, { once: true })
    })
    window.addEventListener('load', refresh)
    refresh()

    return () => {
      window.removeEventListener('load', refresh)
      triggers.forEach((t) => t.kill())
    }
  }, [reduce, pinEnabled])

  const screen = APP_SCREENS[SCROLL_SHOWCASE_SCREENS[active] as AppScreenId]

  return (
    <section ref={sectionRef} id="app-tour" className="sy-section sy-scroll-showcase" aria-labelledby="scroll-showcase-title">
      <div className="sy-container sy-scroll-showcase__intro">
        <SectionLabel>{hi ? 'वास्तविक ऐप अनुभव' : 'The real app experience'}</SectionLabel>
        <h2 id="scroll-showcase-title" className="sy-scroll-showcase__title">
          {hi ? 'स्क्रॉल करें, ' : 'Scroll through '}
          <span>{hi ? 'ऐप का अनुभव' : 'the experience'}</span>
        </h2>
        <p>{hi ? 'हर स्क्रीन आपके फोन से — कोई नकली UI नहीं।' : 'Every screen from your phone — no fake UI.'}</p>
      </div>

      <div ref={stageRef} className="sy-scroll-showcase__stage sy-container">
        <div className="sy-scroll-showcase__phone-col">
          <div ref={pinRef} className="sy-scroll-showcase__pin">
            <div className="sy-scroll-showcase__halo" aria-hidden />
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.id}
                className="sy-scroll-showcase__phone-wrap"
                initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <AppPhoneMockup
                  screen={screen}
                  alt={hi ? screen.alt.hi : screen.alt.en}
                  className="sy-scroll-showcase__phone sy-device--scroll"
                  glow
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="sy-scroll-showcase__copy">
          <ol className="sy-scroll-showcase__steps" aria-label={hi ? 'ऐप स्क्रीन' : 'App screens'}>
            {SCROLL_SHOWCASE_SCREENS.map((id, i) => {
              const item = SCROLL_SHOWCASE_COPY[id]
              const on = i === active
              return (
                <li
                  key={id}
                  ref={(el) => {
                    stepsRef.current[i] = el
                  }}
                  className={on ? 'is-active' : ''}
                  data-step={i}
                >
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{hi ? item.title.hi : item.title.en}</strong>
                    <p>{hi ? item.body.hi : item.body.en}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}