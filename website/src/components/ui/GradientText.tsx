import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('sy-gradient-text font-display font-bold tracking-wide', className)}>{children}</span>
}
