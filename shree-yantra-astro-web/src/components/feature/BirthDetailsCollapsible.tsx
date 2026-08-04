import { useState, type ReactNode } from 'react'
import { BirthDetailsForm } from '@/components/feature/BirthDetailsForm'
import type { BirthFormState } from '@/lib/birthForm'
import { useLang } from '@/i18n/LangProvider'

/** App-style: load from saved profile; edit birth details only when needed. */
export function BirthDetailsCollapsible({
  form,
  onChange,
  showName,
}: {
  form: BirthFormState
  onChange: (patch: Partial<BirthFormState>) => void
  showName?: boolean
}) {
  const { hi } = useLang()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className="kundli-tab-pill mb-4" onClick={() => setOpen((o) => !o)}>
        {open ? (hi ? 'जन्म विवरण छुपाएँ' : 'Hide birth details') : hi ? 'जन्म विवरण संपादित करें' : 'Edit birth details'}
      </button>
      {open ? (
        <div className="mb-6 rounded-2xl border border-[var(--sy-glass-border)] p-4">
          <BirthDetailsForm form={form} onChange={onChange} showName={showName} />
        </div>
      ) : null}
    </>
  )
}

export function SaralVivaranBlock({ text }: { text?: string | null }) {
  const { hi } = useLang()
  if (!text?.trim()) return null
  return (
    <div className="sy-stat-tile">
      <p className="kundli-card-head">{hi ? 'सरल विवरण' : 'Plain summary'}</p>
      <p className="text-sm leading-relaxed text-[var(--sy-text-soft)]">{text}</p>
    </div>
  )
}

export function AppSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sy-stat-tile space-y-3">
      <h3 className="kundli-card-head">{title}</h3>
      {children}
    </div>
  )
}
