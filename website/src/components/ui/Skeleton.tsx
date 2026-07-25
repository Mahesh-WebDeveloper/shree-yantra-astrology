import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-[var(--sy-line)]/40', className)}
      aria-hidden
    />
  )
}
