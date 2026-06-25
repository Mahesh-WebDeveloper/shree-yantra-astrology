import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

export function LoadingRows() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  )
}

export function LoadingPanel({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-border bg-card text-card-foreground">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  )
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      <p>{message}</p>
      {onRetry ? <Button type="button" className="mt-3" variant="secondary" onClick={onRetry}>Retry</Button> : null}
    </div>
  )
}
