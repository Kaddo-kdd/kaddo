import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

// Mermaid is initialized with securityLevel 'strict': it sanitizes its own SVG output (scripts and
// event handlers are stripped) and disables click interactions, so the generated SVG we inject is
// safe. The diagram source comes from the project's own Markdown knowledge, never from raw user HTML.
function detectTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark'
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light') return 'light'
  if (attr === 'dark') return 'dark'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initMermaid(theme: 'dark' | 'light') {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: theme === 'dark' ? 'dark' : 'default',
    fontFamily: 'inherit',
  })
}

/**
 * Render a single ```mermaid``` block as a diagram. Async + isolated: a syntax error in one diagram
 * falls back to showing its source and never breaks the page or other diagrams (WI-024).
 */
export function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(detectTheme)
  const rawId = useId()
  const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  // Re-render when the Admin theme changes (OS scheme or explicit data-theme).
  useEffect(() => {
    const update = () => setTheme(detectTheme())
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', update)
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq?.removeEventListener?.('change', update)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    initMermaid(theme)
    mermaid
      .render(renderId, code.trim())
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSvg(null)
          setError(e instanceof Error ? e.message : 'Mermaid could not render this diagram.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [code, theme, renderId])

  if (error) {
    return (
      <div
        role="img"
        aria-label="Diagram with a syntax error"
        style={{
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)',
          background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
          padding: 12,
          margin: '12px 0',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 8 }}>
          Diagram could not be rendered: {error}
        </div>
        <pre style={{ margin: 0, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', padding: 12, overflowX: 'auto', fontSize: 13 }}>
          <code className="font-mono">{code.trim()}</code>
        </pre>
      </div>
    )
  }

  if (!svg) {
    return <div style={{ fontSize: 13, color: 'var(--foreground-muted)', margin: '12px 0' }}>Rendering diagram…</div>
  }

  return (
    <div
      className="mermaid-diagram"
      style={{ overflowX: 'auto', margin: '12px 0', textAlign: 'center' }}
      // Safe: SVG produced by mermaid under securityLevel 'strict' (sanitized, no scripts).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
