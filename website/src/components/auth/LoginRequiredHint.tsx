import { Link } from 'react-router-dom'
import { useLang } from '@/i18n/LangProvider'

/** Shown when a paid /api route returns 401 — same as needing OTP login on mobile. */
export function LoginRequiredHint({ feature }: { feature?: string }) {
  const { hi } = useLang()
  return (
    <div className="login-required-hint sy-stat-tile">
      <p className="font-semibold text-[var(--sy-accent)]">
        {hi ? 'लॉगिन ज़रूरी' : 'Sign-in required'}
      </p>
      <p className="mt-2 text-sm text-[var(--sy-text-soft)]">
        {hi ? (
          <>
            {feature ? `${feature} ` : 'यह सेवा '}के लिए ऐप की तरह मोबाइल OTP से लॉगिन करें —{' '}
            <Link to="/profile" className="font-semibold text-[var(--sy-accent)] underline">
              प्रोफ़ाइल
            </Link>
            .
          </>
        ) : (
          <>
            {feature ? `${feature} needs` : 'This feature needs'} the same mobile OTP login as the app — open{' '}
            <Link to="/profile" className="font-semibold text-[var(--sy-accent)] underline">
              Profile
            </Link>
            .
          </>
        )}
      </p>
    </div>
  )
}
