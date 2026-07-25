import type { CSSProperties } from 'react'
import { APP_SCREENS, type AppScreen, type AppScreenId } from '@/data/appScreens'

/**
 * Device frame that holds several real app screenshots stacked on top of each
 * other and cross-fades between them. One frame, N <img> layers — no DOM churn
 * while scrolling, the whole transition is a GPU opacity/scale change.
 */

/** Copy overrides: the site never says "AI" in user-facing text. */
const ALT_OVERRIDES: Partial<Record<AppScreenId, { hi: string; en: string }>> = {
  ai: {
    hi: 'ज्योतिषी से प्रश्न — उत्तर आपकी अपनी कुंडली से',
    en: 'Ask the Jyotishi — answers built from your own birth chart',
  },
  home_services: {
    hi: 'ऐप की सेवाएँ — कुंडली, राशिफल, ज्योतिषी से प्रश्न',
    en: 'App services — kundli, rashifal and Ask the Jyotishi',
  },
}

export function screenAlt(screen: AppScreen, hi: boolean): string {
  const override = ALT_OVERRIDES[screen.id]
  if (override) return hi ? override.hi : override.en
  return hi ? screen.alt.hi : screen.alt.en
}

function layerStyle(screen: AppScreen): CSSProperties {
  const top = screen.crop.top / 100
  const bottom = screen.crop.bottom / 100
  const visible = Math.max(0.5, 1 - top - bottom)
  const [x, y] = (screen.crop.objectPosition ?? '50% 50%').split(' ')
  return {
    '--ph-top': top,
    '--ph-visible': visible,
    '--ph-scale': screen.crop.scale ?? 1,
    '--ph-x': x ?? '50%',
    '--ph-y': y ?? '50%',
  } as CSSProperties
}

export type PhoneStackProps = {
  /** Screens in beat order. `null` means "this beat has no phone here". */
  screens: readonly (AppScreenId | null)[]
  /** Index into `screens` that should be visible. */
  active: number
  hi: boolean
  className?: string
  style?: CSSProperties
  /** Eagerly load the first screen (above-the-fold usage). */
  priority?: boolean
  /** Hides the whole device when the active beat has no screen for it. */
  fadeWhenEmpty?: boolean
}

export function PhoneStack({
  screens,
  active,
  hi,
  className,
  style,
  priority = false,
  fadeWhenEmpty = false,
}: PhoneStackProps) {
  const activeId = screens[active] ?? null
  // Render each distinct screen once; several beats may share one screen.
  const unique: AppScreenId[] = []
  for (const id of screens) {
    if (id && !unique.includes(id)) unique.push(id)
  }

  const shown = !fadeWhenEmpty || activeId !== null

  return (
    <div
      className={[
        'syj-phone',
        fadeWhenEmpty ? 'syj-phone--fade' : '',
        shown ? 'is-shown' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <span className="syj-phone__glow" aria-hidden />
      <div className="syj-phone__body">
        <div className="syj-phone__screen">
          {unique.map((id, i) => {
            const screen = APP_SCREENS[id]
            const isActive = id === activeId
            return (
              <div
                key={id}
                className={`syj-phone__layer${isActive ? ' is-active' : ''}`}
                style={layerStyle(screen)}
                aria-hidden={!isActive}
              >
                <img
                  src={screen.src}
                  alt={isActive ? screenAlt(screen, hi) : ''}
                  width={1080}
                  height={2400}
                  loading={priority && i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={priority && i === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
              </div>
            )
          })}
        </div>
        <span className="syj-phone__island" aria-hidden />
        <span className="syj-phone__rail" aria-hidden />
        <span className="syj-phone__rail syj-phone__rail--b" aria-hidden />
        <span className="syj-phone__rail syj-phone__rail--c" aria-hidden />
      </div>
    </div>
  )
}
