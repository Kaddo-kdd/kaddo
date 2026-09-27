import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; section?: string }
type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  private reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <div style={{
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius)',
            padding: 16,
          }}>
            <strong>{this.props.section ? `${this.props.section} failed to render` : 'Something went wrong'}</strong>
            <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.reset}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                color: 'var(--foreground)',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function RouteErrorFallback({ error, reset }: { error: unknown; reset?: () => void }) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
  return (
    <div style={{ padding: 24 }}>
      <div style={{
        background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
        border: '1px solid var(--danger)',
        borderRadius: 'var(--radius)',
        padding: 16,
      }}>
        <strong>This section could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>
          {message}
        </p>
        <button
          onClick={reset ?? (() => window.location.reload())}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'inherit',
            color: 'var(--foreground)',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  )
}
