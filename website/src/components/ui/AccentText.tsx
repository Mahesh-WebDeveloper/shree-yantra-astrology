import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Reliable accent text — avoids broken background-clip blocks in some browsers/themes. */
export function AccentText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('showcase-accent-text', className)}>{children}</span>
}
