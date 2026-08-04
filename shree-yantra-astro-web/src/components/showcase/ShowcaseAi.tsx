import { motion } from 'framer-motion'
import { PhoneFrame } from '@/components/showcase/PhoneFrame'
import { useLang } from '@/i18n/LangProvider'
import heroArt from '@/assets/hero.png'

const CHAT = {
  user: {
    en: 'When is a good time to start my new business?',
    hi: 'नया व्यवसाय शुरू करने का शुभ समय कब है?',
  },
  ai: {
    en: 'Your current dasha supports steady growth. Thursday morning and the upcoming Shukla Paksha window look especially favourable for new beginnings.',
    hi: 'आपकी वर्तमान दशा स्थिर वृद्धि का संकेत देती है। गुरुवार सुबह और आने वाला शुक्ल पक्ष नए कार्य के लिए विशेष रूप से अनुकूल लगता है।',
  },
}

export function ShowcaseAi() {
  const { hi } = useLang()

  return (
    <section className="showcase-section relative">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div className="showcase-ai">
          <div className="showcase-ai__grid">
            <div>
              <p className="showcase-kicker w-fit">
                <span className="showcase-kicker__mark" aria-hidden />
                <span>{hi ? 'AI ज्योतिषी' : 'AI Vedic astrologer'}</span>
              </p>
              <h2 className="mt-4 max-w-xl font-playfair text-[2rem] font-bold tracking-tight text-[var(--sy-text)] sm:text-[2.55rem]">
                {hi ? 'अपनी कुंडली पर आधारित, कभी भी पूछें' : 'Ask anytime, grounded in your chart'}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--sy-text-soft)] sm:text-base">
                {hi
                  ? 'ऐप में ज्योतिषी जी से करियर, संबंध, उपाय और समय-संबंधी प्रश्न पूछें — आपकी जन्म कुंडली, दशा और आज के पंचांग के आधार पर।'
                  : 'Inside the app, ask Jyotishi Ji about career, relationships, remedies and timing — based on your birth chart, dasha and today’s panchang.'}
              </p>
              <ul className="showcase-feature-list mt-6">
                {(hi
                  ? ['कुंडली आधारित उत्तर', 'दशा और गोचर संदर्भ', 'सरल हिंदी/अंग्रेजी भाषा']
                  : ['Chart-based answers', 'Dasha & transit context', 'Plain Hindi / English']
                ).map((item) => (
                  <li key={item}>
                    <span aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <PhoneFrame className="mx-auto w-[240px]" glow={false}>
                <div className="showcase-feature-shot">
                  <img src={heroArt} alt="" />
                  <div className="showcase-feature-shot__shade" />
                  <div className="showcase-ai__chat showcase-ai__chat--in-phone">
                      <div className="showcase-ai__bubble showcase-ai__bubble--user">
                        {hi ? CHAT.user.hi : CHAT.user.en}
                      </div>
                      <div className="showcase-ai__bubble">{hi ? CHAT.ai.hi : CHAT.ai.en}</div>
                    </div>
                </div>
              </PhoneFrame>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
