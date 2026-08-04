import { Link, useParams } from 'react-router-dom'
import { useLang } from '@/i18n/LangProvider'
import { GradientText } from '@/components/ui/GradientText'
import { GoldButton } from '@/components/ui/GoldButton'
import kundliCardImg from '@/assets/kundli-card.png'
import milanMatchImg from '@/assets/Kundali-Milan-Matching.png'
import { serviceTintStyle } from '@/data/welcomeServices'
import { Panel } from '@/components/ui/Panel'

const PAGE_META: Record<string, { hi: string; en: string; img: string; altHi: string; altEn: string; tintKey: string; accent: string }> = {
  kundli: {
    hi: 'जन्म कुंडली',
    en: 'Janam Kundli',
    img: kundliCardImg,
    altHi: 'जन्म कुंडली चार्ट',
    altEn: 'Janam Kundli chart',
    tintKey: 'kundli',
    accent: '#8fb4ff',
  },
  'kundli-match': {
    hi: 'कुंडली मिलान',
    en: 'Kundli Milan',
    img: milanMatchImg,
    altHi: 'कुंडली मिलान',
    altEn: 'Kundli Milan matching',
    tintKey: 'milan',
    accent: '#f5a3ba',
  },
}

export function ComingSoonPage() {
  const { hi } = useLang()
  const { slug } = useParams()
  const meta = slug ? PAGE_META[slug] : undefined
  const title = meta ? (hi ? meta.hi : meta.en) : slug ? slug.replace(/-/g, ' ') : 'screen'

  return (
    <div className="page-shell mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 pb-16 pt-24 text-center">
      {meta ? (
        <Panel
          className="home-color-card mb-8 w-full max-w-md overflow-hidden !p-0"
          padding={false}
          style={serviceTintStyle(meta.tintKey, meta.accent)}
        >
          <span className="bento-card-shine" aria-hidden />
          <div className="coming-soon-art px-6 pb-6 pt-8">
            <img
              src={meta.img}
              alt={hi ? meta.altHi : meta.altEn}
              className="coming-soon-art-img mx-auto max-h-52 w-full max-w-[280px] object-contain sm:max-h-56"
            />
          </div>
        </Panel>
      ) : null}

      <GradientText className="font-display text-2xl capitalize">{title}</GradientText>
      <p className="mt-4 max-w-md text-[16px] leading-[1.65] text-[var(--sy-text-soft)]">
        {hi
          ? 'यह पेज अभी वेब पर उपलब्ध नहीं है — होम और मुख्य सेवाएँ लाइव API से जुड़ी हैं।'
          : 'This page is not on the website yet — home and main services use the same APIs as the app.'}
      </p>
      <Link to="/" className="mt-8">
        <GoldButton type="button">{hi ? 'होम पर वापस' : 'Back to home'}</GoldButton>
      </Link>
    </div>
  )
}
