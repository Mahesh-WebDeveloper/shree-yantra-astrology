import type { ReactNode } from 'react'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-5">
      <div className="min-w-0">
        <h1 className="text-balance text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex w-full flex-col gap-2 [&>button]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>button]:w-auto">{action}</div> : null}
    </div>
  )
}
