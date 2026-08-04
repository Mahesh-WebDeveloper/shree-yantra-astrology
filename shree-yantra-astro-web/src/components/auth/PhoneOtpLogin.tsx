import { MobileAuthScreen } from '@/components/auth/MobileAuthScreen'
import { useAuth } from '@/context/AuthProvider'
import type { AuthUser } from '@/lib/api'

export function PhoneOtpLogin({
  defaultName,
  onVerified,
}: {
  defaultName?: string
  onVerified?: (r: { user: AuthUser; isNew: boolean; profileComplete: boolean }) => void
}) {
  const { refreshUser } = useAuth()

  return (
    <section className="sy-stat-tile mb-6">
      <MobileAuthScreen
        compact
        defaultName={defaultName}
        onVerified={async (r) => {
          await refreshUser()
          onVerified?.({ user: r.user, isNew: r.isNew, profileComplete: r.profileComplete })
        }}
      />
    </section>
  )
}
