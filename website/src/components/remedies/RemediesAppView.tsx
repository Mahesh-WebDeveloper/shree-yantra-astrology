import { useState } from 'react'
import type { DoshaRemedyItem, RemediesResponse } from '@/lib/api'
import { aPlanet, aSign } from '@/lib/astroLabels'
import { AppSection, SaralVivaranBlock } from '@/components/feature/BirthDetailsCollapsible'
import { useLang } from '@/i18n/LangProvider'

function Chip({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="rem-chip">
      <span className="rem-chip-lbl">{label}</span>
      <span className="rem-chip-val">{value}</span>
    </div>
  )
}

function DoshaCard({ d }: { d: DoshaRemedyItem }) {
  const { hi } = useLang()
  const col = d.present ? '#e0a92e' : '#3ec77a'
  const name = hi && d.nameHi ? d.nameHi : d.name
  return (
    <div className="rem-dosha-card" style={{ borderColor: d.present ? `${col}66` : undefined, backgroundColor: d.present ? `${col}12` : undefined }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{name}</p>
        <span className="kundli-row-pill" style={{ borderColor: `${col}88`, color: col, backgroundColor: `${col}22` }}>
          {d.present ? (hi ? 'विद्यमान' : 'Present') : hi ? 'नहीं' : 'Clear'}
        </span>
      </div>
      {d.present ? (
        <>
          {d.remedies.map((r, i) => (
            <p key={i} className="mt-2 text-sm text-[var(--sy-text-soft)]">
              • {hi && r.titleHi ? r.titleHi : r.title}
            </p>
          ))}
          {(hi ? d.mantraHi || d.mantra : d.mantra) ? (
            <p className="rem-mantra-box mt-3 font-deva text-sm">🕉 {hi ? d.mantraHi || d.mantra : d.mantra}</p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function RemediesAppView({ data }: { data: RemediesResponse }) {
  const { hi, lang } = useLang()
  const [showMantras, setShowMantras] = useState(false)
  const gem = data.remedies?.lifeGem
  const ex = data.explanation

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-xl font-semibold text-[var(--sy-accent)]">{hi ? 'आपके उपाय' : 'Your Remedies'}</h2>
        {data.ascendant ? (
          <p className="mt-2 text-sm text-[var(--sy-text-muted)]">
            {hi ? 'लग्न' : 'Ascendant'}: {aSign(data.ascendant, lang)}
            {data.moonSign ? ` · ${hi ? 'चंद्र' : 'Moon'}: ${aSign(data.moonSign, lang)}` : ''}
          </p>
        ) : null}
      </div>

      {ex?.summary ? (
        <AppSection title={hi ? 'सार' : 'Summary'}>
          <p className="text-sm leading-relaxed">{ex.summary}</p>
        </AppSection>
      ) : null}

      {gem ? (
        <div className="rem-gem-card sy-stat-tile text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--sy-accent)]">
            💎 {hi ? 'आपका भाग्य रत्न' : 'Your Life Gemstone'}
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--sy-accent)]">
            {hi && gem.gemstoneHi ? gem.gemstoneHi : gem.gemstone}
          </p>
          <p className="mt-1 text-sm text-[var(--sy-text-muted)]">
            {hi ? 'स्वामी ग्रह' : 'Ruling planet'}: {aPlanet(gem.planet, lang)}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Chip label={hi ? 'धातु' : 'Metal'} value={hi ? gem.metalHi : gem.metal} />
            <Chip label={hi ? 'उंगली' : 'Finger'} value={hi ? gem.fingerHi : gem.finger} />
            <Chip label={hi ? 'दिन' : 'Day'} value={hi ? gem.dayHi : gem.day} />
          </div>
          {ex?.gemWhy ? <p className="mt-4 text-sm text-[var(--sy-text-soft)]">{ex.gemWhy}</p> : null}
          {gem.mantra ? <p className="rem-mantra-box mt-4 font-deva text-sm">🕉 {gem.mantra}</p> : null}
          <p className="mt-4 text-xs text-[var(--sy-text-muted)]">
            ⚠ {hi ? 'रत्न ज्योतिषी से सलाह के बाद ही धारण करें।' : 'Wear a gemstone only after consulting an astrologer.'}
          </p>
        </div>
      ) : null}

      {data.remedies?.doshaRemedies?.length ? (
        <AppSection title={hi ? 'दोष व उनके उपाय' : 'Doshas & their Remedies'}>
          <div className="space-y-3">
            {data.remedies.doshaRemedies.map((d) => (
              <DoshaCard key={d.key || d.name} d={d} />
            ))}
          </div>
        </AppSection>
      ) : null}

      {data.remedies?.planetMantras?.length ? (
        <div className="sy-stat-tile">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() => setShowMantras((s) => !s)}
          >
            <span className="kundli-card-head mb-0">{hi ? 'नवग्रह बीज मंत्र' : 'Navagraha Beej Mantras'}</span>
            <span className="text-sm font-semibold text-[var(--sy-accent)]">
              {showMantras ? (hi ? 'छिपाएँ' : 'Hide') : hi ? 'देखें' : 'Show'}
            </span>
          </button>
          {showMantras ? (
            <div className="mt-4 space-y-3">
              {data.remedies.planetMantras.map((m) => (
                <div key={m.planet} className="rem-mantra-row">
                  <p className="text-sm font-semibold text-[var(--sy-accent)]">
                    {aPlanet(m.planet, lang)}
                    {m.count ? ` · ${m.count}` : ''}
                  </p>
                  <p className="mt-1 font-deva text-sm">{m.mantra}</p>
                  {(hi ? m.forWhatHi : m.forWhat) ? (
                    <p className="mt-1 text-xs text-[var(--sy-text-muted)]">{hi ? m.forWhatHi : m.forWhat}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {ex?.scriptureNote ? (
        <div className="sy-stat-tile border border-amber-500/25 bg-amber-500/8">
          <p className="kundli-card-head">📿 {hi ? 'शास्त्रों से' : 'From the Scriptures'}</p>
          <p className="text-sm italic leading-relaxed">{ex.scriptureNote}</p>
        </div>
      ) : null}

      {ex?.advice ? (
        <div className="sy-stat-tile border border-amber-500/30 bg-amber-500/10">
          <p className="text-sm leading-relaxed">💛 {ex.advice}</p>
        </div>
      ) : null}

      <SaralVivaranBlock text={ex?.saralVivaran} />

      <p className="text-center text-xs text-[var(--sy-text-muted)]">
        🔒 {hi ? 'उपाय शास्त्र-आधारित · गणना वास्तविक ग्रह-स्थितियों से।' : 'Remedies are scripture-based · calculated from real planetary positions.'}
      </p>
    </div>
  )
}
