import { SIGN_GLYPH } from '@/data/welcomeServices'
import type { HoroscopeSign } from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function SignPicker({
  signs,
  activeKey,
  onChange,
}: {
  signs: HoroscopeSign[]
  activeKey: string
  onChange: (key: string) => void
}) {
  const { hi } = useLang()
  return (
    <div className="horoscope-scroll relative z-10 mt-3 flex gap-1 overflow-x-auto rounded-xl border border-[var(--sy-glass-border)] bg-[var(--sy-glass)] p-1 backdrop-blur-md">
      {signs.map((s) => {
        const on = s.key === activeKey
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.key)}
            className={`sign-segment ${on ? 'sign-segment-active' : 'sign-segment-idle'}`}
          >
            {SIGN_GLYPH[s.key]} {hi ? s.hi || s.displayName : s.displayName}
          </button>
        )
      })}
    </div>
  )
}
