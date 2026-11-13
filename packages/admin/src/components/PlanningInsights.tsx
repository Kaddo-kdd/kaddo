import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlanningInsights } from '../lib/api'
import type { AttentionItem, AttentionSeverity, AttentionType, InsightArtifactKind } from '../lib/api'

// Planning Progress & Execution Insights (WI-081 + WI-082) — read-only. Surfaces the three dimensions
// SEPARATELY (Planning Coverage, Delivery Progress, Outcome Verification), a COMPACT Needs-attention summary
// that keeps the main Planning blocks visible, and a full attention explorer (in-place drawer) with filters,
// grouping and per-finding context (diagnostic, impact, next step). It never mutates anything; "ready" is
// shown distinct from lifecycle `completed`, and a declared materialization is shown distinct from a
// validated one. All numbers come from Core's projection — nothing is invented here.

const COMPACT_LIMIT = 5

const SEV_COLOR: Record<string, string> = { blocking: 'var(--danger)', warning: 'var(--warning, #b7791f)', info: 'var(--foreground-muted)' }
const TYPE_LABEL: Record<AttentionType, string> = {
  dependency: 'Dependency', 'incomplete-delivery': 'Incomplete delivery', 'pending-candidates': 'Pending candidate',
  'unverified-outcome': 'Unverified outcome', provenance: 'Provenance', 'declared-risk': 'Declared risk',
}
const SEV_LABEL: Record<AttentionSeverity, string> = { blocking: 'Blocking', warning: 'Warning', info: 'Info' }
const KIND_LABEL: Record<InsightArtifactKind, string> = { plan: 'Plan', epic: 'Epic', initiative: 'Initiative', 'work-item': 'Work Item' }
const READINESS_COLOR: Record<string, string> = {
  READY_TO_COMPLETE: 'var(--primary)', READY_WITH_EXCEPTIONS: 'var(--warning, #b7791f)',
  NEEDS_WORK: 'var(--foreground-muted)', BLOCKED: 'var(--danger)',
}

