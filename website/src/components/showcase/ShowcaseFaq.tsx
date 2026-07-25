import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SHOWCASE_FAQ } from '@/data/showcase'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseFaq() {
  const { hi } = useLang()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="showcase-section relative scroll-mt-24">
      <div className="mx-auto max-w-[820px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-2xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'सामान्य प्रश्न' : 'Common questions'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.5rem]">
            {hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently asked questions'}
          </h2>
        </header>

        <ul className="showcase-faq mt-10">
          {SHOWCASE_FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <li key={item.q.en} className="showcase-faq__item">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="showcase-faq__q"
                >
                  <span>{hi ? item.q.hi : item.q.en}</span>
                  <i aria-hidden className={isOpen ? 'showcase-faq__chev showcase-faq__chev--open' : 'showcase-faq__chev'} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="showcase-faq__a">{hi ? item.a.hi : item.a.en}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
