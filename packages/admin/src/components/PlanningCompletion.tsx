import { useState, type CSSProperties, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'
import type { EntityEvaluation, EvidenceStatus, OutcomeVerification, CompletionDecision } from '../lib/api'
import { StatusBadge } from './StatusBadge'

// Evidence-based completion UI (WI-078): shows the canonical, evidence-based readiness (NOT the older
// structural "preconditions" flag), the per-criterion outcome verification with evidence, milestone exit
// criteria for Plans, and human-gated lifecycle actions (start / complete). Completion always requires
// an explicit human decision — a READY_* readiness never completes anything on its own.

type Kind = 'plan' | 'epic'

const READINESS_TONE: Record<string, 'info' | 'warning' | 'muted'> = {
  READY_TO_COMPLETE: 'info', READY_WITH_EXCEPTIONS: 'warning', NEEDS_WORK: 'warning', BLOCKED: 'muted',
}
const STATUS_TONE: Record<string, 'info' | 'warning' | 'muted'> = {
  passed: 'info', failed: 'warning', 'not-verified': 'muted', 'manual-review-required': 'warning',
}

function invalidate(qc: ReturnType<typeof useQueryClient>, kind: Kind, id: string) {
  qc.invalidateQueries({ queryKey: ['planning'] })
  qc.invalidateQueries({ queryKey: ['planning', kind, id] })
  qc.invalidateQueries({ queryKey: ['planning', kind, id, 'verify'] })
}

export function PlanningCompletion({ kind, id, status, revision, completionDecision }: {
  kind: Kind; id: string; status: string; revision: string; completionDecision: CompletionDecision | null
}) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['planning', kind, id, 'verify'],
    queryFn: () => (kind === 'plan' ? api.verifyPlan(id) : api.verifyEpic(id)),
    retry: false,
  })
  const [evidenceFor, setEvidenceFor] = useState<{ criterion: string; milestone?: string } | null>(null)
  const [completing, setCompleting] = useState(false)

  const transition = useMutation({
    mutationFn: (to: 'in-progress' | 'cancelled'): Promise<api.PlanDetail | api.EpicDetail> => (kind === 'plan' ? api.transitionPlan(id, to, revision) : api.transitionEpic(id, to, revision)),
    onSuccess: () => invalidate(qc, kind, id),
  })

  if (q.isLoading) return <section style={section}><h3 style={h3}>Completion Review</h3><p style={muted}>Evaluating…</p></section>
  if (q.error) return <section style={section}><h3 style={h3}>Completion Review</h3><p style={{ ...muted, color: 'var(--danger)' }}>{(q.error as Error).message}</p></section>
  const ev = q.data as EntityEvaluation
  const ready = ev.readiness === 'READY_TO_COMPLETE' || ev.readiness === 'READY_WITH_EXCEPTIONS'
  const canStart = status === 'draft' || status === 'planned'
  const canComplete = status === 'in-progress'
  const terminal = status === 'completed' || status === 'cancelled'

  return (
    <section style={section}>
      <div style={head}>
        <h3 style={h3}>Completion Review</h3>
        <StatusBadge variant={READINESS_TONE[ev.readiness] ?? 'muted'}>{ev.readiness.replace(/_/g, ' ')}</StatusBadge>
      </div>

      {/* Lifecycle actions — human-gated. Completion is never automatic. */}
      {!terminal && (
        <div style={actions}>
          {canStart && <button style={ghost} disabled={transition.isPending} onClick={() => transition.mutate('in-progress')}>Start {kind}</button>}
          {canComplete && <button style={ready ? primary : primaryDisabled} disabled={!ready} onClick={() => ready && setCompleting(true)}>Complete {kind}</button>}
          {!terminal && <button style={ghostDanger} disabled={transition.isPending} onClick={() => transition.mutate('cancelled')}>Cancel {kind}</button>}
        </div>
      )}
      {transition.error && <p style={{ ...muted, color: 'var(--danger)' }}>{(transition.error as Error).message}</p>}
      {terminal && completionDecision && (
        <div style={decisionBox}>
          Completed ({String(completionDecision.readiness).replace(/_/g, ' ')}) on {completionDecision.decided_at}{completionDecision.decided_by ? ` by ${completionDecision.decided_by}` : ''}.
          {completionDecision.note ? ` — ${completionDecision.note}` : ''}
        </div>
      )}

      {/* Execution progress vs outcome verification are shown separately (AC-27). */}
      <div style={twoCol}>
        <Metric label="Delivery" value={`${ev.delivery.completed}/${ev.delivery.total} Work Items`} />
        <Metric label="Outcome criteria verified" value={`${ev.outcome.passed}/${ev.outcome.total}`} />
      </div>

      {ev.blockingDependencies.length > 0 && <p style={{ ...muted, color: 'var(--warning)' }}>Blocking dependencies: {ev.blockingDependencies.join(', ')}</p>}
      {ev.reasons.length > 0 && <ul style={list}>{ev.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
      {ev.warnings.map((w, i) => <p key={i} style={{ ...muted, color: 'var(--warning)' }}>⚠ {w}</p>)}

      <OutcomeList title="Outcome Verification" outcome={ev.outcome} terminal={terminal}
        onRecord={(criterion) => setEvidenceFor({ criterion })} />

      {ev.milestones && ev.milestones.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h4 style={h4}>Milestone exit criteria</h4>
          {ev.milestones.map((m) => (
            <OutcomeList key={m.id} title={`${m.id} — ${m.title}`} outcome={m.outcome} terminal={terminal}
              onRecord={(criterion) => setEvidenceFor({ criterion, milestone: m.id })} />
          ))}
        </div>
      )}

      <p style={note}>Completion always requires an explicit human decision — a “ready” status never completes anything automatically.</p>

      {evidenceFor && (
        <EvidenceDrawer kind={kind} id={id} revision={revision} criterion={evidenceFor.criterion} milestone={evidenceFor.milestone}
          onClose={() => setEvidenceFor(null)} onSaved={() => { setEvidenceFor(null); invalidate(qc, kind, id) }} />
      )}
      {completing && (
        <CompleteDialog kind={kind} id={id} revision={revision} readiness={ev.readiness}
          onClose={() => setCompleting(false)} onDone={() => { setCompleting(false); invalidate(qc, kind, id) }} />
      )}
    </section>
  )
}

