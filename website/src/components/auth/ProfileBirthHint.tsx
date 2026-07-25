import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { useLang } from '@/i18n/LangProvider'

/** App-style: data comes from saved profile, not a repeated form on every screen. */
export function ProfileBirthHint() {
  const { hi } = useLang()
  const { user, profileComplete } = useAuth()
  if (!profileComplete) return null
  return (
    <p className="mb-4 text-sm text-[var(--sy-text-soft)]">
      {hi ? 'जन्म विवरण' : 'Birth details'}:{' '}
      <span className="font-medium text-[var(--sy-text)]">{user?.name || '—'}</span>
      {user?.profile?.place ? ` · ${user.profile.place}` : null}.{' '}
      <Link to="/profile" className="font-semibold text-[var(--sy-accent)] hover:underline">
        {hi ? 'प्रोफ़ाइल में बदलें' : 'Edit in profile'}
      </Link>
    </p>
  )
}
