import type { CSSProperties } from 'react'
import { getScreen, type AppScreenId } from '@/data/appScreens'
import { useLang } from '@/i18n/LangProvider'

/** Native screenshot aspect (1080 × 2400). */
const SCREEN_ASPECT = 2400 / 1080

type Props = {
  id: AppScreenId
  className?: string
  /** Eager-load the hero device; everything else stays lazy. */
  priority?: boolean
  width?: number
}

/**
 * A real app screenshot inside a gold-rimmed device.
 * Crop metadata from `appScreens.ts` hides the Android status bar
 * and system nav without squashing the image.
 */
export function SitePhone({ id, className = '', priority = false, width = 268 }: Props) {
  const { hi } = useLang()
  const screen = getScreen(id)
  const crop = screen.crop
  const top = crop.top / 100
  const bottom = crop.bottom / 100
  const visible = Math.max(0.5, 1 - top - bottom)
  const [posX, posY] = (crop.objectPosition ?? '50% 50%').split(' ')

  const style = {
    '--sy-phone-w': `${width}px`,
    '--sy-phone-top': String(top),
    '--sy-phone-visible': String(visible),
    '--sy-phone-scale': String(crop.scale ?? 1),
    '--sy-phone-x': posX ?? '50%',
    '--sy-phone-y': posY ?? '50%',
    '--sy-phone-aspect': String(SCREEN_ASPECT),
  } as CSSProperties

  return (
    <div className={`sy-phone ${className}`} style={style}>
      <div className="sy-phone__frame">
        <span className="sy-phone__notch" aria-hidden />
        <div className="sy-phone__screen">
          <div className="sy-phone__media">
            <img
              src={screen.src}
              alt={hi ? screen.alt.hi : screen.alt.en}
              width={1080}
              height={2400}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
