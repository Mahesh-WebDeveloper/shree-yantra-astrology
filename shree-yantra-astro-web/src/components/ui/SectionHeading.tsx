import { cn } from '@/lib/cn'
import { OrnamentLine } from '@/components/ui/OrnamentLine'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  align = 'left',
  ornament = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
  align?: 'left' | 'center'
  ornament?: boolean
}) {
  return (
    <header className={cn('home-section-heading mb-8 sm:mb-10', align === 'center' && 'text-center', className)}>
      {eyebrow ? (
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--sy-accent)]">{eyebrow}</p>
      ) : null}
      {ornament ? <OrnamentLine className={cn('mt-4', align === 'center' ? 'justify-center' : 'justify-start')} /> : null}
      <h2
        className={cn(
          'mt-2 text-balance font-playfair text-[clamp(1.55rem,4vw,2.25rem)] font-bold leading-[1.12] tracking-tight text-[var(--sy-text)]',
          align === 'center' && 'mx-auto max-w-2xl',
          ornament && 'mt-5',
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-3 max-w-xl text-[16px] leading-[1.7] text-[var(--sy-text-soft)] sm:text-[17px]',
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
