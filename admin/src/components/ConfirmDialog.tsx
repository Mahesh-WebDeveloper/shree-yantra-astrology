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
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 size-5 text-destructive" />
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
