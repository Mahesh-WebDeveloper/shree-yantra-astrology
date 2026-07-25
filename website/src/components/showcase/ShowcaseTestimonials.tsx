import { motion } from 'framer-motion'
import { SHOWCASE_TESTIMONIALS } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseTestimonials() {
  const { hi } = useLang()

  return (
    <section className="showcase-section relative">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-2xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'उपयोगकर्ताओं की बात' : 'What users say'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2.05rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.6rem]">
            {hi ? 'भारत भर के परिवारों का भरोसा' : 'Trusted by families across India'}
          </h2>
        </header>

        <div className="showcase-testimonials mt-10">
          {SHOWCASE_TESTIMONIALS.map((item, i) => (
            <motion.figure
              key={item.name}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (i % 2) * 0.07, duration: 0.55 }}
              className="showcase-testimonial"
            >
              <blockquote>“{hi ? item.text.hi : item.text.en}”</blockquote>
              <figcaption>
                <strong>{item.name}</strong>
                <span>{hi ? item.place.hi : item.place.en}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
