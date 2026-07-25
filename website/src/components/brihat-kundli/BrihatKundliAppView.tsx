import type { ApiDosha, BiText, BrihatDomain, BrihatKundliResponse, BrihatSection } from '@/lib/api'
import { aSign } from '@/lib/astroLabels'
import { GoldButton } from '@/components/ui/GoldButton'
import { useLang } from '@/i18n/LangProvider'

export type BrihatPdfPerson = { name?: string; dob: string; tob: string; place: string }

function tx(text: BiText | null | undefined, hi: boolean) {
  if (!text) return ''
  return hi ? text.hi : text.en
}

function StatusPill({ status }: { status: string }) {
  const ready = status === 'ready'
  const color = ready ? '#3ec77a' : status === 'unavailable' ? '#e06a5a' : 'var(--sy-accent)'
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ borderColor: `${color}88`, color, backgroundColor: `${color}16` }}
    >
      {ready ? 'READY' : status.toUpperCase()}
    </span>
  )
}

function SectionRow({ item }: { item: BrihatSection }) {
  const { hi } = useLang()
  return (
    <div className="flex items-center gap-3 border-b border-[var(--sy-glass-border)] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--sy-accent)]">{tx(item.title, hi)}</p>
        <p className="text-xs text-[var(--sy-text-muted)]">
          {item.count || 0} items{item.source ? ` · ${item.source}` : ''}
        </p>
      </div>
      <StatusPill status={item.status} />
    </div>
  )
}

