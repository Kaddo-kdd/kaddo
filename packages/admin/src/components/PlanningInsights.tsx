import { useMemo, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlanningInsights } from '../lib/api'
import type { AttentionItem, AttentionType, InsightArtifactKind } from '../lib/api'

// Planning Progress & Execution Insights (WI-081) — read-only. Surfaces the three dimensions SEPARATELY
// (Planning Coverage, Delivery Progress, Outcome Verification), a deterministic Needs-attention queue with
// provenance and navigation, and milestone/outcome signals. It never mutates anything; "ready" is shown
// distinct from lifecycle `completed`. All numbers come from Core's projection — nothing is invented here.

const SEV_COLOR: Record<string, string> = { blocking: 'var(--danger)', warning: 'var(--warning, #b7791f)', info: 'var(--foreground-muted)' }
const TYPE_LABEL: Record<AttentionType, string> = {
  dependency: 'Dependency', 'incomplete-delivery': 'Incomplete delivery', 'pending-candidates': 'Pending candidate',
  'unverified-outcome': 'Unverified outcome', provenance: 'Provenance', 'declared-risk': 'Declared risk',
}
const KIND_LABEL: Record<InsightArtifactKind, string> = { plan: 'Plan', epic: 'Epic', initiative: 'Initiative', 'work-item': 'Work Item' }
const READINESS_COLOR: Record<string, string> = {
  READY_TO_COMPLETE: 'var(--primary)', READY_WITH_EXCEPTIONS: 'var(--warning, #b7791f)',
  NEEDS_WORK: 'var(--foreground-muted)', BLOCKED: 'var(--danger)',
}

export function PlanningInsights({ onOpen }: { onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  const q = useQuery({ queryKey: ['planning', 'insights'], queryFn: getPlanningInsights, retry: false })
  const [typeFilter, setTypeFilter] = useState<AttentionType | 'all'>('all')
  const [kindFilter, setKindFilter] = useState<InsightArtifactKind | 'all'>('all')

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

  return (
    <section style={section}>
      <H>Execution Insights</H>

      {/* Three attention indicators — each counts a distinct family, never summed into one score. */}
      <div style={indicators}>
        <Indicator label="Blocking issues" value={ins.indicators.blockingIssues} tone={ins.indicators.blockingIssues > 0 ? 'blocking' : 'muted'} hint="Blocked deps, broken relations & provenance" />
        <Indicator label="Outcome needs verification" value={ins.indicators.outcomeNeedsVerification} tone={ins.indicators.outcomeNeedsVerification > 0 ? 'warning' : 'muted'} hint="Declared criteria without valid evidence" />
        <Indicator label="Milestones needing review" value={ins.indicators.milestonesNeedingReview} tone={ins.indicators.milestonesNeedingReview > 0 ? 'warning' : 'muted'} hint="Exit criteria pending / failed / ambiguous" />
      </div>

      {/* The three dimensions, kept separate (AC-02). */}
      <div style={dims}>
        <Dim title="Planning Coverage" sub="candidates materialized / total">
          {ins.coverage.totalCandidates === 0 ? <Big>—</Big> : <Big>{ins.coverage.materialized}/{ins.coverage.totalCandidates}</Big>}
          {ins.coverage.pending > 0 && <small style={muted}>{ins.coverage.pending} pending to materialize</small>}
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

      {/* Needs attention — deterministic, with filters by signal type and artifact type. */}
      <div style={{ marginTop: 18 }}>
        <div style={attnHead}>
          <h4 style={h4}>Needs attention <span style={muted}>({filtered.length})</span></h4>
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
        {filtered.length === 0 ? (
          <p style={muted}>{ins.attention.length === 0 ? 'Nothing needs attention right now.' : 'No signals match these filters.'}</p>
        ) : (
          <ul style={list}>
            {filtered.map((a, i) => <AttentionRow key={i} a={a} onOpen={onOpen} />)}
          </ul>
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
    </section>
  )
}

function AttentionRow({ a, onOpen }: { a: AttentionItem; onOpen: (kind: InsightArtifactKind, id: string) => void }) {
  return (
    <li style={rowItem}>
      <div style={{ display: 'grid', gap: 2 }}>
        <span>
          <span style={{ color: SEV_COLOR[a.severity], fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>{TYPE_LABEL[a.type]}</span>
          {' · '}
          {a.link ? <button style={linkBtn} onClick={() => onOpen(a.artifactKind, a.artifactId)}>{a.artifactId}</button> : <span className="font-mono">{a.artifactId}</span>}
          {' '}<span style={muted}>{a.title}</span>
        </span>
        <small style={muted}>{a.reason}</small>
      </div>
    </li>
  )
}

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
