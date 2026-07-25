import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Panel({
  children,
  className,
  padding = true,
  hover = false,
  style,
}: {
  children: ReactNode
  className?: string
  padding?: boolean
  hover?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      className={cn('sy-panel', padding && 'sy-panel-pad', hover && 'sy-panel-hover', className)}
      style={style}
    >
      {children}
    </div>
  )
}
