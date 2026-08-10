import { Link } from 'react-router-dom'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { LEGAL_CONTACT } from '@/data/legal'
import { useLang } from '@/i18n/LangProvider'

export function DisclaimerPage() {
  const { hi } = useLang()

  return (
    <div className="page-shell showcase-page min-h-screen">
      <main className="mx-auto max-w-[720px] px-5 pb-16 pt-28 sm:px-8">
        <Link to="/" className="text-sm text-[var(--sy-accent)] hover:underline">
          ← {hi ? 'होम' : 'Home'}
        </Link>
        <h1 className="mt-6 font-playfair text-3xl font-bold text-[var(--sy-text)]">
          {hi ? 'अस्वीकरण' : 'Disclaimer'}
        </h1>
        <div className="mt-6 space-y-6 text-[15px] leading-relaxed text-[var(--sy-text-soft)]">
          <p>
            {hi
              ? 'श्री यंत्र एस्ट्रोलॉजी ऐप और वेबसाइट पर दी गई ज्योतिषीय, अंकशास्त्र, वास्तु और आध्यात्मिक जानकारी पारंपरिक विश्वासों और सांस्कृतिक प्रथाओं पर आधारित सूचनात्मक सामग्री है।'
              : 'Astrological, numerological, Vastu and spiritual information on the Shree Yantra Astrology app and website is informational content based on traditional beliefs and cultural practices.'}
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              {hi
                ? 'यह चिकित्सा, कानूनी, वित्तीय या मनोवैज्ञानिक सलाह नहीं है।'
                : 'It is not medical, legal, financial or psychological advice.'}
            </li>
            <li>
              {hi
                ? 'कोई भी परिणाम — धन, विवाह, स्वास्थ्य, करियर — की गारंटी नहीं दी जाती।'
                : 'No outcomes — wealth, marriage, health, career — are guaranteed.'}
            </li>
            <li>
              {hi
                ? 'महत्वपूर्ण जीवन निर्णयों में योग्य विशेषज्ञ से परामर्श करें।'
                : 'For important life decisions, consult qualified professionals.'}
            </li>
            <li>
              {hi
                ? 'AI-जनित व्याख्याएँ आपकी कुंडली संदर्भ में सरलीकरण हैं; वे गणना का स्थान नहीं लेतीं।'
                : 'AI-generated explanations simplify your chart context; they do not replace calculation.'}
            </li>
          </ul>
          <p>
            {hi ? 'पूर्ण ' : 'Full '}
            <Link to="/terms" className="text-[var(--sy-accent)] hover:underline">
              {hi ? 'सेवा शर्तें' : 'Terms of Service'}
            </Link>
            {hi ? ' और ' : ' and '}
            <Link to="/privacy" className="text-[var(--sy-accent)] hover:underline">
              {hi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </Link>
            {hi ? ' भी पढ़ें।' : ' also apply.'}
          </p>
          <p>
            {hi ? 'प्रश्न: ' : 'Questions: '}
            <a href={`mailto:${LEGAL_CONTACT}`} className="text-[var(--sy-accent)] hover:underline">
              {LEGAL_CONTACT}
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
