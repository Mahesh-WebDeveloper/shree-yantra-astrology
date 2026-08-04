import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MobileAuthScreen } from '@/components/auth/MobileAuthScreen'
import { useAuth } from '@/context/AuthProvider'
import { useLang } from '@/i18n/LangProvider'

function safeReturnTo(raw: string | null) {
  if (!raw) return '/kundli'
  try {
    const path = decodeURIComponent(raw)
    if (path.startsWith('/') && !path.startsWith('//')) return path
  } catch {
    /* ignore */
  }
  return '/kundli'
}

export function SignInPage() {
  const { hi } = useLang()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const { refreshUser } = useAuth()

  return (
    <div className="auth-page min-h-screen">
      <div className="auth-page-inner">
        <Link to="/" className="auth-page-back">
          ← {hi ? 'होम' : 'Home'}
        </Link>
        <MobileAuthScreen
          onVerified={async (r) => {
            await refreshUser()
            if (!r.profileComplete) {
              navigate(`/onboarding/birth?returnTo=${encodeURIComponent(returnTo)}`, { replace: true })
            } else {
              navigate(returnTo, { replace: true })
            }
          }}
        />
      </div>
    </div>
  )
}