function OutcomeList({ title, outcome, terminal, onRecord }: { title: string; outcome: OutcomeVerification; terminal: boolean; onRecord: (criterion: string) => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <h4 style={h4}>{title}</h4>
      {outcome.total === 0 && <p style={muted}>No criteria declared.</p>}
      {outcome.criteria.map((c, i) => (
        <div key={i} style={critRow}>
          <div style={{ display: 'grid', gap: 2 }}>
            <span><StatusBadge variant={STATUS_TONE[c.status] ?? 'muted'}>{c.status}</StatusBadge>{c.waived ? ' · waived' : ''}{c.ambiguous ? ' · ambiguous' : ''} {c.criterion}</span>
            {c.evidence && <span style={muted}>{c.evidence}{c.reference ? ` · ${c.reference}` : ''}{c.verifiedBy ? ` · by ${c.verifiedBy}` : ''}</span>}
          </div>
          {!terminal && <button style={ghostSm} onClick={() => onRecord(c.criterion)}>Record evidence</button>}
        </div>
      ))}
      {outcome.stale.length > 0 && <p style={{ ...muted, color: 'var(--warning)' }}>Stale evidence (criterion changed): {outcome.stale.map((s) => s.criterion).join('; ')}</p>}
    </div>
  )
}

function EvidenceDrawer({ kind, id, revision, criterion, milestone, onClose, onSaved }: {
  kind: Kind; id: string; revision: string; criterion: string; milestone?: string; onClose: () => void; onSaved: () => void
}) {
  const [status, setStatus] = useState<EvidenceStatus>('passed')
  const [evidence, setEvidence] = useState('')
  const [reference, setReference] = useState('')
  const [method, setMethod] = useState<'automated' | 'manual' | ''>('')
  const [by, setBy] = useState('')
  const m = useMutation({
    mutationFn: (): Promise<api.PlanDetail | api.EpicDetail> => {
      const input = { criterion, status, evidence: evidence.trim() || undefined, reference: reference.trim() || undefined, method: method || undefined, verifiedBy: by.trim() || undefined, milestone, expectedRevision: revision }
      return kind === 'plan' ? api.recordPlanEvidence(id, input) : api.recordEpicEvidence(id, input)
    },
    onSuccess: onSaved,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label="Record evidence" style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={drawer}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Record evidence</h3>
          <p style={{ ...muted, margin: '4px 0 0' }}>{milestone ? `Milestone ${milestone} · ` : ''}{criterion}</p>
        </div>
        <div style={{ padding: 18, display: 'grid', gap: 12 }}>
          <label style={field}><span style={fieldLabel}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as EvidenceStatus)} style={input}>
              <option value="passed">passed</option><option value="failed">failed</option>
              <option value="not-verified">not-verified</option><option value="manual-review-required">manual-review-required</option>
            </select>
          </label>
          <label style={field}><span style={fieldLabel}>Evidence</span><textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={3} placeholder="What the evidence shows (not just a checkbox)" style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} /></label>
          <label style={field}><span style={fieldLabel}>Reference</span><input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="File, test, ADR or report" style={input} /></label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ ...field, flex: 1 }}><span style={fieldLabel}>Method</span>
              <select value={method} onChange={(e) => setMethod(e.target.value as 'automated' | 'manual' | '')} style={input}>
                <option value="">—</option><option value="automated">automated</option><option value="manual">manual</option>
              </select>
            </label>
            <label style={{ ...field, flex: 1 }}><span style={fieldLabel}>Verified by</span><input value={by} onChange={(e) => setBy(e.target.value)} placeholder="optional" style={input} /></label>
          </div>
        </div>
        <div style={footer}>
          {m.error && <span style={{ color: 'var(--danger)', fontSize: 13, flex: 1 }}>{(m.error as Error).message}</span>}
          <button style={ghost} onClick={onClose}>Cancel</button>
          <button style={primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save evidence'}</button>
        </div>
      </div>
    </div>
  )
}

