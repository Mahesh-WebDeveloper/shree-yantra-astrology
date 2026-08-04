import { SHOWCASE_MOSAIC } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseMarquee() {
  const { hi } = useLang()
  const items = SHOWCASE_MOSAIC.slice(0, 14)
  const doubled = [...items, ...items]

  return (
    <div className="showcase-marquee" aria-hidden>
      <div className="showcase-marquee__track">
        {doubled.map((item, i) => (
          <span key={`${item.en}-${i}`} className="showcase-marquee__item">
            <span />
            {hi ? item.hi : item.en}
          </span>
        ))}
      </div>
    </div>
  )
}