function DomainCard({ item }: { item: BrihatDomain }) {
  const { hi } = useLang()
  const summary = tx(item.summary ?? null, hi)
  const years = item.timing?.favorableYears || []
  return (
    <div className="sy-stat-tile mt-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--sy-accent)]">{tx(item.title, hi)}</p>
          {item.charts?.length ? (
            <p className="mt-1 text-xs text-[var(--sy-text-muted)]">
              {item.charts.join(', ')}
              {item.focus?.length ? ` · ${item.focus.slice(0, 3).join(', ')}` : ''}
            </p>
          ) : null}
        </div>
        <StatusPill status={item.confidence === 'calculated' ? 'ready' : 'partial'} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--sy-text-soft)]">
        {summary ||
          (hi ? 'इस क्षेत्र के लिए विस्तृत नियम अगले चरण में।' : 'Deeper rules for this area in the next phase.')}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {item.timing?.currentDashaLord ? (
          <span className="rounded-full border border-[var(--sy-glass-border)] bg-amber-500/10 px-2 py-0.5 text-xs">
            Dasha: {item.timing.currentDashaLord}
          </span>
        ) : null}
        {years.length ? (
          <span className="rounded-full border border-[var(--sy-glass-border)] bg-amber-500/10 px-2 py-0.5 text-xs">
            {hi ? 'शुभ वर्ष' : 'Good years'}: {years.join(', ')}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function DoshaList({ doshas }: { doshas?: ApiDosha[] }) {
  const { hi } = useLang()
  if (!doshas?.length) return null
  return (
    <div className="sy-stat-tile mt-3">
      <p className="text-xs font-bold uppercase text-[var(--sy-text-muted)]">{hi ? 'दोष' : 'Doshas'}</p>
      <ul className="mt-2 space-y-2">
        {doshas.map((d, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold">{d.name}</span>
            {d.present != null ? (
              <span className={d.present ? ' text-amber-600' : ' text-emerald-600'}>
                {' '}
                — {d.present ? (hi ? 'उपस्थित' : 'Present') : hi ? 'नहीं' : 'Clear'}
              </span>
            ) : null}
            {d.detail ? <p className="mt-1 text-[var(--sy-text-soft)]">{d.detail}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

const ROADMAP: Record<string, { en: string; hi: string }> = {
  'in-calibration': { en: 'Being calibrated', hi: 'सत्यापन जारी' },
  'needs-placidus-cusps': { en: 'Needs Placidus cusps', hi: 'Placidus cusp आवश्यक' },
  'source-verification': { en: 'Verifying sources', hi: 'स्रोत सत्यापन' },
  'expert-module': { en: 'Expert module', hi: 'विशेषज्ञ मॉड्यूल' },
  planned: { en: 'Planned', hi: 'योजनाबद्ध' },
}

export function BrihatKundliAppView({
  report,
  person,
}: {
  report: BrihatKundliResponse
  person?: BrihatPdfPerson | null
}) {
  const { hi, lang } = useLang()
  const s = report.summary
  const readyCount = (report.sections || []).filter((x) => x.status === 'ready').length

  const exportPdf = () => {
    if (!person?.dob || !person.place) return
    const title = tx(report.title, hi)
    const rows = report.sections
      .map((s) => `<tr><td>${tx(s.title, hi)}</td><td>${s.status}</td><td>${s.count ?? 0}</td></tr>`)
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>body{font-family:Georgia,serif;padding:24px;color:#1a1206}h1{color:#8b6914}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #ddd;padding:8px;font-size:13px}</style></head><body>
<h1>${title}</h1>
<p>${person.name || ''} · ${person.dob} · ${person.tob} · ${person.place}</p>
<p>Lagna: ${s.ascendant || '—'} · Moon: ${s.moonSign || '—'}</p>
<table><thead><tr><th>Section</th><th>Status</th><th>Count</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="space-y-4">
      {person?.dob && person.place ? (
        <GoldButton type="button" className="w-full sm:w-auto" onClick={exportPdf}>
          {hi ? 'PDF / प्रिंट (ऐप जैसा)' : 'PDF / Print (like app)'}
        </GoldButton>
      ) : null}
      <div className="sy-stat-tile border border-[var(--sy-accent)]/40">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--sy-accent)]">
          {hi ? 'रिपोर्ट सारांश' : 'Report summary'}
        </p>
        <h2 className="font-display mt-2 text-xl font-semibold">{tx(report.title, hi)}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: hi ? 'लग्न' : 'Lagna', value: s.ascendant ? aSign(s.ascendant, lang) : '—' },
            { label: hi ? 'चंद्र' : 'Moon', value: s.moonSign ? aSign(s.moonSign, lang) : '—' },
            { label: hi ? 'सूर्य' : 'Sun', value: s.sunSign ? aSign(s.sunSign, lang) : '—' },
            { label: 'Dasha', value: s.activeDasha?.lord || '—' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-[var(--sy-glass-border)] bg-black/[0.03] p-2 dark:bg-white/[0.03]">
              <p className="text-[10px] uppercase text-[var(--sy-text-muted)]">{m.label}</p>
              <p className="truncate font-semibold">{m.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--sy-text-muted)]">
          {readyCount}/{report.sections.length} {hi ? 'सेक्शन तैयार' : 'sections ready'}
          {report.accuracy?.note ? ` · ${report.accuracy.note}` : ''}
        </p>
      </div>

      {report.accuracy?.engine ? (
        <div className="sy-stat-tile text-sm text-[var(--sy-text-soft)]">{report.accuracy.engine}</div>
      ) : null}

      <div className="sy-stat-tile">
        <p className="mb-2 font-semibold text-[var(--sy-accent)]">{hi ? 'रिपोर्ट सेक्शन' : 'Report sections'}</p>
        {(report.sections || []).map((item) => (
          <SectionRow key={item.key} item={item} />
        ))}
      </div>

      <DoshaList doshas={s.doshas} />

      {(report.domains || []).some((d) => d.summary) ? (
        <div>
          <p className="font-semibold text-[var(--sy-accent)]">{hi ? 'जीवन क्षेत्र' : 'Life areas'}</p>
          {(report.domains || [])
            .filter((d) => d.summary)
            .map((item) => (
              <DomainCard key={item.key} item={item} />
            ))}
        </div>
      ) : null}

      {report.roadmap?.length ? (
        <div className="sy-stat-tile">
          <p className="mb-3 font-semibold">{hi ? 'रोडमैप' : 'Roadmap'}</p>
          <ul className="space-y-2">
            {report.roadmap.map((r) => {
              const reason = ROADMAP[r.status] || { en: r.status, hi: r.status }
              return (
                <li key={r.key} className="flex items-start justify-between gap-2 text-sm">
                  <span>{r.title}</span>
                  <span className="shrink-0 text-xs text-[var(--sy-accent)]">{hi ? reason.hi : reason.en}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
