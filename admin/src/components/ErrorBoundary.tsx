import { Component, type ErrorInfo, type ReactNode } from 'react'

// Top-level guard: one bad/partial API response must not blank the whole admin SPA.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // detail stays in console for debugging; users see a friendly screen
    console.error('Admin error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-svh place-items-center bg-background p-6 text-center text-foreground">
          <div className="max-w-md space-y-3">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              This page hit an unexpected error. Please reload — if it keeps happening, check that the backend is reachable.
            </p>
            <button
              onClick={() => { this.setState({ error: null }); location.reload() }}
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
