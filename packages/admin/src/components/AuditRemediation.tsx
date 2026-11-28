import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { AuditPlanAction } from '../lib/api'
import { ConfirmDialog } from './ConfirmDialog'
import { buildAuditLinkInput, isValidWorkItemId, isRevisionConflict } from '../lib/audit-presentation'

// WI-105 (INI-002, AUD-ADMIN-C6) — Remediation: a read-only preview of the audit plan (ranked actions per
// finding, with suggested and already-linked Work Items), plus linking a finding to an EXISTING Work Item
// with explicit human confirmation. Heuristic matches are suggestions; nothing is linked automatically.

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--danger, #c53030)', high: 'var(--danger, #c53030)', medium: 'var(--warning, #b7791f)',
  low: 'var(--foreground-muted)', info: 'var(--foreground-muted)',
}
const control = {
  padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  background: 'var(--surface)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit',
} as const

function WorkItemLink({ id }: { id: string }) {
  const router = useRouter()
  return (
    <button onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: id } })}
      className="font-mono" style={{ background: 'none', border: 'none', color: 'var(--primary, #3182ce)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: 0, textDecoration: 'underline' }}>{id}</button>
  )
}

/** The per-finding link flow: choose a Work Item, confirm explicitly, then write. */
function LinkFlow({ auditId, action, onLinked }: { auditId: string; action: AuditPlanAction; onLinked: () => void }) {
  const [wiId, setWiId] = useState(action.suggestedWorkItems[0] ?? '')
  const [pending, setPending] = useState<{ workItemId: string; revision: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  async function prepare() {
    setMessage(null)
    if (!isValidWorkItemId(wiId)) { setMessage({ tone: 'error', text: 'Enter a valid Work Item id (WI-123).' }); return }
    setBusy(true)
    try {
      const wi = await api.getWorkItemEdit(wiId.trim())
      setPending({ workItemId: wiId.trim(), revision: wi.revision })
    } catch (err) {
      setMessage({ tone: 'error', text: `Could not read ${wiId.trim()}: ${(err as Error).message}` })
    } finally { setBusy(false) }
  }

  async function confirmLink() {
    if (!pending) return
    setBusy(true); setMessage(null)
    try {
      const res = await api.linkAuditFinding(buildAuditLinkInput(auditId, action.findingId, pending.workItemId, pending.revision))
      setMessage({ tone: 'ok', text: res.changed ? `Linked to ${pending.workItemId}.` : `Already linked to ${pending.workItemId}.` })
      setPending(null)
      onLinked()
    } catch (err) {
      if (isRevisionConflict(err)) setMessage({ tone: 'error', text: `${pending.workItemId} changed since it was read — review and retry.` })
      else setMessage({ tone: 'error', text: (err as Error).message })
      setPending(null)
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {action.suggestedWorkItems.map((id) => (
          <button key={id} onClick={() => setWiId(id)} className="font-mono"
            style={{ ...control, cursor: 'pointer', borderColor: wiId === id ? 'var(--primary, #3182ce)' : 'var(--border)' }}>{id}</button>
        ))}
        <input aria-label="Work Item id" placeholder="WI-123" style={{ ...control, width: 110 }} value={wiId} onChange={(e) => setWiId(e.target.value)} className="font-mono" />
        <button disabled={busy} onClick={prepare} style={{ ...control, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>Link to Work Item…</button>
      </div>
      {message && (
        <span style={{ fontSize: 12, color: message.tone === 'ok' ? 'var(--success, #2f855a)' : 'var(--danger, #c53030)' }}>{message.text}</span>
      )}
      {pending && (
        <ConfirmDialog
          title="Link finding to Work Item"
          confirmLabel={busy ? 'Linking…' : 'Confirm link'}
          onConfirm={confirmLink}
          onCancel={() => setPending(null)}
        >
          <p style={{ margin: 0, fontSize: 14 }}>
            Add finding <span className="font-mono">{action.findingId}</span> to Work Item{' '}
            <span className="font-mono">{pending.workItemId}</span>? This records the association on the Work Item
            (lifecycle and other fields are untouched).
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}

export function AuditRemediation({ auditId }: { auditId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-plan', auditId],
    queryFn: () => api.getAuditPlan(auditId),
    retry: false,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['audit-plan', auditId] })
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] })
  }

  return (
    <section style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Remediation</h2>
      <p style={{ fontSize: 12, color: 'var(--foreground-muted)', margin: '0 0 10px' }}>
        Suggestions are heuristic. Linking a finding to a Work Item requires your explicit confirmation.
      </p>

      {isLoading && <p style={{ color: 'var(--foreground-muted)', fontSize: 14 }}>Loading remediation plan…</p>}
      {error && <p style={{ color: 'var(--danger, #c53030)', fontSize: 14 }}>Could not load remediation plan: {(error as Error).message}</p>}

      {data && data.actions.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--foreground-muted)', margin: 0 }}>No findings to remediate.</p>
      )}

      {data && data.actions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.actions.map((a) => (
            <div key={a.findingId} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, color: '#fff', background: SEVERITY_COLOR[a.severity] ?? 'var(--foreground-muted)' }}>{a.severity}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: a.action === 'already-linked' ? 'var(--success, #2f855a)' : 'var(--foreground-muted)' }}>
                  {a.action === 'already-linked' ? 'linked' : 'needs review'}
                </span>
              </div>
              <div style={{ fontSize: 13 }}><span style={{ color: 'var(--foreground-muted)' }}>Recommendation: </span>{a.recommendation}</div>
              {a.confirmedWorkItems.length > 0 && (
                <div style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--foreground-muted)' }}>Linked:</span>
                  {a.confirmedWorkItems.map((id) => <WorkItemLink key={id} id={id} />)}
                </div>
              )}
              <LinkFlow auditId={auditId} action={a} onLinked={invalidate} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
