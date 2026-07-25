import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { KundliMatchAppView } from '@/components/kundli-match/KundliMatchAppView'
import { useLang } from '@/i18n/LangProvider'

export function KundliMatchPage() {
  const { hi } = useLang()

  return (
    <FeaturePageShell route="/kundli-match">
      <RequireAuth>
        <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
          {hi ?
            'मोबाइल ऐप के “कुंडली मिलान” स्क्रीन जैसा — 36 गुण, मंगल दोष, AI सरल व्याख्या।'
          : 'Same as the app Kundli Milan screen — 36 guna, Mangal dosha, AI plain-language explanation.'}
        </p>
        <KundliMatchAppView />
      </RequireAuth>
    </FeaturePageShell>
  )
}
