import { useState, type CSSProperties } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as api from '../lib/api'
import type { EvidenceStatus, CriterionVerification } from '../lib/api'
import { StatusBadge } from './StatusBadge'

// WI-086 — the single, shared evidence surface. Both the Evidence & completion tab (PlanningCompletion)
// and the Milestones tab (MilestonesTracking) render criteria and record evidence through these pieces,
// so there is exactly one mutation, one validation path and one concurrency guard (expectedRevision / 409).
// No second form is ever created for milestone-context evidence (WI-086 §4.2, AC-17).

export type Kind = 'plan' | 'epic'

export const STATUS_TONE: Record<string, 'info' | 'warning' | 'muted'> = {
  passed: 'info', failed: 'warning', 'not-verified': 'muted', 'manual-review-required': 'warning',
}

/** One read-only criterion row with its status, evidence and (unless terminal) a Record-evidence action.
 *  Presentational only — it never changes canonical counts. */
export function CriterionRow({ c, terminal, onRecord }: {
  c: CriterionVerification; terminal: boolean; onRecord: (criterion: string) => void
}) {
  return (
    <div style={critRow}>
      <div style={{ display: 'grid', gap: 2 }}>
        <span><StatusBadge variant={STATUS_TONE[c.status] ?? 'muted'}>{c.status}</StatusBadge>{c.waived ? ' · waived' : ''}{c.ambiguous ? ' · ambiguous' : ''} {c.criterion}</span>
        {c.evidence && <span style={muted}>{c.evidence}{c.reference ? ` · ${c.reference}` : ''}{c.verifiedBy ? ` · by ${c.verifiedBy}` : ''}</span>}
      </div>
      {!terminal && <button style={ghostSm} onClick={() => onRecord(c.criterion)}>Record evidence</button>}
    </div>
  )
}

export function EvidenceDrawer({ kind, id, revision, criterion, milestone, onClose, onSaved }: {
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

const critRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const btn: CSSProperties = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }
const primary: CSSProperties = { ...btn, border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }
const ghost: CSSProperties = { ...btn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }
const ghostSm: CSSProperties = { ...ghost, padding: '5px 10px', fontSize: 12, flex: '0 0 auto' }
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }
const field: CSSProperties = { display: 'grid', gap: 5 }
const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 600 }
const input: CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const footer: CSSProperties = { padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }
