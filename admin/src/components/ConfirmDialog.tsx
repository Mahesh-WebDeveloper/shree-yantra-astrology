import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-h-[min(90svh,36rem)] overflow-y-auto rounded-t-2xl border border-border bg-card p-4 text-card-foreground shadow-xl sm:max-w-md sm:rounded-xl sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 break-words text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
