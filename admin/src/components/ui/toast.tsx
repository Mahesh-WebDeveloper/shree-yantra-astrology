/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type Toast = { id: number; title: string; tone: 'success' | 'error' }
type ToastContextValue = {
  success: (title: string) => void
  error: (title: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((title: string, tone: Toast['tone']) => {
    const id = Date.now()
    setToasts((current) => [...current, { id, title, tone }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200)
  }, [])

  const value = useMemo(
    () => ({
      success: (title: string) => push(title, 'success'),
      error: (title: string) => push(title, 'error'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-2">
        {toasts.map((toast) => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : XCircle
          return (
            <div key={toast.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3 text-sm text-card-foreground shadow-lg">
              <Icon className={toast.tone === 'success' ? 'size-5 text-success' : 'size-5 text-destructive'} />
              <span>{toast.title}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
