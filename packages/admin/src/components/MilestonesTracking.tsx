import { useState, type CSSProperties } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'
import type { PlanDetail, EntityEvaluation, MilestoneVerification } from '../lib/api'
import { StatusBadge } from './StatusBadge'
import { EvidenceDrawer, CriterionRow } from './EvidenceDrawer'

// WI-086 — Plan Detail → Milestones as a compact, decision-oriented index. Each milestone is one row
// showing its id, title, linked Epics and verified/total from the SAME canonical evaluator the Evidence &
// completion tab uses (verifyPlan → EntityEvaluation.milestones). Selecting one milestone (never all nine)
// reveals its exit criteria with Core-emitted status and evidence, the historical-data warning, and a
// contextual Record-evidence action that reuses the single shared EvidenceDrawer. The interface presents
// and navigates; it never invents a milestone lifecycle, a percentage of work, or an association.

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['planning'] })
  qc.invalidateQueries({ queryKey: ['planning', 'plan', id] })
  qc.invalidateQueries({ queryKey: ['planning', 'plan', id, 'verify'] })
}

function needsReview(m: MilestoneVerification): boolean {
  const o = m.outcome
  return o.failed + o.notVerified + o.manualReview + o.ambiguous > 0 || o.stale.length > 0
}

export function MilestonesTracking({ plan, onOpenEpic }: { plan: PlanDetail; onOpenEpic?: (id: string) => void }) {
  const qc = useQueryClient()
  // Shares the exact query key used by PlanningCompletion, so a save in either surface refreshes both.
  const q = useQuery({ queryKey: ['planning', 'plan', plan.id, 'verify'], queryFn: () => api.verifyPlan(plan.id), retry: false })
  const [selected, setSelected] = useState<string | null>(null)
  const [evidenceFor, setEvidenceFor] = useState<{ criterion: string; milestone: string } | null>(null)

  const terminal = plan.status === 'completed' || plan.status === 'cancelled'
  const unreadableOf = (id: string) => plan.milestones.find((m) => m.id === id)?.unreadableExitCriteria ?? 0
  const epicsOf = (id: string) => plan.epics.filter((e) => e.milestone === id)

  if (plan.milestones.length === 0) {
    return <p style={muted}>This Plan has no milestones. Add one in Manage Milestones to track exit criteria.</p>
  }

  // The evaluator is the source of truth for verification. While it loads (or if it errors), still show the
  // milestone index from the Plan so the tab is never blank — just without the verified/total badge.
  const ev = q.data as EntityEvaluation | undefined
  const verified = new Map<string, MilestoneVerification>((ev?.milestones ?? []).map((m) => [m.id, m]))

  return (
    <div>
      <p style={hint}>Compact index · select one milestone to review its exit criteria and evidence · verified / total comes from the completion evaluator, not a progress estimate.</p>
      {q.error && <p style={{ ...muted, color: 'var(--warning)' }}>Verification is unavailable right now ({(q.error as Error).message}); showing milestones without verified counts.</p>}

      <div style={{ display: 'grid', gap: 6 }}>
        {plan.milestones.map((m) => {
          const v = verified.get(m.id)
          const o = v?.outcome
          const open = selected === m.id
          const epics = epicsOf(m.id)
          const unreadable = unreadableOf(m.id)
          const review = v ? needsReview(v) : false
          const empty = o ? o.total === 0 : false

          // Badge: honest verified/total — a milestone with zero criteria is NEVER shown as complete.
          const badge = !q.isSuccess ? <span style={muted}>{q.isLoading ? 'verifying…' : 'not verified'}</span>
            : empty ? <StatusBadge variant="muted">no exit criteria declared</StatusBadge>
            : review ? <StatusBadge variant="warning">{o!.passed}/{o!.total} · needs review</StatusBadge>
            : <StatusBadge variant="info">{o!.passed}/{o!.total} verified</StatusBadge>

          return (
            <div key={m.id} style={{ ...rowBox, ...(open ? rowBoxOpen : null) }}>
              <button aria-expanded={open} aria-controls={`ms-panel-${m.id}`} onClick={() => setSelected(open ? null : m.id)} style={rowHead}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
                  <span style={mono}>{m.id}</span>
                  <span style={{ fontWeight: open ? 600 : 400 }}>{m.title}</span>
                  {epics.length > 0 && <span style={epicHint}>{epics.map((e) => e.id).join(' · ')}</span>}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{badge}<span style={chevron}>{open ? '▴' : '▾'}</span></span>
              </button>

              {open && (
                <div id={`ms-panel-${m.id}`} style={panel}>
                  {epics.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {epics.map((e) => (
                        <button key={e.id} style={epicChip} onClick={() => onOpenEpic?.(e.id)} title={`Open ${e.id}`}>
                          <span style={mono}>{e.id}</span> {e.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {!q.isSuccess && <p style={muted}>{q.isLoading ? 'Evaluating exit criteria…' : 'Verification unavailable.'}</p>}

                  {o && o.total === 0 && (
                    <p style={muted}>
                      No readable exit criteria are declared for this milestone{unreadable > 0 ? ' that can be verified' : ''}. It is not counted as complete.
                    </p>
                  )}
                  {o && o.criteria.map((c, i) => (
                    <CriterionRow key={i} c={c} terminal={terminal} onRecord={(criterion) => setEvidenceFor({ criterion, milestone: m.id })} />
                  ))}
                  {o && o.stale.length > 0 && (
                    <p style={{ ...muted, color: 'var(--warning)' }}>Stale evidence (criterion text changed): {o.stale.map((s) => s.criterion).join('; ')}</p>
                  )}

                  {/* Tier-A historical-data diagnostic — distinguishes an unreadable source element from a
                      legitimate not-verified criterion, naming the field. Never shows the raw object. */}
                  {unreadable > 0 && (
                    <p style={warnRow}>
                      ⚠ {unreadable} source element{unreadable === 1 ? '' : 's'} in <code style={code}>milestones[].exit_criteria</code> {unreadable === 1 ? 'is' : 'are'} not readable text — excluded from verification, not the same as a <em>not-verified</em> criterion. Fix the source Markdown to make {unreadable === 1 ? 'it' : 'them'} verifiable.
                    </p>
                  )}

                  {!terminal && (
                    <a role="button" tabIndex={0} style={reviewLink}
                      onClick={() => { try { window.location.hash = '#evidence' } catch { /* ignore */ } }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); try { window.location.hash = '#evidence' } catch { /* ignore */ } } }}>
                      Review in Evidence &amp; completion →
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {evidenceFor && (
        <EvidenceDrawer kind="plan" id={plan.id} revision={plan.revision} criterion={evidenceFor.criterion} milestone={evidenceFor.milestone}
          onClose={() => setEvidenceFor(null)} onSaved={() => { const keep = evidenceFor.milestone; setEvidenceFor(null); setSelected(keep); invalidate(qc, plan.id) }} />
      )}
    </div>
  )
}

const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const hint: CSSProperties = { ...muted, fontSize: 12, margin: '0 0 10px' }
const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }
const rowBox: CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const rowBoxOpen: CSSProperties = { borderColor: 'var(--primary)' }
const rowHead: CSSProperties = { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', fontSize: 14, color: 'var(--foreground)', textAlign: 'left' }
const epicHint: CSSProperties = { fontSize: 11, color: 'var(--foreground-muted)' }
const chevron: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 12 }
const panel: CSSProperties = { borderTop: '1px solid var(--border)', padding: '10px 12px' }
const epicChip: CSSProperties = { padding: '3px 9px', border: '1px solid var(--border)', borderRadius: 999, background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }
const warnRow: CSSProperties = { color: 'var(--warning)', fontSize: 12, margin: '8px 0 0', lineHeight: 1.5 }
const code: CSSProperties = { fontFamily: 'var(--font-mono, monospace)', fontSize: 11 }
const reviewLink: CSSProperties = { display: 'inline-block', marginTop: 10, color: 'var(--primary)', cursor: 'pointer', fontSize: 12 }
