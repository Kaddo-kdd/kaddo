import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

// WI-085 — a reusable, accessible section navigation for detail pages (Plan/Epic/Initiative). It turns one
// long scrolling column into an overview-first, detail-on-demand layout: only the active section's panel is
// mounted (so heavy sections like Collaboration never render until opened). The active section is mirrored
// to the URL hash so deep links and back/forward restore it (AC-06). Keyboard: arrows/Home/End move between
// tabs, the panel is focusable, roles and aria-selected are set (AC-20). It renders presentation only — the
// data and actions inside each section stay exactly as the caller provides them.

export type Section = {
  id: string
  label: string
  /** Optional count shown next to the label (e.g. number of milestones). */
  count?: number
  /** Rendered only while this section is active. */
  render: () => ReactNode
}

function readHash(ids: string[], fallback: string): string {
  try {
    const h = window.location.hash.replace(/^#/, '')
    return ids.includes(h) ? h : fallback
  } catch { return fallback }
}

export function SectionTabs({ sections, ariaLabel }: { sections: Section[]; ariaLabel: string }) {
  const ids = sections.map((s) => s.id)
  const [active, setActive] = useState<string>(() => readHash(ids, ids[0] ?? ''))
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Keep the active section in sync with the URL hash, for deep links and back/forward (AC-06).
  useEffect(() => {
    const onHash = () => setActive(readHash(ids, ids[0] ?? ''))
    window.addEventListener('popstate', onHash)
    window.addEventListener('hashchange', onHash)
    return () => { window.removeEventListener('popstate', onHash); window.removeEventListener('hashchange', onHash) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')])

  const select = useCallback((id: string, focus = false) => {
    setActive(id)
    try { history.replaceState(null, '', `#${id}`) } catch { /* ignore */ }
    if (focus) tabRefs.current[id]?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % sections.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + sections.length) % sections.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = sections.length - 1
    else return
    e.preventDefault()
    select(sections[next].id, true)
  }

  if (sections.length === 0) return null
  const current = sections.find((s) => s.id === active) ?? sections[0]

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} style={tablist}>
        {sections.map((s, i) => {
          const selected = s.id === current.id
          return (
            <button
              key={s.id}
              ref={(el) => { tabRefs.current[s.id] = el }}
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={selected}
              aria-controls={`panel-${s.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(s.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              style={{ ...tab, ...(selected ? tabActive : null) }}
            >
              {s.label}{typeof s.count === 'number' && <span style={countStyle}>{s.count}</span>}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`} tabIndex={0} style={panel}>
        {current.render()}
      </div>
    </div>
  )
}

const tablist: CSSProperties = { display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginTop: 12 }
const tab: CSSProperties = { padding: '8px 14px', border: 'none', borderBottom: '2px solid transparent', background: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', font: 'inherit', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }
const tabActive: CSSProperties = { color: 'var(--foreground)', borderBottomColor: 'var(--primary)', fontWeight: 600 }
const countStyle: CSSProperties = { fontSize: 12, color: 'var(--foreground-muted)', background: 'var(--background)', borderRadius: 999, padding: '0 7px', lineHeight: '18px' }
const panel: CSSProperties = { outline: 'none', paddingTop: 4 }
