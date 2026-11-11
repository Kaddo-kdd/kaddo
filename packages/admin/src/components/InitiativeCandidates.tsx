import { useState, type CSSProperties } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { InitiativeCandidate } from '../lib/api'

// Candidate management UI (WI-079). Pending candidates can be edited (id, source signals and provenance
// preserved), removed with a logged justification, or materialized into a draft Work Item. Materialized
// candidates are read-only here — reconcile them through their Work Item. Materialization is idempotent.

export function InitiativeCandidates({ id, candidates, onOpenWorkItem }: {
  id: string; candidates: InitiativeCandidate[]; onOpenWorkItem: (wiId: string) => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [materializing, setMaterializing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const refresh = () => { qc.invalidateQueries({ queryKey: ['initiative', id] }); qc.invalidateQueries({ queryKey: ['initiative', id, 'completion'] }); qc.invalidateQueries({ queryKey: ['initiatives'] }) }

  return (
    <div>
      {candidates.length === 0
        ? <div style={{ fontSize: 14, color: 'var(--foreground-muted)' }}>No candidates.</div>
        : (
          <div style={{ display: 'grid', gap: 8 }}>
            {candidates.map((c) => (
              <div key={c.id} style={row}>
                <div style={{ display: 'grid', gap: 2 }}>
                  <span><span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{c.id}</span> {c.title}
                    {c.materializedAs
                      ? <button style={linkBtn} onClick={() => onOpenWorkItem(c.materializedAs!)}> → {c.materializedAs}</button>
                      : <span style={{ color: 'var(--foreground-muted)' }}> (pending)</span>}
                  </span>
                  {(c.type || c.expectedValue) && <span style={muted}>{[c.type && `type: ${c.type}`, c.expectedValue && `value: ${c.expectedValue}`].filter(Boolean).join(' · ')}</span>}
                </div>
                {!c.materializedAs && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button style={ghostSm} onClick={() => setMaterializing(c.id)}>Materialize</button>
                    <button style={ghostSm} onClick={() => setEditing(c.id)}>Edit</button>
                    <button style={{ ...ghostSm, color: 'var(--danger)' }} onClick={() => setRemoving(c.id)}>Remove</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      <button style={{ ...ghostSm, marginTop: 12 }} onClick={() => setAdding(true)}>+ Add candidate</button>

      {adding && <CandidateDialog mode="add" id={id} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); refresh() }} />}
      {editing && <CandidateDialog mode="edit" id={id} candidate={candidates.find((c) => c.id === editing)!} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
      {removing && <RemoveDialog id={id} candidate={candidates.find((c) => c.id === removing)!} onClose={() => setRemoving(null)} onRemoved={() => { setRemoving(null); refresh() }} />}
      {materializing && <MaterializeDialog id={id} candidate={candidates.find((c) => c.id === materializing)!} onClose={() => setMaterializing(null)} onDone={() => { setMaterializing(null); refresh() }} onOpenWorkItem={onOpenWorkItem} />}
    </div>
  )
}

function CandidateDialog({ mode, id, candidate, onClose, onSaved }: {
  mode: 'add' | 'edit'; id: string; candidate?: InitiativeCandidate; onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState(candidate?.title ?? '')
  const [type, setType] = useState(candidate?.type ?? '')
  const [expectedValue, setExpectedValue] = useState(candidate?.expectedValue ?? '')
  const [notes, setNotes] = useState(candidate?.notes ?? '')
  const m = useMutation({
    mutationFn: () => {
      const body = { title: title.trim(), type: type.trim() || undefined, expectedValue: expectedValue.trim() || undefined, notes: notes.trim() || undefined }
      return mode === 'add'
        ? api.addInitiativeCandidate(id, body)
        : api.updateInitiativeCandidate(id, candidate!.id, body)
    },
    onSuccess: onSaved,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label={`${mode === 'add' ? 'Add' : 'Edit'} candidate`} style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...drawer, maxWidth: 440 }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{mode === 'add' ? 'Add candidate' : `Edit ${candidate!.id}`}</h3>
          <label style={field}><span style={fieldLabel}>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} style={input} /></label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ ...field, flex: 1 }}><span style={fieldLabel}>Type</span><input value={type} onChange={(e) => setType(e.target.value)} placeholder="feature, fix…" style={input} /></label>
            <label style={{ ...field, flex: 1 }}><span style={fieldLabel}>Expected value</span><input value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} placeholder="high, medium…" style={input} /></label>
          </div>
          <label style={field}><span style={fieldLabel}>Notes</span><input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" style={input} /></label>
          {m.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(m.error as Error).message}</span>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={ghost} onClick={onClose}>Cancel</button>
            <button style={primary} disabled={m.isPending || !title.trim()} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RemoveDialog({ id, candidate, onClose, onRemoved }: { id: string; candidate: InitiativeCandidate; onClose: () => void; onRemoved: () => void }) {
  const [reason, setReason] = useState('')
  const m = useMutation({
    mutationFn: () => api.removeInitiativeCandidate(id, candidate.id, reason.trim()),
    onSuccess: onRemoved,
  })
  return (
    <div role="dialog" aria-modal="true" aria-label="Remove candidate" style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...drawer, maxWidth: 440 }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Remove {candidate.id}</h3>
          <p style={{ ...muted, lineHeight: 1.5 }}>Removing a committed candidate is a strategic decision. It is logged with your justification and its id is retired (never reused).</p>
          <label style={field}><span style={fieldLabel}>Justification</span><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this candidate being dropped?" style={input} /></label>
          {m.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(m.error as Error).message}</span>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button style={ghost} onClick={onClose}>Cancel</button>
            <button style={{ ...primary, borderColor: 'var(--danger)', background: 'var(--danger)' }} disabled={m.isPending || !reason.trim()} onClick={() => m.mutate()}>{m.isPending ? 'Removing…' : 'Remove candidate'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Materialization preview/confirm (WI-079 AC-12). Shows what will happen before confirming; the write
// is idempotent, so re-confirming an already-materialized candidate returns the same Work Item.
function MaterializeDialog({ id, candidate, onClose, onDone, onOpenWorkItem }: {
  id: string; candidate: InitiativeCandidate; onClose: () => void; onDone: () => void; onOpenWorkItem: (wiId: string) => void
}) {
  const m = useMutation({ mutationFn: () => api.materializeInitiativeCandidate(id, candidate.id) })
  const result = m.data
  return (
    <div role="dialog" aria-modal="true" aria-label="Materialize candidate" style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...drawer, maxWidth: 460 }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Materialize {candidate.id}</h3>
          {!result ? (
            <>
              <p style={{ ...muted, lineHeight: 1.5 }}>Preview: this creates <strong>one draft Work Item</strong> from “{candidate.title}”, associated to {id} via <code>initiative: {id}</code> and carrying the candidate id and source signals as provenance. It is idempotent — re-running returns the same Work Item.</p>
              {m.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(m.error as Error).message}</span>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={ghost} onClick={onClose}>Cancel</button>
                <button style={primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Materializing…' : 'Confirm & materialize'}</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14 }}>{result.alreadyMaterialized ? 'Already materialized as' : 'Materialized as'} <strong>{result.workItemId}</strong>.</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button style={ghost} onClick={onDone}>Close</button>
                <button style={primary} onClick={() => { onOpenWorkItem(result.workItemId) }}>Open {result.workItemId}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const row: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const btn: CSSProperties = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }
const primary: CSSProperties = { ...btn, border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }
const ghost: CSSProperties = { ...btn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }
const ghostSm: CSSProperties = { ...ghost, padding: '5px 10px', fontSize: 12, flex: '0 0 auto' }
const linkBtn: CSSProperties = { background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }
const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }
const field: CSSProperties = { display: 'grid', gap: 5 }
const fieldLabel: CSSProperties = { fontSize: 13, fontWeight: 600 }
const input: CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
