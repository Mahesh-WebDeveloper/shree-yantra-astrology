import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useLang } from '@/i18n/LangProvider'

const UPDATED = '2026-08-10'

const FAQ_EN = [
  {
    q: 'What is Shree Yantra?',
    a: 'Shree Yantra (also written Sri Yantra) is a sacred geometric diagram associated with Shakti and the cosmos in Hindu and Tantric traditions. It is used as a focus for meditation, worship and spiritual practice — not as a substitute for ethical living or professional advice.',
  },
  {
    q: 'Is Shree Yantra the same as Sri Chakra?',
    a: 'In many devotional contexts, Shree Yantra and Sri Chakra refer to closely related forms of the same sacred geometry — interlocking triangles around a central bindu. Regional and lineage traditions may describe details differently.',
  },
  {
    q: 'Which direction should Shree Yantra face?',
    a: 'Traditional practitioners often place the yantra so its top (bindu / upward triangle apex) faces east or north-east, but specific guidance varies by guru, sampradaya and whether the yantra is flat, framed or three-dimensional. Consult a trusted teacher for your situation.',
  },
  {
    q: 'Can I worship Shree Yantra at home?',
    a: 'Many householders maintain a clean altar and offer daily lamp, incense and mantra with sincere devotion. Regular cleanliness, respectful placement and consistent practice matter more than elaborate ritual alone.',
  },
]

