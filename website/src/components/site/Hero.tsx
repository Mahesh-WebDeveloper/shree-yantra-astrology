import { Suspense, lazy, useEffect, useState } from 'react'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { useLang } from '@/i18n/LangProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SitePhone } from './SitePhone'
import { scrollToHash, useReducedMotion } from './hooks/useSiteMotion'

const YantraScene = lazy(() => import('./cosmic/YantraScene'))

const TRUST = [
  { hi: '767/767 दृक-सत्यापित', en: '767/767 Drik-verified' },
  { hi: '18 पुराण · 4 वेद', en: '18 Puranas · 4 Vedas' },
  { hi: '100% वास्तविक डेटा', en: '100% real data' },
]

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/** Mounts the 3D canvas only after first paint, and only when motion is welcome. */
function useCanvasReady(enabled: boolean) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const w = window as IdleWindow
    let idleId: number | undefined
    let timerId: number | undefined
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setReady(true), { timeout: 900 })
    else timerId = window.setTimeout(() => setReady(true), 260)
    return () => {
      if (idleId != null) w.cancelIdleCallback?.(idleId)
      if (timerId != null) window.clearTimeout(timerId)
    }
  }, [enabled])

  return ready && enabled
}

export function Hero() {
  const { hi } = useLang()
  const { theme } = useTheme()
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(true)

  // Stop the render loop when the tab is hidden.
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const canvasOn = useCanvasReady(!reduced)
  const t = (h: string, e: string) => (hi ? h : e)

  return (
    <section className="sy-hero sy-nightfall sy-grain sy-site" id="top" aria-labelledby="sy-hero-title">
      <div className="sy-hero__halo" aria-hidden />

      <div className="sy-hero__canvas" aria-hidden>
        {canvasOn ? (
          <Suspense fallback={null}>
            <YantraScene dark={theme.isDark} paused={!visible} />
          </Suspense>
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-30">
            <ShreeYantraLogo size={340} pulse={false} />
          </div>
        )}
      </div>

      <div className="sy-hero__scrim" aria-hidden />
      <div className="sy-hero__fade" aria-hidden />

      <div className="sy-container sy-hero__grid">
        <div>
          <p className="sy-eyebrow" lang={hi ? 'hi' : 'en'}>
            {t('प्रामाणिक वैदिक ज्योतिष', 'Authentic Vedic Astrology')}
          </p>

          <h1 id="sy-hero-title" className="sy-display mt-6">
            {hi ? (
              <>
                आपका <span className="sy-gold-text">व्यक्तिगत ज्योतिषी</span>
                <br />— अब आपकी जेब में
              </>
            ) : (
              <>
                Your personal <span className="sy-gold-text">Jyotishi</span>
                <br />— now in your pocket
              </>
            )}
          </h1>

          <p className="sy-lead mt-6">
            {t(
              'कुंडली, पंचांग, चौघड़िया, राशिफल — सब कुछ सटीक खगोलीय गणना पर आधारित। कोई अनुमान नहीं, कोई नकली डेटा नहीं।',
              'Kundli, Panchang, Choghadiya, Rashifal — every reading computed from precise astronomical data. No guesswork, no fake data.',
            )}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              className="sy-btn-gold"
              href="#download"
              onClick={(e) => {
                e.preventDefault()
                scrollToHash('#download')
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
              </svg>
              {t('APK डाउनलोड करें', 'Download APK')}
            </a>
            <a
              className="sy-btn-ghost"
              href="#accuracy"
              onClick={(e) => {
                e.preventDefault()
                scrollToHash('#accuracy')
              }}
            >
              {t('देखें कैसे काम करता है', 'See how it works')}
            </a>
          </div>

          <ul className="mt-9 flex flex-wrap gap-2.5" aria-label={t('भरोसे के आधार', 'Trust markers')}>
            {TRUST.map((chip) => (
              <li key={chip.en}>
                <span className="sy-chip sy-num">
                  <span className="sy-chip__dot" aria-hidden />
                  {t(chip.hi, chip.en)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className={reduced ? undefined : 'sy-float'}>
            <SitePhone id="home" priority width={288} />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="sy-hero__cue"
        onClick={() => scrollToHash('#live-proof')}
        aria-label={t('आगे स्क्रॉल करें', 'Scroll down')}
      >
        <span className="sy-hero__cue-rail" aria-hidden />
        <span>{t('नीचे देखें', 'Scroll')}</span>
      </button>
    </section>
  )
}
