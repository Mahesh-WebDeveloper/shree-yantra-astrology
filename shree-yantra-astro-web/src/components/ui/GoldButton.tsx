import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
}

export function GoldButton({ children, className, variant = 'primary', size = 'md', ...props }: Props) {
  const sizes = size === 'lg' ? 'px-7 py-3.5 text-[15px]' : 'px-5 py-2.5 text-sm'

  if (variant === 'ghost') {
    return (
      <button
        type="button"
        className={cn(
          sizes,
          'rounded-xl font-medium text-[var(--sy-text-muted)] transition hover:text-[var(--sy-text)]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        className={cn(
          sizes,
          'sy-btn-secondary rounded-xl font-semibold transition active:scale-[0.98]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        sizes,
        'sy-btn-primary rounded-xl font-semibold transition active:scale-[0.98]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
