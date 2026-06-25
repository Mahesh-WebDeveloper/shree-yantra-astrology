import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
}) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
    accent: 'bg-accent/15 text-accent',
  }
  return <span className={cn('inline-flex rounded px-2 py-1 text-xs font-medium', tones[tone])}>{children}</span>
}
