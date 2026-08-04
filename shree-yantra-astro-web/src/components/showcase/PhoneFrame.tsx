import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function PhoneFrame({
  children,
  className,
  glow = true,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div className={cn('showcase-phone', glow && 'showcase-phone--glow', className)}>
      <div className="showcase-phone__bezel">
        <div className="showcase-phone__notch" aria-hidden />
        <div className="showcase-phone__screen">{children}</div>
      </div>
    </div>
  )
}
