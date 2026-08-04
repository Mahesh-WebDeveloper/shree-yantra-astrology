import type { BirthFormState } from '@/lib/birthForm'
import { useLang } from '@/i18n/LangProvider'

export function SyField({
  label,
  children,
  hint,
  className,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <label className={`sy-field block ${className ?? ''}`}>
      <span className="sy-field-label">{label}</span>
      {children}
      {hint ? <span className="sy-field-hint">{hint}</span> : null}
    </label>
  )
}

export function SyInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`sy-field-input ${props.className ?? ''}`} />
}

export function SySelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`sy-field-input sy-field-select ${props.className ?? ''}`} />
}

export function LocationFields({
  form,
  onChange,
}: {
  form: Pick<BirthFormState, 'place' | 'lat' | 'lng' | 'tz'>
  onChange: (patch: Partial<BirthFormState>) => void
}) {
  const { hi } = useLang()
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SyField label={hi ? 'स्थान / शहर' : 'Place / city'} className="sm:col-span-2">
        <SyInput value={form.place} onChange={(e) => onChange({ place: e.target.value })} autoComplete="address-level2" />
      </SyField>
      <SyField label={hi ? 'अक्षांश' : 'Latitude'} hint={hi ? 'वैकल्पिक — सटीकता के लिए' : 'Optional — for accuracy'}>
        <SyInput value={form.lat} onChange={(e) => onChange({ lat: e.target.value })} inputMode="decimal" />
      </SyField>
      <SyField label={hi ? 'देशांतर' : 'Longitude'}>
        <SyInput value={form.lng} onChange={(e) => onChange({ lng: e.target.value })} inputMode="decimal" />
      </SyField>
      <SyField label={hi ? 'समय क्षेत्र' : 'Timezone offset'}>
        <SyInput value={form.tz} onChange={(e) => onChange({ tz: e.target.value })} placeholder="+05:30" />
      </SyField>
    </div>
  )
}

export function BirthDetailsForm({
  form,
  onChange,
  showName,
}: {
  form: BirthFormState
  onChange: (patch: Partial<BirthFormState>) => void
  showName?: boolean
}) {
  const { hi } = useLang()
  return (
    <div className="grid gap-4">
      {showName ? (
        <SyField label={hi ? 'नाम' : 'Name'}>
          <SyInput value={form.name} onChange={(e) => onChange({ name: e.target.value })} autoComplete="name" />
        </SyField>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <SyField label={hi ? 'जन्म तिथि' : 'Date of birth'}>
          <SyInput type="date" value={form.dobHtml} onChange={(e) => onChange({ dobHtml: e.target.value })} />
        </SyField>
        <SyField label={hi ? 'जन्म समय' : 'Time of birth'} hint="24h HH:MM">
          <SyInput type="time" value={form.tob} onChange={(e) => onChange({ tob: e.target.value })} />
        </SyField>
      </div>
      <LocationFields form={form} onChange={onChange} />
    </div>
  )
}
