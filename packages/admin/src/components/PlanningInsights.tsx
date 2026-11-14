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
  // WI-083: the compact summary shows up to five DISTINCT artifacts (not five findings), each with its
  // own finding count. Core already sorts attention deterministically, so first-occurrence order is
  // stable and severity-first.
  const groups = groupByArtifact(filtered)
  const topGroups = groups.slice(0, COMPACT_LIMIT)
  const hiddenArtifacts = groups.length - topGroups.length
  const isReady = (r: string) => r === 'READY_TO_COMPLETE' || r === 'READY_WITH_EXCEPTIONS'
  const readyCount = ins.entities.filter((e) => isReady(e.readiness)).length
  const needsWorkCount = ins.entities.filter((e) => e.readiness === 'NEEDS_WORK').length
  const blockedCount = ins.entities.filter((e) => e.readiness === 'BLOCKED').length
  const historicalGaps = ins.entities.filter((e) => e.historicalEvidenceGap).length

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
        {cov.unresolved > 0 ? (
          // Validated coverage leads when declarations are unresolved — a declared reference is not
          // integrity (WI-083 AC-07). The declared figure stays visible as detail, never hidden.
          <Dim title="Validated Coverage" sub="resolved references / candidates">
            {cov.totalCandidates === 0 ? <Big>—</Big> : <Big>{cov.validated}/{cov.totalCandidates}</Big>}
            <small style={{ color: 'var(--warning, #b7791f)' }}>{cov.materialized}/{cov.totalCandidates} declared · {cov.unresolved} unresolved{cov.pending > 0 ? ` · ${cov.pending} pending` : ''}</small>
          </Dim>
        ) : (
          <Dim title="Planning Coverage" sub="candidates materialized / total">
            {cov.totalCandidates === 0 ? <Big>—</Big> : <Big>{cov.materialized}/{cov.totalCandidates}</Big>}
            {cov.totalCandidates === 0 ? <small style={muted}>No candidates</small> : (cov.pending > 0 && <small style={muted}>{cov.pending} pending to materialize</small>)}
          </Dim>
        )}
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
          {topGroups.length > 0 ? ` · top ${topGroups.length} artifact${topGroups.length === 1 ? '' : 's'}` : ''}
        </p>
        {filtered.length === 0 ? (
          <p style={muted}>{totalFindings === 0 ? 'Nothing needs attention right now.' : 'No signals match these filters.'}</p>
        ) : (
          <>
            <ul style={list}>
              {topGroups.map((g) => <ArtifactSummaryRow key={g.id} g={g} onOpen={onOpen} />)}
            </ul>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <button style={viewAllBtn} onClick={() => setExplorerOpen(true)}>View all findings</button>
              {hiddenArtifacts > 0 && <span style={{ ...muted, fontSize: 12 }}>+ {hiddenArtifacts} more artifact{hiddenArtifacts === 1 ? '' : 's'} · total stays {filtered.length}</span>}
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

      {/* Readiness — a compact summary that expands on demand (WI-083 AC-13). Lifecycle (persisted) and
          current evidence review (readiness) are shown as distinct facts; a historical evidence gap is
          context, never a reopen (AC-11). */}
      {ins.entities.length > 0 && (
        <details style={{ marginTop: 18 }}>
          <summary style={readinessSummary}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Readiness</span>
            <span style={{ ...muted, fontSize: 13 }}>
              {readyCount} ready · {needsWorkCount} needs work · {blockedCount} blocked
              {historicalGaps > 0 ? <> · <span style={{ color: 'var(--warning, #b7791f)' }}>{historicalGaps} historical evidence gap{historicalGaps === 1 ? '' : 's'}</span></> : null}
            </span>
          </summary>
          <ul style={{ ...list, marginTop: 8 }}>
            {ins.entities.map((e) => (
              <li key={e.id} style={rowItem}>
                <div style={{ display: 'grid', gap: 2 }}>
                  <span>
                    <button style={linkBtn} onClick={() => onOpen(e.kind, e.id)}>{e.id}</button> {e.title}
                    <span style={muted}> · {KIND_LABEL[e.kind]}</span>
                  </span>
                  <small style={muted}>
                    Lifecycle: <span style={{ color: 'var(--foreground)' }}>{titleCase(e.status)}</span>
                    {' · '}Current evidence review: <span style={{ color: READINESS_COLOR[e.readiness] }}>{e.readiness.replace(/_/g, ' ').toLowerCase()}</span>
                    {' · '}delivery {e.delivery.completed}/{e.delivery.total}{e.delivery.blocked > 0 ? ` (${e.delivery.blocked} blocked)` : ''}
                    {' · '}outcome {e.outcome.passed}/{e.outcome.total}{e.outcome.needsVerification > 0 ? ` (${e.outcome.needsVerification} to verify)` : ''}
                  </small>
                  {e.historicalEvidenceGap && (
                    <small style={{ color: 'var(--warning, #b7791f)' }}>Historical completion; current checks may require evidence not recorded at the time.</small>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p style={{ ...muted, fontSize: 12, marginTop: 6 }}>“Ready” means human approval can be requested — it is not the same as a <code>completed</code> lifecycle status.</p>
        </details>
      )}

      {explorerOpen && <AttentionExplorer items={ins.attention} onOpen={onOpen} onClose={() => setExplorerOpen(false)} />}
    </section>
  )
}

type ArtifactGroup = { id: string; kind: InsightArtifactKind; title: string; items: AttentionItem[] }

/** Group findings by artifact, preserving Core's deterministic order. The first time an artifact appears
 * is its highest-severity finding (Core sorts severity-first), so first-occurrence order is a stable,
 * severity-first artifact order and `items[0]` is the artifact's top signal (WI-083 AC-17/AC-18). */
function groupByArtifact(items: AttentionItem[]): ArtifactGroup[] {
  const order: string[] = []
  const byId = new Map<string, ArtifactGroup>()
  for (const a of items) {
    const g = byId.get(a.artifactId)
    if (g) { g.items.push(a) } else { byId.set(a.artifactId, { id: a.artifactId, kind: a.artifactKind, title: a.title, items: [a] }); order.push(a.artifactId) }
  }
  return order.map((id) => byId.get(id)!)
}

/** Compact summary row for ONE artifact — top severity, its signal types, finding count and top reason. */
function ArtifactSummaryRow({ g, onOpen }: { g: ArtifactGroup; onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  const top = g.items[0]
  const types = Array.from(new Set(g.items.map((a) => TYPE_LABEL[a.type])))
  return (
    <li style={rowItem}>
      <div style={{ display: 'grid', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <SevTag severity={top.severity} />
          {top.link ? <button style={linkBtn} onClick={() => onOpen(g.kind, g.id)}>{g.id}</button> : <span className="font-mono">{g.id}</span>}
          <span style={muted}>{g.title}</span>
          <span style={{ ...muted, fontSize: 12 }}>· {g.items.length} finding{g.items.length === 1 ? '' : 's'} · {types.join(', ')}</span>
        </span>
        <small style={muted}>{top.reason}</small>
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
function titleCase(s: string): string { return s ? s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : s }

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
const readinessSummary: CSSProperties = { cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', listStyle: 'none' }
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
