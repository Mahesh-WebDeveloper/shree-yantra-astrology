import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'
import type { AppScreen, ScreenCrop } from '@/data/appScreens'

/** Native screenshot aspect (1080 × 2400). */
const SCREEN_ASPECT = 2400 / 1080

export type AppPhoneMockupProps = {
  screen: AppScreen
  alt?: string
  className?: string
  /** Override per-instance crop tuning. */
  crop?: Partial<ScreenCrop>
  priority?: boolean
  glow?: boolean
}

function mergedCrop(base: ScreenCrop, override?: Partial<ScreenCrop>): ScreenCrop {
  return { ...base, ...override }
}

export function AppPhoneMockup({
  screen,
  alt,
  className,
  crop: cropOverride,
  priority = false,
  glow = false,
}: AppPhoneMockupProps) {
  const crop = mergedCrop(screen.crop, cropOverride)
  const top = crop.top / 100
  const bottom = crop.bottom / 100
  const visible = Math.max(0.5, 1 - top - bottom)
  const scale = crop.scale ?? 1

  const mediaStyle = {
    '--phone-crop-top': top,
    '--phone-crop-bottom': bottom,
    '--phone-visible': visible,
    '--phone-scale': scale,
    '--phone-pos-x': crop.objectPosition?.split(' ')[0] ?? '50%',
    '--phone-pos-y': crop.objectPosition?.split(' ')[1] ?? '50%',
    '--phone-aspect': SCREEN_ASPECT,
  } as CSSProperties

  return (
    <div className={cn('sy-device', glow && 'sy-device--glow', className)}>
      <div className="sy-device__bezel">
        <div className="sy-device__island" aria-hidden />
        <div className="sy-device__screen">
          <div className="sy-device__media" style={mediaStyle}>
            <img
              src={screen.src}
              alt={alt ?? screen.alt.en}
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
