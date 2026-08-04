import type { BiText, VedicReadingResponse } from '@/lib/api'
import { aNakshatra, aSign } from '@/lib/astroLabels'
import { SaralVivaranBlock } from '@/components/feature/BirthDetailsCollapsible'
import { useLang } from '@/i18n/LangProvider'

const CAT: Record<string, { icon: string; color: string; en: string; hi: string }> = {
  personality: { icon: '🧬', color: '#9b8cff', en: 'Personality', hi: 'व्यक्तित्व' },
  nature: { icon: '🌿', color: '#6ec88c', en: 'Nature', hi: 'स्वभाव' },
  career: { icon: '💼', color: '#e0a92e', en: 'Career', hi: 'करियर' },
  wealth: { icon: '💰', color: '#3ec77a', en: 'Wealth', hi: 'धन' },
  education: { icon: '📚', color: '#5aa9e0', en: 'Education', hi: 'शिक्षा' },
  yoga: { icon: '✨', color: '#f4c34a', en: 'Special Yogas', hi: 'विशेष योग' },
  health: { icon: '🩺', color: '#e07aa9', en: 'Health', hi: 'स्वास्थ्य' },
  precaution: { icon: '⚠️', color: '#e06a5a', en: 'Precautions', hi: 'सावधानियाँ' },
}
const CAT_ORDER = ['yoga', 'personality', 'career', 'wealth', 'education', 'nature', 'health', 'precaution']

function L(o: BiText | null | undefined, hi: boolean) {
  return o ? (hi ? o.hi : o.en) : ''
}

function Chip({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="rounded-lg border border-[var(--sy-glass-border)] bg-black/[0.03] px-2 py-1 dark:bg-white/[0.03]">
      <p className="text-[10px] uppercase text-[var(--sy-text-muted)]">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function PredCard({
  p,
  hi,
}: {
  p: VedicReadingResponse['predictions'][number]
  hi: boolean
}) {
  const dot = p.strength === 'good' ? '#3ec77a' : p.strength === 'caution' ? '#e06a5a' : 'var(--sy-accent)'
  return (
    <div className="rounded-xl border border-[var(--sy-glass-border)] p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{hi ? p.title.hi : p.title.en}</p>
          {'source' in p && p.source ? (
            <span className="ml-2 text-[10px] uppercase text-[var(--sy-text-muted)]">{p.source}</span>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">{hi ? p.text.hi : p.text.en}</p>
        </div>
      </div>
    </div>
  )
}

export function VedicReadingAppView({ data }: { data: VedicReadingResponse }) {
  const { hi, lang } = useLang()
  const ex = data.explanation
  const j = data.janma

  const grouped = CAT_ORDER.map((c) => ({
    cat: c,
    items: (data.predictions || []).filter((p) => ('category' in p ? p.category : undefined) === c),
  })).filter((g) => g.items.length)
  const others = (data.predictions || []).filter((p) => {
    const cat = 'category' in p ? p.category : undefined
    return !cat || !CAT_ORDER.includes(String(cat))
  })
  if (others.length) grouped.push({ cat: 'personality', items: others })

  const bp = data.birthPanchang

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">
          {hi ? 'पारंपरिक फलादेश' : 'Traditional Reading'}
        </h2>
        <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
          {data.ascendant ? `${hi ? 'लग्न' : 'Lagna'} ${aSign(data.ascendant, lang)}` : ''}
          {data.moonSign ? ` · ${hi ? 'चंद्र' : 'Moon'} ${aSign(data.moonSign, lang)}` : ''}
        </p>
      </div>

      {j ? (
        <div className="sy-stat-tile">
          <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'जन्म विवरण' : 'Birth profile'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip label={hi ? 'गण' : 'Gana'} value={L(j.gana, hi)} />
            <Chip label={hi ? 'योनि' : 'Yoni'} value={L(j.yoni, hi)} />
            <Chip label={hi ? 'नाड़ी' : 'Nadi'} value={L(j.nadi, hi)} />
            <Chip label={hi ? 'वर्ण' : 'Varna'} value={L(j.varna, hi)} />
          </div>
          {j.gandmool?.present ? (
            <p className="mt-3 text-sm text-amber-600">
              ⚠ {hi ? 'गण्डमूल नक्षत्र' : 'Gandmool Nakshatra'}
              {j.gandmool.nakshatra ? ` (${aNakshatra(j.gandmool.nakshatra, lang)})` : ''} — {L(j.gandmool.note, hi)}
            </p>
          ) : null}
          {j.lagnaSandhi ? (
            <p className="mt-2 text-sm text-amber-600">
              ⚠ {hi ? 'लग्न संधि (सीमा-जन्म)' : 'Lagna Sandhi (borderline birth)'}
            </p>
          ) : null}
        </div>
      ) : null}

      {data.naamakshar ? (
        <div className="sy-stat-tile text-center">
          <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'नामाक्षर' : 'Naamakshar'}</p>
          <p className="font-display mt-2 text-3xl font-bold text-[var(--sy-accent)]">{data.naamakshar.syllable}</p>
          <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
            {L(data.naamakshar.note, hi)} — {aNakshatra(data.naamakshar.nakshatra, lang)}{' '}
            {hi ? 'चरण' : 'pada'} {data.naamakshar.pada}
          </p>
        </div>
      ) : null}

      {bp ? (
        <div className="sy-stat-tile">
          <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'जन्म पंचांग' : 'Birth Panchang'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              label={hi ? 'तिथि' : 'Tithi'}
              value={`${hi ? bp.tithi.hi || bp.tithi.name : bp.tithi.name} (${bp.tithi.paksha})`}
            />
            <Chip
              label={hi ? 'नक्षत्र' : 'Nakshatra'}
              value={`${hi ? bp.nakshatra.hi || bp.nakshatra.name : bp.nakshatra.name} p${bp.nakshatra.pada}`}
            />
            <Chip label={hi ? 'योग' : 'Yoga'} value={hi ? bp.yoga.hi || bp.yoga.name : bp.yoga.name} />
            <Chip label={hi ? 'करण' : 'Karana'} value={hi ? bp.karana.hi || bp.karana.name : bp.karana.name} />
          </div>
        </div>
      ) : null}

      {ex?.summary ? (
        <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm leading-relaxed">{ex.summary}</p>
        </div>
      ) : null}

      {grouped.map((g) => {
        const c = CAT[g.cat] || CAT.personality
        return (
          <div key={g.cat} className="sy-stat-tile" style={{ borderColor: `${c.color}55` }}>
            <p className="font-semibold" style={{ color: c.color }}>
              {c.icon} {hi ? c.hi : c.en}
            </p>
            <div className="mt-3 space-y-2">
              {g.items.map((p, i) => (
                <PredCard key={p.key || i} p={p} hi={hi} />
              ))}
            </div>
          </div>
        )
      })}

      {ex?.advice ? (
        <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm leading-relaxed">💛 {ex.advice}</p>
        </div>
      ) : null}

      <SaralVivaranBlock text={ex?.saralVivaran} />

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒{' '}
        {hi
          ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri) · फलादेश शास्त्र-आधारित।'
          : 'Real planetary positions (Lahiri) · readings from classical texts.'}
      </p>
    </div>
  )
}
