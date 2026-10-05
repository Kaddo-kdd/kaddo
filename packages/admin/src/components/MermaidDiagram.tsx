import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [fullscreen, setFullscreen] = useState(false)
  const rawId = useId()
  const renderId = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`

  // Close the fullscreen overlay on Escape.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

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
    <>
      <div className="mermaid-diagram" style={{ position: 'relative', margin: '12px 0' }}>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label="View diagram fullscreen"
          title="View fullscreen"
          style={{
            position: 'absolute', top: 6, right: 6, zIndex: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, padding: 0, cursor: 'pointer',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', color: 'var(--foreground-muted)', fontSize: 14, lineHeight: 1,
          }}
        >
          ⛶
        </button>
        <div
          style={{ overflowX: 'auto', textAlign: 'center', cursor: 'zoom-in' }}
          onClick={() => setFullscreen(true)}
          // Safe: SVG produced by mermaid under securityLevel 'strict' (sanitized, no scripts).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {fullscreen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Diagram, fullscreen"
          onClick={() => setFullscreen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'color-mix(in srgb, var(--background, #141b2d) 85%, black)',
            backdropFilter: 'blur(2px)', padding: 24, boxSizing: 'border-box',
          }}
        >
          <style>{'.kaddo-mermaid-fs svg{width:100%!important;height:100%!important;max-width:95vw!important;max-height:88vh!important;}'}</style>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setFullscreen(false) }}
            aria-label="Close fullscreen"
            title="Close (Esc)"
            style={{
              position: 'absolute', top: 16, right: 20, width: 40, height: 40,
              border: 'none', borderRadius: '50%', cursor: 'pointer',
              background: 'var(--primary)', color: 'var(--primary-foreground, #141b2d)', fontSize: 20, lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div
            className="kaddo-mermaid-fs"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '95vw', height: '88vh' }}
            // Safe: same sanitized SVG from mermaid strict mode.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
