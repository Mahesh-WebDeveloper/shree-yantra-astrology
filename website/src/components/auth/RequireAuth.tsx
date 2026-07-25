import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthProvider'

/**
 * Paid / personal API routes — same as mobile: OTP login + saved birth profile.
 */
export function RequireAuth({
  children,
  requireBirthProfile = true,
}: {
  children: ReactNode
  requireBirthProfile?: boolean
}) {
  const { ready, loggedIn, profileComplete } = useAuth()
  const location = useLocation()
  const returnTo = encodeURIComponent(location.pathname + location.search)

  if (!ready) {
    return (
      <div className="py-12">
        <Skeleton className="mx-auto h-40 max-w-lg rounded-2xl" />
      </div>
    )
  }

  if (!loggedIn) {
    return <Navigate to={`/sign-in?returnTo=${returnTo}`} replace state={{ from: location.pathname }} />
  }

  if (requireBirthProfile && !profileComplete) {
    return <Navigate to={`/onboarding/birth?returnTo=${returnTo}`} replace />
  }

  return <>{children}</>
}
