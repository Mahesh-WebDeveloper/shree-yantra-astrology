import { Link, useParams } from 'react-router-dom'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { MuhuratFinderAppView } from '@/components/muhurat/MuhuratFinderAppView'
import { useLang } from '@/i18n/LangProvider'

export function MuhuratFinderPage() {
  const { hi } = useLang()
  const { categoryKey = 'griha-pravesh' } = useParams()

  return (
    <FeaturePageShell route="/muhurat">
      <RequireAuth>
        <Link to="/muhurat" className="mb-4 inline-block text-sm text-[var(--sy-accent)] hover:underline">
          ← {hi ? 'सभी श्रेणियाँ' : 'All categories'}
        </Link>
        <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
          {hi ? 'मोबाइल MuhuratFinder स्क्रीन जैसा — स्थान, अवधि, नाम/जन्म विवरण, लाइव API।' : 'Same as the app Muhurat Finder — location, period, name/birth, live API.'}
        </p>
        <MuhuratFinderAppView categoryKey={categoryKey} />
      </RequireAuth>
    </FeaturePageShell>
  )
}
