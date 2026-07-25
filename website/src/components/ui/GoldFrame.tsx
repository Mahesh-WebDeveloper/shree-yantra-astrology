import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { Panel } from '@/components/ui/Panel'

export function GoldFrame({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <Panel className={cn(className, innerClassName)} hover={false}>
      {children}
    </Panel>
  )
}
