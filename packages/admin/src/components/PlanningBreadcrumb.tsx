import { type CSSProperties } from 'react'
import { useRouter } from '@tanstack/react-router'

// WI-088 — contextual location + return path for a detail opened from Planning. The `back` link restores the
// exact origin (path + hash → the original tab/filter via SectionTabs). The `crumbs` are the entity's REAL
// canonical ancestors (never invented): a milestone is shown embedded in its Plan, not as its own route, and
// a project without a parent simply shows a shorter chain. Reused by Plan/Epic/Initiative/Work Item detail.

export type Crumb = { label: string; to?: string; hint?: string; current?: boolean }

export function PlanningBreadcrumb({ crumbs, back }: { crumbs: Crumb[]; back?: { from: string; label?: string } }) {
  const router = useRouter()
  const go = (path?: string) => { if (path) router.history.push(path) }
  if (crumbs.length === 0 && !back) return null
  return (
    <nav aria-label="Planning location" style={wrap}>
      <ol style={list}>
        {crumbs.map((c, i) => (
          <li key={i} style={item}>
            {c.to && !c.current
              ? <button style={link} onClick={() => go(c.to)}>{c.label}</button>
              : <span style={c.current ? current : plain} aria-current={c.current ? 'page' : undefined}>{c.label}</span>}
            {c.hint && <span style={hint}> {c.hint}</span>}
            {i < crumbs.length - 1 && <span aria-hidden="true" style={sep}>/</span>}
          </li>
        ))}
      </ol>
      {back && (
        <button style={backBtn} onClick={() => go(back.from)}>
          <span aria-hidden="true">←</span> Back to {back.label ?? 'origin'}
        </button>
      )}
    </nav>
  )
}

const wrap: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }
const list: CSSProperties = { listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: 0, padding: 0, fontSize: 13 }
const item: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 }
const link: CSSProperties = { background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }
const plain: CSSProperties = { color: 'var(--foreground-muted)' }
const current: CSSProperties = { color: 'var(--foreground)', fontWeight: 600 }
const hint: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 11 }
const sep: CSSProperties = { color: 'var(--foreground-muted)' }
const backBtn: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', font: 'inherit', fontSize: 13 }