export function PlanningInsights({ onOpen }: { onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  const q = useQuery({ queryKey: ['planning', 'insights'], queryFn: getPlanningInsights, retry: false })
  const [typeFilter, setTypeFilter] = useState<AttentionType | 'all'>('all')
  const [kindFilter, setKindFilter] = useState<InsightArtifactKind | 'all'>('all')
  const [explorerOpen, setExplorerOpen] = useState(false)

  const ins = q.data
  const filtered = useMemo(() => {
    if (!ins) return []
    return ins.attention.filter((a) => (typeFilter === 'all' || a.type === typeFilter) && (kindFilter === 'all' || a.artifactKind === kindFilter))
  }, [ins, typeFilter, kindFilter])

  if (q.isLoading) return <section style={section}><H>Execution Insights</H><p style={muted}>Computing insights…</p></section>
  if (q.error) return <section style={section}><H>Execution Insights</H><p style={{ ...muted, color: 'var(--danger)' }}>{(q.error as Error).message}</p></section>
  if (!ins) return null

  const hasAny = ins.counts.plans && (Object.keys(ins.counts.plans).length + Object.keys(ins.counts.epics).length + Object.keys(ins.counts.initiatives).length) > 0
  if (!hasAny && ins.delivery.independent.total === 0) {
    return <section style={section}><H>Execution Insights</H><p style={muted}>No Plans, Epics or Initiatives yet — nothing to summarize. Insights appear as soon as planning work exists.</p></section>
  }

  const num = (n: number) => (ins.outcome.total === 0 && n === 0 ? '—' : n)
  const cov = ins.coverage
  const totalFindings = ins.attention.length
  const distinctArtifacts = new Set(ins.attention.map((a) => a.artifactId)).size
  const compact = filtered.slice(0, COMPACT_LIMIT)
  const hiddenCount = filtered.length - compact.length

  return (
    <section style={section}>
      <H>Execution Insights</H>

      {/* Three attention indicators — each counts a distinct family, never summed into one score. */}
      <div style={indicators}>
        <Indicator label="Blocking issues" value={ins.indicators.blockingIssues} tone={ins.indicators.blockingIssues > 0 ? 'blocking' : 'muted'} hint="Blocked deps, broken relations & provenance" />
        <Indicator label="Outcome needs verification" value={ins.indicators.outcomeNeedsVerification} tone={ins.indicators.outcomeNeedsVerification > 0 ? 'warning' : 'muted'} hint="Declared criteria without valid evidence" />
        <Indicator label="Milestones needing review" value={ins.indicators.milestonesNeedingReview} tone={ins.indicators.milestonesNeedingReview > 0 ? 'warning' : 'muted'} hint="Exit criteria pending / failed / ambiguous" />
      </div>

      {/* The three dimensions, kept separate (AC-03). */}
      <div style={dims}>
        <Dim title="Planning Coverage" sub={cov.unresolved > 0 ? 'declared vs validated references' : 'candidates materialized / total'}>
          {cov.totalCandidates === 0 ? <Big>—</Big> : <Big>{cov.materialized}/{cov.totalCandidates}</Big>}
          {cov.unresolved > 0
            ? <small style={{ color: 'var(--warning, #b7791f)' }}>{cov.validated} validated · {cov.unresolved} declared but unresolved</small>
            : (cov.pending > 0 && <small style={muted}>{cov.pending} pending to materialize</small>)}
        </Dim>
        <Dim title="Delivery Progress" sub="distinct Work Items, deduped">
          <Big>{ins.delivery.associated.byState?.completed ?? 0}/{ins.delivery.associated.total}</Big>
          <small style={muted}>{ins.delivery.associated.blocked} blocked · {ins.delivery.independent.total} independent</small>
        </Dim>
        <Dim title="Outcome Verification" sub="evidence-based, distinct from delivery">
          {ins.outcome.total === 0 ? <Big>—</Big> : <Big>{ins.outcome.passed}/{ins.outcome.total}</Big>}
          <small style={muted}>{num(ins.outcome.failed)} failed · {num(ins.outcome.notVerified)} not verified · {num(ins.outcome.ambiguous)} ambiguous{ins.outcome.stale > 0 ? ` · ${ins.outcome.stale} stale` : ''}</small>
        </Dim>
      </div>

      {/* Compact Needs attention — at most 5 rows, honest totals, filters kept, full explorer behind a button. */}
      <div style={{ marginTop: 18 }}>
        <div style={attnHead}>
          <h4 style={h4}>Needs attention <span style={muted}>({totalFindings})</span></h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select aria-label="Filter by signal type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AttentionType | 'all')} style={select}>
              <option value="all">All signals</option>
              {(Object.keys(TYPE_LABEL) as AttentionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
            <select aria-label="Filter by artifact type" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as InsightArtifactKind | 'all')} style={select}>
              <option value="all">All artifacts</option>
              {(Object.keys(KIND_LABEL) as InsightArtifactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </div>
        </div>
        <p style={{ ...muted, fontSize: 12, margin: '0 0 8px' }}>
          {totalFindings} finding{totalFindings === 1 ? '' : 's'} · {distinctArtifacts} artifact{distinctArtifacts === 1 ? '' : 's'}
          {filtered.length !== totalFindings ? ` · ${filtered.length} match filters` : ''}
          {compact.length > 0 ? ` · showing ${compact.length}` : ''}
        </p>
        {filtered.length === 0 ? (
          <p style={muted}>{totalFindings === 0 ? 'Nothing needs attention right now.' : 'No signals match these filters.'}</p>
        ) : (
          <>
            <ul style={list}>
              {compact.map((a, i) => <CompactRow key={i} a={a} onOpen={onOpen} />)}
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button style={viewAllBtn} onClick={() => setExplorerOpen(true)}>View all findings</button>
              {hiddenCount > 0 && <span style={{ ...muted, fontSize: 12 }}>{hiddenCount} more not shown here</span>}
            </div>
          </>
        )}
      </div>

      {/* Milestone & outcome insights. */}
      {ins.milestones.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={h4}>Milestones & outcomes</h4>
          <ul style={list}>
            {ins.milestones.map((m) => (
              <li key={`${m.planId}:${m.id}`} style={rowItem}>
                <div style={{ display: 'grid', gap: 2 }}>
                  <span><button style={linkBtn} onClick={() => onOpen('plan', m.planId)}>{m.planId}</button> · <strong>{m.id}</strong> {m.title} <span style={muted}>({m.epics} epic{m.epics === 1 ? '' : 's'})</span></span>
                  <small style={{ color: m.needsReview ? 'var(--warning, #b7791f)' : 'var(--foreground-muted)' }}>
                    Exit criteria {m.outcome.passed}/{m.outcome.total} verified{m.needsReview ? ' · needs review' : ''}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Readiness vs delivery vs outcome — readiness is NOT lifecycle completed (AC-10). */}
      {ins.entities.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={h4}>Readiness</h4>
          <ul style={list}>
            {ins.entities.map((e) => (
              <li key={e.id} style={rowItem}>
                <div style={{ display: 'grid', gap: 2 }}>
                  <span>
                    <button style={linkBtn} onClick={() => onOpen(e.kind, e.id)}>{e.id}</button> {e.title}
                    <span style={muted}> · {KIND_LABEL[e.kind]} · status {e.status}</span>
                  </span>
                  <small style={muted}>
                    <span style={{ color: READINESS_COLOR[e.readiness] }}>{e.readiness.replace(/_/g, ' ')}</span>
                    {' · '}delivery {e.delivery.completed}/{e.delivery.total}{e.delivery.blocked > 0 ? ` (${e.delivery.blocked} blocked)` : ''}
                    {' · '}outcome {e.outcome.passed}/{e.outcome.total}{e.outcome.needsVerification > 0 ? ` (${e.outcome.needsVerification} to verify)` : ''}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <p style={{ ...muted, fontSize: 12, marginTop: 6 }}>“Ready” means human approval can be requested — it is not the same as a <code>completed</code> lifecycle status.</p>
        </div>
      )}

      {explorerOpen && <AttentionExplorer items={ins.attention} onOpen={onOpen} onClose={() => setExplorerOpen(false)} />}
    </section>
  )
}

/** Compact row — severity, type, artifact link and the one-line reason. Full context lives in the explorer. */
function CompactRow({ a, onOpen }: { a: AttentionItem; onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  return (
    <li style={rowItem}>
      <div style={{ display: 'grid', gap: 2 }}>
        <span>
          <SevTag severity={a.severity} />
          {' '}<span style={{ color: SEV_COLOR[a.severity], fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>{TYPE_LABEL[a.type]}</span>
          {' · '}
          {a.link ? <button style={linkBtn} onClick={() => onOpen(a.artifactKind, a.artifactId)}>{a.artifactId}</button> : <span className="font-mono">{a.artifactId}</span>}
          {' '}<span style={muted}>{a.title}</span>
        </span>
        <small style={muted}>{a.reason}</small>
      </div>
    </li>
  )
}

/** Full attention explorer — an in-place accessible drawer (no new route). Filters by signal/artifact/
 * severity, groups by artifact, and shows each finding's diagnostic, impact, next step and a review action.
 * Read-only: no dismiss, resolve or auto-fix. Counts stay honest when filtered. */
function AttentionExplorer({ items, onOpen, onClose }: { items: AttentionItem[]; onOpen: (kind: InsightArtifactKind, id: string) => void; onClose: () => void }) {
  const [typeFilter, setTypeFilter] = useState<AttentionType | 'all'>('all')
  const [kindFilter, setKindFilter] = useState<InsightArtifactKind | 'all'>('all')
  const [sevFilter, setSevFilter] = useState<AttentionSeverity | 'all'>('all')
  const [grouped, setGrouped] = useState(true)
  const closeRef = useRef<HTMLButtonElement>(null)
  const prevFocus = useRef<Element | null>(null)

  useEffect(() => {
    prevFocus.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus()
    }
  }, [onClose])

  const filtered = useMemo(
    () => items.filter((a) =>
      (typeFilter === 'all' || a.type === typeFilter) &&
      (kindFilter === 'all' || a.artifactKind === kindFilter) &&
      (sevFilter === 'all' || a.severity === sevFilter)),
    [items, typeFilter, kindFilter, sevFilter],
  )

  // Group by artifact, preserving Core's deterministic order within and across groups.
  const groups = useMemo(() => {
    const order: string[] = []
    const byId = new Map<string, AttentionItem[]>()
    for (const a of filtered) {
      if (!byId.has(a.artifactId)) { byId.set(a.artifactId, []); order.push(a.artifactId) }
      byId.get(a.artifactId)!.push(a)
    }
    return order.map((id) => ({ id, items: byId.get(id)! }))
  }, [filtered])

  const distinctArtifacts = groups.length

  return (
    <div style={overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label="All findings" style={drawer}>
        <div style={drawerHead}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16 }}>All findings</h3>
            <p style={{ ...muted, fontSize: 12, margin: '2px 0 0' }}>{filtered.length} finding{filtered.length === 1 ? '' : 's'} · {distinctArtifacts} artifact{distinctArtifacts === 1 ? '' : 's'}{filtered.length !== items.length ? ` · ${items.length} total` : ''}</p>
          </div>
          <button ref={closeRef} style={closeBtn} aria-label="Close all findings" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 0 12px' }}>
          <select aria-label="Explorer: filter by signal type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AttentionType | 'all')} style={select}>
            <option value="all">All signals</option>
            {(Object.keys(TYPE_LABEL) as AttentionType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select aria-label="Explorer: filter by artifact type" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as InsightArtifactKind | 'all')} style={select}>
            <option value="all">All artifacts</option>
            {(Object.keys(KIND_LABEL) as InsightArtifactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <select aria-label="Explorer: filter by severity" value={sevFilter} onChange={(e) => setSevFilter(e.target.value as AttentionSeverity | 'all')} style={select}>
            <option value="all">All severities</option>
            {(Object.keys(SEV_LABEL) as AttentionSeverity[]).map((s) => <option key={s} value={s}>{SEV_LABEL[s]}</option>)}
          </select>
          <select aria-label="Group findings" value={grouped ? 'artifact' : 'none'} onChange={(e) => setGrouped(e.target.value === 'artifact')} style={select}>
            <option value="artifact">Group by artifact</option>
            <option value="none">Flat list</option>
          </select>
        </div>

        <div style={drawerBody}>
          {filtered.length === 0 ? (
            <p style={muted}>{items.length === 0 ? 'Nothing needs attention right now.' : 'No findings match these filters.'}</p>
          ) : grouped ? (
            groups.map((g) => (
              <div key={g.id} style={groupCard}>
                <div style={groupHead}>
                  <button style={linkBtn} onClick={() => onOpen(g.items[0].artifactKind, g.id)}>{g.id}</button>
                  <span style={muted}> · {KIND_LABEL[g.items[0].artifactKind]} · {g.items.length} finding{g.items.length === 1 ? '' : 's'}</span>
                </div>
                {g.items.map((a, i) => <FindingDetail key={i} a={a} onOpen={onOpen} />)}
              </div>
            ))
          ) : (
            filtered.map((a, i) => <div key={i} style={groupCard}><FindingDetail a={a} onOpen={onOpen} /></div>)
          )}
        </div>
        <p style={{ ...muted, fontSize: 12, margin: '10px 0 0' }}>Read-only — these findings navigate to the canonical detail. No dismiss, resolve or auto-fix here.</p>
      </div>
    </div>
  )
}

/** One finding with full context: signal, severity, diagnostic, impact, next step and a review action. */
function FindingDetail({ a, onOpen }: { a: AttentionItem; onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  const accent = SEV_COLOR[a.severity]
  return (
    <div style={{ ...finding, borderLeft: `3px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: accent, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>{TYPE_LABEL[a.type]}</span>
        <SevTag severity={a.severity} />
      </div>
      <div style={{ fontSize: 13, marginTop: 4 }}><Label>Diagnostic</Label> {a.reason}</div>
      {a.impact && <div style={{ ...muted, fontSize: 13, marginTop: 2 }}><Label>Impact</Label> {a.impact}</div>}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {a.link
          ? <button style={actionBtn} onClick={() => onOpen(a.artifactKind, a.artifactId)}>{a.nextStep ?? `Review ${KIND_LABEL[a.artifactKind]}`} ↗</button>
          : <span style={{ ...muted, fontSize: 12 }}>{a.nextStep ?? 'Manual review'} — no linked destination</span>}
      </div>
    </div>
  )
}

function SevTag({ severity }: { severity: AttentionSeverity }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999, color: SEV_COLOR[severity], border: `1px solid ${SEV_COLOR[severity]}` }}>{SEV_LABEL[severity]}</span>
}
function Label({ children }: { children: React.ReactNode }) { return <strong style={{ fontWeight: 600 }}>{children}:</strong> }

function Indicator({ label, value, tone, hint }: { label: string; value: number; tone: 'blocking' | 'warning' | 'muted'; hint: string }) {
  return (
    <div style={indicator}>
      <div style={{ fontSize: 26, fontWeight: 700, color: SEV_COLOR[tone] }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--foreground-muted)' }}>{hint}</div>
    </div>
  )
}
function Dim({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={dim}>
      <div style={{ fontSize: 12, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{title}</div>
      <div style={{ display: 'grid', gap: 2, marginTop: 4 }}>{children}</div>
      <div style={{ fontSize: 11, color: 'var(--foreground-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}
function Big({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 22, fontWeight: 700 }}>{children}</div> }
function H({ children }: { children: React.ReactNode }) { return <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: '0 0 12px' }}>{children}</h3> }

const section: CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', padding: 16, marginTop: 16 }
const indicators: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }
const indicator: CSSProperties = { padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', display: 'grid', gap: 2 }
const dims: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 12 }
const dim: CSSProperties = { padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)' }
const attnHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }
const h4: CSSProperties = { margin: 0, fontSize: 14 }
const list: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }
const rowItem: CSSProperties = { padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const linkBtn: CSSProperties = { background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }
const select: CSSProperties = { padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit' }
const viewAllBtn: CSSProperties = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 16, zIndex: 50, overflowY: 'auto' }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, width: 'min(680px, 100%)', margin: '24px 0', boxSizing: 'border-box' }
const drawerHead: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }
const drawerBody: CSSProperties = { display: 'grid', gap: 10 }
const closeBtn: CSSProperties = { background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '6px 10px', flexShrink: 0 }
const groupCard: CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, background: 'var(--background)' }
const groupHead: CSSProperties = { fontWeight: 600, fontSize: 14, marginBottom: 8 }
const finding: CSSProperties = { padding: '6px 0 6px 10px', margin: '6px 0' }
const actionBtn: CSSProperties = { padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--primary)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }
