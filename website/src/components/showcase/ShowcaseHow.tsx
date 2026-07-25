import { motion } from 'framer-motion'
import { SHOWCASE_STEPS } from '@/data/showcase'
import { StoreButtons } from '@/components/showcase/StoreButtons'
import { useLang } from '@/i18n/LangProvider'

export function ShowcaseHow() {
  const { hi } = useLang()

  return (
    <section id="how" className="showcase-section relative scroll-mt-24">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <header className="showcase-section-head mx-auto max-w-2xl text-center">
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'कैसे शुरू करें' : 'How it starts'}</span>
          </p>
          <h2 className="mt-4 font-playfair text-[2.1rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.65rem]">
            {hi ? 'वेबसाइट पर झलक देखें, ऐप में पूरा अनुभव शुरू करें' : 'Preview the app here, experience it on mobile'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--sy-text-soft)] sm:text-base">
            {hi
              ? 'हमने वेबसाइट को सरल झलक की तरह रखा है। असली रीडिंग, रिपोर्ट और व्यक्तिगत डैशबोर्ड ऐप में रहेंगे।'
              : 'The site stays simple and premium. Actual readings, reports and the personal dashboard stay inside the app.'}
          </p>
        </header>

        <ol className="showcase-steps mt-12">
          {SHOWCASE_STEPS.map((step, i) => (
            <motion.li
              key={step.n}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.55 }}
            >
              <span>{step.n}</span>
              <h3>{hi ? step.title.hi : step.title.en}</h3>
              <p>{hi ? step.body.hi : step.body.en}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function ShowcaseDownload() {
  const { hi } = useLang()

  return (
    <section id="download" className="showcase-section relative scroll-mt-24 pb-8">
      <div className="mx-auto max-w-[980px] px-5 sm:px-8">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="showcase-cta relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <div className="showcase-cta__glow" aria-hidden />
          <p className="showcase-kicker mx-auto w-fit">
            <span className="showcase-kicker__mark" aria-hidden />
            <span>{hi ? 'पूर्ण अनुभव' : 'Full experience'}</span>
          </p>
          <h2 className="relative mt-4 font-playfair text-[2.05rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.6rem]">
            {hi ? 'श्री यंत्रा ऐप में अपना वैदिक साथी खोलें' : 'Open your Vedic companion in the Shree Yantra app'}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--sy-text-soft)] sm:text-base">
            {hi
              ? 'कुंडली, राशिफल, पंचांग, वास्तु, उपाय और दिव्य ग्रंथ - सब कुछ मोबाइल-केंद्रित प्रीमियम ऐप अनुभव में।'
              : 'Kundli, rashifal, panchang, vastu, remedies and sacred texts - all in a mobile-first premium app experience.'}
          </p>
          <div className="relative mt-8 flex justify-center">
            <StoreButtons size="lg" />
          </div>
          <p className="relative mt-4 text-[13px] font-semibold text-[var(--sy-gold-strong)]">
            {hi ? '₹1 में 7 दिन का ट्रायल — कभी भी रद्द करें' : '7-day trial at ₹1 — cancel anytime'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}



