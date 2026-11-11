import { useState, type CSSProperties, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { EvidenceStatus, OutcomeVerification, InitiativeCompletionEvaluation } from '../lib/api'
import { StatusBadge } from './StatusBadge'

// Evidence-based Initiative completion UI (WI-079). Mirrors the Planning completion contract: it shows
// the canonical evidence-based readiness (a Markdown checkbox is NOT evidence), per-criterion outcome
// verification, pending candidates and provenance integrity, and a human-gated Complete action. A READY_*
// readiness never completes anything on its own — completion is always an explicit human decision.

const READINESS_TONE: Record<string, 'info' | 'warning' | 'muted'> = {
  READY_TO_COMPLETE: 'info', READY_WITH_EXCEPTIONS: 'warning', NEEDS_WORK: 'warning', BLOCKED: 'muted',
}
const STATUS_TONE: Record<string, 'info' | 'warning' | 'muted'> = {
  passed: 'info', failed: 'warning', 'not-verified': 'muted', 'manual-review-required': 'warning',
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['initiative', id] })
  qc.invalidateQueries({ queryKey: ['initiative', id, 'completion'] })
  qc.invalidateQueries({ queryKey: ['initiatives'] })
}

export function InitiativeCompletion({ id, status }: { id: string; status: string }) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['initiative', id, 'completion'],
    queryFn: () => api.getInitiativeCompletion(id),
    retry: false,
  })
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  if (q.isLoading) return <section style={section}><h3 style={h3}>Completion Review</h3><p style={muted}>Evaluating…</p></section>
  if (q.error) return <section style={section}><h3 style={h3}>Completion Review</h3><p style={{ ...muted, color: 'var(--danger)' }}>{(q.error as Error).message}</p></section>
  const ev = q.data as InitiativeCompletionEvaluation
  const ready = ev.readiness === 'READY_TO_COMPLETE' || ev.readiness === 'READY_WITH_EXCEPTIONS'
  const terminal = status === 'completed' || status === 'cancelled'
  const canComplete = status === 'in-progress'

  return (
    <section style={section}>
      <div style={head}>
        <h3 style={h3}>Completion Review</h3>
        <StatusBadge variant={READINESS_TONE[ev.readiness] ?? 'muted'}>{ev.readiness.replace(/_/g, ' ')}</StatusBadge>
      </div>

      {!terminal && canComplete && (
        <div style={actions}>
          <button style={ready ? primary : primaryDisabled} disabled={!ready} onClick={() => ready && setCompleting(true)}>Complete initiative</button>
        </div>
      )}

      <div style={twoCol}>
        <Metric label="Delivery" value={`${ev.delivery.completed}/${ev.delivery.total} Work Items`} />
        <Metric label="Outcome criteria verified" value={`${ev.outcome.passed}/${ev.outcome.total}`} />
      </div>

      {ev.blockers.length > 0 && <ul style={{ ...list, color: 'var(--danger)' }}>{ev.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>}
      {ev.provenanceIssues.length > 0 && ev.provenanceIssues.map((p, i) => <p key={`pv${i}`} style={{ ...muted, color: 'var(--danger)' }}>⚠ {p}</p>)}
      {ev.pendingCandidates.length > 0 && <p style={{ ...muted, color: 'var(--warning)' }}>Pending candidates (not yet materialized): {ev.pendingCandidates.join(', ')}</p>}
      {ev.reasons.length > 0 && <ul style={list}>{ev.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
      {ev.warnings.map((w, i) => <p key={`w${i}`} style={{ ...muted, color: 'var(--warning)' }}>⚠ {w}</p>)}

      <OutcomeList title="Outcome Verification" outcome={ev.outcome} terminal={terminal} onRecord={(criterion) => setEvidenceFor(criterion)} />

      <p style={note}>Completion always requires an explicit human decision — a “ready” status never completes anything automatically, and a Markdown checkbox is not evidence.</p>

      {evidenceFor && (
        <EvidenceDrawer id={id} criterion={evidenceFor}
          onClose={() => setEvidenceFor(null)} onSaved={() => { setEvidenceFor(null); invalidate(qc, id) }} />
      )}
      {completing && (
        <CompleteDialog id={id} readiness={ev.readiness}
          onClose={() => setCompleting(false)} onDone={() => { setCompleting(false); invalidate(qc, id) }} />
      )}
    </section>
  )
}

function OutcomeList({ title, outcome, terminal, onRecord }: { title: string; outcome: OutcomeVerification; terminal: boolean; onRecord: (criterion: string) => void }) {
  return (
    <div style={{ marginTop: 10 }}>
      <h4 style={h4}>{title}</h4>
      {outcome.total === 0 && <p style={muted}>No success criteria declared — completion cannot be judged by outcome.</p>}
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

function EvidenceDrawer({ id, criterion, onClose, onSaved }: { id: string; criterion: string; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState<EvidenceStatus>('passed')
  const [evidence, setEvidence] = useState('')
  const [reference, setReference] = useState('')
  const [method, setMethod] = useState<'automated' | 'manual' | ''>('')
  const [by, setBy] = useState('')
  const m = useMutation({
    mutationFn: () => api.recordInitiativeEvidence(id, {
      criterion, status,
      evidence: evidence.trim() || undefined, reference: reference.trim() || undefined,
      method: method || undefined, verifiedBy: by.trim() || undefined,
    }),
    onSuccess: onSaved,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label="Record evidence" style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={drawer}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Record evidence</h3>
          <p style={{ ...muted, margin: '4px 0 0' }}>{criterion}</p>
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

function CompleteDialog({ id, readiness, onClose, onDone }: { id: string; readiness: string; onClose: () => void; onDone: () => void }) {
  const [by, setBy] = useState('')
  const [notes, setNotes] = useState('')
  const m = useMutation({
    mutationFn: () => api.completeInitiative(id, { decidedBy: by.trim() || undefined, notes: notes.trim() || undefined }),
    onSuccess: onDone,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label="Complete initiative" style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...drawer, maxWidth: 440 }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Complete initiative {id}</h3>
          <p style={{ ...muted, lineHeight: 1.5 }}>This records an explicit human completion decision ({readiness.replace(/_/g, ' ')}) and the evidence behind it. It cannot be undone automatically.</p>
          <label style={field}><span style={fieldLabel}>Decided by</span><input value={by} onChange={(e) => setBy(e.target.value)} placeholder="your name (optional)" style={input} /></label>
          <label style={field}><span style={fieldLabel}>Note</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" style={input} /></label>
          {m.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(m.error as Error).message}</span>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={ghost} onClick={onClose}>Cancel</button>
            <button style={primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Completing…' : 'Complete initiative'}</button>
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
const btn: CSSProperties = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }
const primary: CSSProperties = { ...btn, border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }
const primaryDisabled: CSSProperties = { ...primary, opacity: 0.5, cursor: 'not-allowed' }
const ghost: CSSProperties = { ...btn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }
const ghostSm: CSSProperties = { ...ghost, padding: '5px 10px', fontSize: 12, flex: '0 0 auto' }
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }
const field: CSSProperties = { display: 'grid', gap: 5 }
const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 600 }
const input: CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const footer: CSSProperties = { padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }
