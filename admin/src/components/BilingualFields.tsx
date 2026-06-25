import type { TextTranslation } from '@/api/types'
import { Field, Input, Textarea } from '@/components/ui/form'

type BilingualFieldsProps = {
  value?: TextTranslation
  onChange: (value: TextTranslation) => void
  fields: Array<{ key: string; label: string; multiline?: boolean }>
}

function ensure(value?: TextTranslation): TextTranslation {
  return {
    en: { ...(value?.en || {}) },
    hi: { ...(value?.hi || {}) },
  }
}

export function BilingualFields({ value, onChange, fields }: BilingualFieldsProps) {
  const current = ensure(value)
  const update = (lang: 'en' | 'hi', key: string, text: string) => {
    onChange({
      ...current,
      [lang]: { ...current[lang], [key]: text },
    })
  }

  return (
    <div className="grid gap-4 rounded-lg border border-border bg-muted/35 p-3">
      <div className="hidden gap-2 sm:grid sm:grid-cols-2">
        <div className="rounded-md bg-card px-3 py-2 text-sm font-semibold text-card-foreground">English</div>
        <div className="rounded-md bg-card px-3 py-2 text-sm font-semibold text-card-foreground">Hindi</div>
      </div>
      {fields.map((field) => {
        const Control = field.multiline ? Textarea : Input
        return (
          <div key={field.key} className="grid gap-3 sm:grid-cols-2">
            <Field label={`${field.label} - English`}>
              <Control value={current.en[field.key] || ''} onChange={(event) => update('en', field.key, event.target.value)} />
            </Field>
            <Field label={`${field.label} - Hindi`}>
              <Control value={current.hi[field.key] || ''} onChange={(event) => update('hi', field.key, event.target.value)} />
            </Field>
          </div>
        )
      })}
    </div>
  )
}
