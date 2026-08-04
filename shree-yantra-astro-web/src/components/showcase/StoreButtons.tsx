import { PLAY_STORE_URL } from '@/data/brandShowcase'
import { useLang } from '@/i18n/LangProvider'
import { cn } from '@/lib/cn'

export function StoreButtons({
  size = 'md',
  className,
}: {
  size?: 'md' | 'lg'
  className?: string
}) {
  const { hi } = useLang()
  const lg = size === 'lg'

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'showcase-store-btn inline-flex items-center gap-3 transition',
          lg ? 'px-5 py-3.5 text-sm' : 'px-4 py-2.5 text-[13px]',
        )}
      >
        <PlayIcon className={lg ? 'h-7 w-7' : 'h-6 w-6'} />
        <span className="text-left leading-tight">
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
            {hi ? 'Google Play पर' : 'Get it on'}
          </span>
          <span className={cn('block font-semibold tracking-tight', lg ? 'text-base' : 'text-sm')}>
            {hi ? 'ऐप डाउनलोड करें' : 'Google Play'}
          </span>
        </span>
      </a>
    </div>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.6 2.8c-.4.2-.6.6-.6 1.1v16.2c0 .5.2.9.6 1.1l10.2-9.2L3.6 2.8zm11.3 8.1 2.4-1.4-2.4-4.1-2.6 2.4 2.6 3.1zm.1 1.9-2.7 3.1 2.6 2.4 2.5-4.1-2.4-1.4zM4.9 20.8l8.1-4.6-2.6-3.1-5.5 7.7zm8.1-13L4.9 3.2l5.5 7.7 2.6-3.1z" />
    </svg>
  )
}

