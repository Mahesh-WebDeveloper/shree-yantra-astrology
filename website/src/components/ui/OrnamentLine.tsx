import { cn } from '@/lib/cn'

export function OrnamentLine({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--sy-gold-strong)]/50 sm:w-20" />
      <span className="text-[11px] text-[var(--sy-gold-strong)] opacity-90">✦</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--sy-gold-strong)]/50 sm:w-20" />
    </div>
  )
}

export function BrandOrnament({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="28"
      height="10"
      viewBox="0 0 28 10"
      className={flip ? 'scale-x-[-1]' : ''}
      aria-hidden
    >
      <path d="M0 5 Q7 0 14 5 T28 5" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--sy-gold)]" />
    </svg>
  )
}
