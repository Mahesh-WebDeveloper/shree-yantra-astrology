import { useLang } from '@/i18n/LangProvider'

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  const { hi } = useLang()
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-8 text-center ${className ?? ''}`}>
      <span
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--sy-glass-border)] text-[var(--sy-text-muted)]"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4.5M12 16h.01" strokeLinecap="round" />
        </svg>
      </span>
      <p className="max-w-xs text-sm text-[var(--sy-text-muted)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-[var(--sy-glass-border)] px-4 py-2 text-[13px] font-semibold text-[var(--sy-text)] transition hover:border-[var(--sy-accent)]"
        >
          {hi ? 'पुनः प्रयास करें' : 'Try again'}
        </button>
      ) : null}
    </div>
  )
}