function CompleteDialog({ kind, id, revision, readiness, onClose, onDone }: {
  kind: Kind; id: string; revision: string; readiness: string; onClose: () => void; onDone: () => void
}) {
  const [by, setBy] = useState('')
  const [note, setNote] = useState('')
  const m = useMutation({
    mutationFn: (): Promise<api.PlanDetail | api.EpicDetail> => (kind === 'plan' ? api.completePlan(id, { decidedBy: by.trim() || undefined, note: note.trim() || undefined, expectedRevision: revision }) : api.completeEpic(id, { decidedBy: by.trim() || undefined, note: note.trim() || undefined, expectedRevision: revision })),
    onSuccess: onDone,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label={`Complete ${kind}`} style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...drawer, maxWidth: 440 }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Complete {kind} {id}</h3>
          <p style={{ ...muted, lineHeight: 1.5 }}>This records an explicit human completion decision ({readiness.replace(/_/g, ' ')}) and the evidence behind it. It cannot be undone automatically.</p>
          <label style={field}><span style={fieldLabel}>Decided by</span><input value={by} onChange={(e) => setBy(e.target.value)} placeholder="your name (optional)" style={input} /></label>
          <label style={field}><span style={fieldLabel}>Note</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="optional" style={input} /></label>
          {m.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(m.error as Error).message}</span>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={ghost} onClick={onClose}>Cancel</button>
            <button style={primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Completing…' : `Complete ${kind}`}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return <div style={metric}><span>{label}</span><strong>{value}</strong></div>
}

const section: CSSProperties = { marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }
const h3: CSSProperties = { margin: 0 }
const h4: CSSProperties = { margin: '0 0 6px', fontSize: 14 }
const actions: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }
const twoCol: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, margin: '12px 0' }
const metric: CSSProperties = { padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', display: 'grid', gap: 4, color: 'var(--foreground-muted)', fontSize: 13 }
const critRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const note: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 12, marginTop: 12 }
const list: CSSProperties = { margin: '8px 0', paddingLeft: 18, color: 'var(--foreground-muted)', fontSize: 13 }
const decisionBox: CSSProperties = { padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 8 }
const btn: CSSProperties = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }
const primary: CSSProperties = { ...btn, border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }
const primaryDisabled: CSSProperties = { ...primary, opacity: 0.5, cursor: 'not-allowed' }
const ghost: CSSProperties = { ...btn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }
const ghostSm: CSSProperties = { ...ghost, padding: '5px 10px', fontSize: 12, flex: '0 0 auto' }
const ghostDanger: CSSProperties = { ...ghost, color: 'var(--danger)' }
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }
const field: CSSProperties = { display: 'grid', gap: 5 }
const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 600 }
const input: CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const footer: CSSProperties = { padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }
