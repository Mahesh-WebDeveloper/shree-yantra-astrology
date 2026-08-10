import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Website error boundary:', error, info)
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      ;(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
        description: error.message?.slice(0, 200),
        fatal: true,
      })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-[50vh] place-items-center p-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              This page hit an unexpected error. Please reload and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null })
                location.reload()
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
