import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { SHOWCASE_SPOTLIGHTS } from '@/data/showcase'
import { PhoneFrame } from '@/components/showcase/PhoneFrame'
import { useLang } from '@/i18n/LangProvider'
import kundliArt from '@/assets/kundli-card.png'
import milanArt from '@/assets/Kundali-Milan-Matching.png'
import panchangArt from '@/assets/panchang-choghdiya-icon.png'
import rashifalArt from '@/assets/rashifal-icon.jpg'
import heroArt from '@/assets/hero.png'

const ART: Record<string, string> = {
  kundli: kundliArt,
  panchang: panchangArt,
  rashifal: rashifalArt,
  library: milanArt,
  vastu: heroArt,
}

export function ShowcaseSpotlights() {
  const { hi } = useLang()

  return (
    <section id="features" className="showcase-section showcase-section--first relative scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-3xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'ऐप के अंदर' : 'Inside the mobile app'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2.15rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.8rem]">
            {hi ? 'हर जरूरत के लिए साफ, सुंदर और भरोसेमंद अनुभव' : 'A polished experience for every Vedic need'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--sy-text-soft)] sm:text-base">
            {hi
              ? 'वेबसाइट पर सिर्फ झलक है। हर प्रीमियम सेवा मोबाइल ऐप में सदस्यता के बाद खुलती है, ताकि उपयोगकर्ता का सफर सरल और सुरक्षित रहे।'
              : 'The website stays as a showcase. Premium readings open in the mobile app after membership, keeping the user flow focused and secure.'}
          </p>
        </header>

        <div className="mt-14 space-y-10 sm:mt-16">
          {SHOWCASE_SPOTLIGHTS.map((item, i) => {
            const reverse = i % 2 === 1
            return (
              <motion.article
                key={item.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className={`showcase-spotlight ${reverse ? 'showcase-spotlight--reverse' : ''}`}
                style={{ '--spotlight-accent': item.accent } as CSSProperties}
              >
                <div className="showcase-spotlight__copy">
                  <p className="showcase-spotlight__eyebrow">{hi ? item.eyebrow.hi : item.eyebrow.en}</p>
                  <h3>{hi ? item.title.hi : item.title.en}</h3>
                  <p>{hi ? item.blurb.hi : item.blurb.en}</p>
                  <ul className="showcase-feature-list">
                    {item.bullets.map((bullet) => (
                      <li key={bullet.en}>
                        <span aria-hidden />
                        {hi ? bullet.hi : bullet.en}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="showcase-spotlight__visual">
                  <PhoneFrame className="w-[220px] sm:w-[252px]" glow={false}>
                    <div className="showcase-feature-shot">
                      <img src={ART[item.id] ?? heroArt} alt="" />
                      <div className="showcase-feature-shot__shade" />
                      <div className="showcase-feature-shot__caption">
                        <span>{hi ? item.eyebrow.hi : item.eyebrow.en}</span>
                        <strong>{hi ? item.title.hi : item.title.en}</strong>
                      </div>
                    </div>
                  </PhoneFrame>
                  <div className="showcase-spotlight__aura" aria-hidden />
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}