export function ShreeYantraGuidePage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page min-h-screen">
        <article className="mx-auto max-w-[760px] px-5 pb-16 pt-28 sm:px-8">
          <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
            ← {hi ? 'होम' : 'Home'}
          </Link>
          <header className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sy-accent)]">
              {hi ? 'श्री यंत्र · पूर्ण गाइड' : 'Shree Yantra · complete guide'}
            </p>
            <h1 className="mt-2 font-playfair text-3xl font-bold leading-tight text-[var(--sy-text)] sm:text-4xl">
              {hi
                ? 'श्री यंत्र: अर्थ, लाभ, पूजा, स्थापना और ध्यान'
                : 'Shree Yantra: meaning, benefits, puja, placement and meditation'}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'यह शैक्षणिक लेख श्री यंत्र (श्री यंत्र / श्री चक्र) की परंपरागत पृष्ठभूमि, प्रतीकवाद और सामान्य अभ्यास को सरल भाषा में समझाता है। यह आध्यात्मिक परंपरा है — वैज्ञानिक गारंटी नहीं।'
                : 'This educational article explains the traditional background, symbolism and common practices of Shree Yantra (Sri Yantra / Sri Chakra) in plain language. It describes spiritual tradition — not scientifically guaranteed outcomes.'}
            </p>
            <p className="mt-2 text-xs text-[var(--sy-text-muted)]">
              {hi ? `अंतिम अपडेट: ${UPDATED}` : `Last updated: ${UPDATED}`}
            </p>
          </header>

          <nav className="mt-8 rounded-2xl border border-[var(--sy-glass-border)] p-4 text-sm" aria-label={hi ? 'विषय-सूची' : 'Table of contents'}>
            <p className="font-semibold text-[var(--sy-text)]">{hi ? 'इस गाइड में' : 'In this guide'}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-[var(--sy-accent)]">
              <li><a href="#what" className="hover:underline">{hi ? 'श्री यंत्र क्या है?' : 'What is Shree Yantra?'}</a></li>
              <li><a href="#names" className="hover:underline">{hi ? 'नाम और शब्द' : 'Names and terminology'}</a></li>
              <li><a href="#geometry" className="hover:underline">{hi ? 'ज्यामिति और प्रतीक' : 'Geometry and symbolism'}</a></li>
              <li><a href="#puja" className="hover:underline">{hi ? 'पूजा और अभ्यास' : 'Puja and practice'}</a></li>
              <li><a href="#placement" className="hover:underline">{hi ? 'स्थापना' : 'Placement'}</a></li>
              <li><a href="#meditation" className="hover:underline">{hi ? 'ध्यान और मंत्र' : 'Meditation and mantra'}</a></li>
              <li><a href="#misconceptions" className="hover:underline">{hi ? 'भ्रांतियाँ' : 'Misconceptions'}</a></li>
              <li><a href="#faq" className="hover:underline">{hi ? 'प्रश्नोत्तर' : 'FAQ'}</a></li>
            </ol>
          </nav>

          <section id="what" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'श्री यंत्र क्या है?' : 'What is Shree Yantra?'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'श्री यंत्र एक पवित्र ज्यामितीय चित्र है — नौ परस्पर जुड़े त्रिकोण, वृत्त और केंद्र में बिंदु — जिसे शक्ति, सृष्टि और ब्रह्मांडीय सामंजस्य का प्रतीक माना जाता है। भक्त इसे ध्यान, पूजा और आध्यात्मिक केंद्रितता के लिए उपयोग करते हैं।'
                : 'Shree Yantra is a sacred geometric diagram — nine interlocking triangles, circles and a central bindu — regarded in tradition as a symbol of Shakti, creation and cosmic harmony. Devotees use it for meditation, worship and spiritual focus.'}
            </p>
          </section>

          <section id="names" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'श्री यंत्र बनाम श्री चक्र' : 'Shree Yantra vs Sri Chakra terminology'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? '«श्री», «श्री» और «श्री» वर्तनी क्षेत्रीय और भाषाई रूप से भिन्न हो सकती है। «यंत्र» साधन या उपकरण का अर्थ देता है; «चक्र» चक्र या मंडल का। अक्सर दोनों एक ही पवित्र आरेख की ओर इशारा करते हैं, परंपरा के अनुसार व्याख्या अलग हो सकती है।'
                : 'Spellings such as Shree, Sri and Sree vary by region and language. Yantra means instrument or device; Chakra means wheel or mandala. Both terms often point to the same sacred diagram, though interpretation differs by sampradaya.'}
            </p>
          </section>

          <section id="geometry" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'ज्यामिति, बिंदु और त्रिकोण' : 'Geometry, bindu and triangles'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'केंद्र का बिंदु (bindu) अक्सर परम सत्ता या शक्ति के केंद्र के रूप में वर्णित होता है। चारों ओर के त्रिकोण शिव-शक्ति, सृष्टि-विसर्जन और ब्रह्मांडीय संतुलन के प्रतीक हैं। बाहरी वर्ग «भूपुर» कहलाता है — भौतिक संसार का द्वार।'
                : 'The central bindu is often described as the focal point of supreme reality or Shakti. Surrounding triangles symbolise Shiva-Shakti, creation-dissolution and cosmic balance in traditional commentaries. The outer square (bhupura) represents the gateway of the manifest world.'}
            </p>
            <p className="mt-3 text-sm text-[var(--sy-text-muted)]">
              {hi
                ? '[स्कriptural citation placeholder — विशिष्ट शास्त्रीय उद्धरण जोड़ने से पहले स्रोत सत्यापित करें]'
                : '[Scriptural citation placeholder — verify primary sources before adding specific textual quotations]'}
            </p>
          </section>

          <section id="puja" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'पूजा विधि — सामान्य कदम' : 'Puja vidhi — common steps'}
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              <li>{hi ? 'शुद्ध स्थान और स्वच्छ वस्त्र/आसन तैयार करें।' : 'Prepare a clean space, cloth and seat.'}</li>
              <li>{hi ? 'दीप, धूप और पुष्प से साधारण अर्चना।' : 'Offer lamp, incense and flowers with simple archana.'}</li>
              <li>{hi ? 'गुरु/परंपरा द्वारा सिखaya गया मंत्र या नाम जप।' : 'Chant mantra or names taught by your guru or lineage.'}</li>
              <li>{hi ? 'शांत ध्यान — बिंदु पर दृष्टि या मानसिक ध्यान।' : 'Quiet meditation — gaze at the bindu or internal visualisation.'}</li>
            </ol>
            <p className="mt-3 text-sm text-[var(--sy-text-muted)]">
              {hi
                ? 'विस्तृत विधि गुरु, मंदिर परंपरा या पुस्तक पर निर्भर करती है — यहाँ सामान्य ढाँचा दिया गया है, न कि एकमात्र विधि।'
                : 'Detailed vidhi depends on guru, temple tradition or text — this is a general framework, not the only valid method.'}
            </p>
          </section>

          <section id="placement" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'स्थापना और दिशा' : 'Placement and direction'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'घर में अक्सर पूजा-कक्ष, शुद्ध अलमारी या ऊँचे स्थान पर रखा जाता है — पैरों के स्तर से ऊपर, साफ और शांत कोने में। पूर्व या ईशान (उत्तर-पूर्व) की ओर मुख अनुशंसित हो सकता है; वास्तु सलाहकार या गुरु से अपने घर के लिए पुष्टि करें।'
                : 'At home, the yantra is often kept in a puja room, clean cabinet or elevated place — above foot level, in a tidy quiet corner. East or north-east orientation is commonly suggested; confirm for your home with a Vastu advisor or teacher.'}
            </p>
          </section>

          <section id="meditation" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'ध्यान और मंत्र' : 'Meditation and mantra'}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              {hi
                ? 'अनेक परंपराएँ «ॐ श्रीं» या ललिता-संबंधी बीज मंत्र का जप करती हैं। मंत्र, उच्चारण और संख्या गुरु द्वारा निर्धारित होनी चाहिए। नियमित, संयमित अभ्यास अधिक महत्वपूर्ण है।'
                : 'Many traditions use bija mantras such as Om Shreem or Lalita-related formulae. Mantra, pronunciation and count should be set by a qualified teacher. Regular, disciplined practice matters more than intensity alone.'}
            </p>
          </section>

          <section id="misconceptions" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'सामान्य भ्रांतियाँ' : 'Common misconceptions'}
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
              <li>
                {hi
                  ? 'श्री यंत्र धन, विवाह या स्वास्थ्य की गारंटी नहीं देता — यह साधना का साधन है।'
                  : 'Shree Yantra does not guarantee wealth, marriage or health — it is a tool for sadhana.'}
              </li>
              <li>
                {hi
                  ? 'केवल धातु या आकार खरीदने से पर्याप्त फल नहीं मिलता; भक्ति, नैतिकता और निरंतर अभ्यास आवश्यक हैं।'
                  : 'Buying metal or size alone is not sufficient; devotion, ethics and consistent practice are essential.'}
              </li>
              <li>
                {hi
                  ? 'यह चिकित्सा, कानूनी या वित्तीय सलाह का विकल्प नहीं है।'
                  : 'It is not a substitute for medical, legal or financial advice.'}
              </li>
            </ul>
          </section>

          <section id="related" className="mt-10 rounded-2xl border border-[var(--sy-glass-border)] p-5">
            <h2 className="font-display text-lg font-semibold text-[var(--sy-text)]">
              {hi ? 'संबंधित पृष्ठ' : 'Related pages'}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-3 text-sm">
              <li><Link to="/app" className="text-[var(--sy-accent)] hover:underline">{hi ? 'ऐप' : 'App'}</Link></li>
              <li><Link to="/kundli" className="text-[var(--sy-accent)] hover:underline">{hi ? 'कुंडली' : 'Kundli'}</Link></li>
              <li><Link to="/panchang" className="text-[var(--sy-accent)] hover:underline">{hi ? 'पंचांग' : 'Panchang'}</Link></li>
              <li><Link to="/library" className="text-[var(--sy-accent)] hover:underline">{hi ? 'पुस्तकालय' : 'Library'}</Link></li>
              <li><Link to="/disclaimer" className="text-[var(--sy-accent)] hover:underline">{hi ? 'अस्वीकरण' : 'Disclaimer'}</Link></li>
            </ul>
          </section>

          <section id="faq" className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-[var(--sy-text)]">
              {hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently asked questions'}
            </h2>
            <dl className="mt-4 space-y-4">
              {FAQ_EN.map((item) => (
                <div key={item.q} className="sy-stat-tile">
                  <dt className="font-semibold text-[var(--sy-text)]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <footer className="mt-10 border-t border-[var(--sy-glass-border)] pt-6 text-sm text-[var(--sy-text-muted)]">
            <p>
              {hi ? 'संपादकीय नोट: ' : 'Editorial note: '}
              {hi
                ? 'यह सामग्री सामान्य शैक्षणिक उद्देश्य के लिए है। विशिष्ट पूजा-विधि के लिए योग्य गुरु या मंदिर परंपरा से परामर्श करें।'
                : 'This content is for general education. Consult a qualified guru or temple tradition for specific puja vidhi.'}
            </p>
            <p className="mt-2">
              {hi ? 'हमारे ऐप के बारे में: ' : 'About our app: '}
              <Link to="/app" className="text-[var(--sy-accent)] hover:underline">
                Shree Yantra Astrology
              </Link>
            </p>
          </footer>
        </article>
        <SiteFooter />
      </div>
  )
}
