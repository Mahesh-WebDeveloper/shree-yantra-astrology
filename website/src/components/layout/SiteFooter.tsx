import { Link } from 'react-router-dom'
import { ShreeYantraLogo } from '@/components/brand/ShreeYantraLogo'
import { PLAY_STORE_URL } from '@/data/brandShowcase'
import { useLang } from '@/i18n/LangProvider'

const LINKS = [
  { to: '/#app-tour', en: 'App tour', hi: 'ऐप की झलक' },
  { to: '/#features', en: 'Features', hi: 'सुविधाएँ' },
  { to: '/#method', en: 'Methodology', hi: 'गणना पद्धति' },
  { to: '/help', en: 'Help', hi: 'सहायता' },
  { to: '/legal', en: 'Privacy and terms', hi: 'गोपनीयता और शर्तें' },
]

export function SiteFooter() {
  const { hi } = useLang()

  return (
    <footer className="sy-footer">
      <div className="sy-container sy-footer__top">
        <div className="sy-footer__brand">
          <ShreeYantraLogo size={46} pulse={false} />
          <div>
            <strong>Shree Yantraa Astrology</strong>
            <p>
              {hi
                ? 'प्राचीन वैदिक ज्ञान को स्पष्ट, सुंदर और आधुनिक मोबाइल अनुभव में समझें।'
                : 'Ancient Vedic wisdom, made clear through a beautiful modern mobile experience.'}
            </p>
          </div>
        </div>

        <nav className="sy-footer__nav" aria-label="Footer">
          {LINKS.map((link) =>
            link.to.startsWith('/#') ? (
              <a key={link.to} href={link.to.replace('/#', '#')}>
                {hi ? link.hi : link.en}
              </a>
            ) : (
              <Link key={link.to} to={link.to}>
                {hi ? link.hi : link.en}
              </Link>
            ),
          )}
        </nav>

        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="sy-footer__play">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3.6 2.8c-.4.2-.6.6-.6 1.1v16.2c0 .5.2.9.6 1.1l10.2-9.2L3.6 2.8zm11.3 8.1 2.4-1.4-2.4-4.1-2.6 2.4 2.6 3.1zm.1 1.9-2.7 3.1 2.6 2.4 2.5-4.1-2.4-1.4z" />
          </svg>
          <span>
            <small>{hi ? 'Google Play पर' : 'Get it on'}</small>
            <strong>Google Play</strong>
          </span>
        </a>
      </div>

      <div className="sy-container sy-footer__bottom">
        <p>
          {hi
            ? 'यह वेबसाइट ऐप की आधिकारिक झलक है। व्यक्तिगत गणना और प्रीमियम रीडिंग Android ऐप में उपलब्ध हैं।'
            : 'This is the official app showcase. Personal calculations and premium readings are available in the Android app.'}
        </p>
        <span>© {new Date().getFullYear()} Shree Yantraa Astrology</span>
      </div>
    </footer>
  )
}
