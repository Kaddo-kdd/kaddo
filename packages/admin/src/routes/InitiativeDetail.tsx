import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { InitiativeFinding, InitiativeDetail as InitiativeDetailData } from '../lib/api'
import { InitiativePlanningContext } from '../components/PlanningManage'
import { CollaborationOverview } from '../components/CollaborationOverview'
import { AssignmentDialog } from '../components/AssignmentDialog'
import { InitiativeCompletion } from '../components/InitiativeCompletion'
import { InitiativeCandidates } from '../components/InitiativeCandidates'

const card = {
  border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)',
  padding: 16, marginBottom: 16,
} as const

const NEXT_STATUS: Record<string, string[]> = {
  candidate: ['planned', 'cancelled'],
  planned: ['in-progress', 'deferred', 'cancelled'],
  // 'completed' is intentionally excluded: completion is evidence-gated (WI-079) and happens through
  // the Completion Review (record outcome evidence, then an explicit human decision), not a transition.
  'in-progress': ['deferred', 'cancelled'],
  deferred: ['planned', 'cancelled'],
  completed: [],
  cancelled: [],
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={card}>
      <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: '0 0 12px' }}>{title}</h3>
      {children}
    </div>
  )
}

function FindingRow({ f }: { f: InitiativeFinding }) {
  const color = f.severity === 'blocking' ? 'var(--danger)' : f.severity === 'warning' ? 'var(--warning, #b7791f)' : 'var(--foreground-muted)'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, color }}>[{f.severity}] {f.message}</div>
      {f.items && f.items.length > 0 && (
        <ul style={{ margin: '4px 0 0 18px', fontSize: 13, color: 'var(--foreground-muted)' }}>
          {f.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  )
}

export function InitiativeDetail() {
  const { initiativeId } = useParams({ from: '/initiatives/$initiativeId' })
  const queryClient = useQueryClient()
  const router = useRouter()
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['initiative', initiativeId],
    queryFn: () => api.getInitiative(initiativeId),
  })
  const collaboration = useQuery({ queryKey: ['initiative', initiativeId, 'collaboration'], queryFn: () => api.getInitiativeCollaboration(initiativeId), retry: false })

  const updateMut = useMutation({
    mutationFn: (patch: { status?: string; owners?: string[]; contributors?: string[]; title?: string; horizon?: string; priority?: string; domains?: string[]; sections?: Record<string, string> }) =>
      // AC-04: metadata/section edits carry the loaded revision so a stale form is rejected (409).
      api.updateInitiative(initiativeId, { ...patch, ...(data?.revision && !patch.status ? { expectedRevision: data.revision } : {}) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', initiativeId] })
      queryClient.invalidateQueries({ queryKey: ['initiatives'] })
      setAssignmentDialog(false)
      setEditDialog(false)
    },
  })

  if (isLoading) return <div style={{ padding: 24, color: 'var(--foreground-muted)' }}>Loading initiative…</div>
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ background: 'color-mix(in srgb, var(--danger) 10%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 16 }}>
        <strong>Initiative could not be loaded</strong>
        <p style={{ margin: '4px 0 8px', fontSize: 14, color: 'var(--foreground-muted)' }}>{(error as Error).message}</p>
        <button onClick={() => router.navigate({ to: '/initiatives' })} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit' }}>Back to initiatives</button>
      </div>
    </div>
  )
  if (!data) return null

  const nextStatuses = NEXT_STATUS[data.status] ?? []

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => router.navigate({ to: '/initiatives' })} style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', marginBottom: 12, padding: 0 }}>← Initiatives</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span className="font-mono" style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>{data.id}</span>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{data.title}</h2>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>Status: <strong style={{ color: 'var(--foreground)' }}>{data.status}</strong></span>
        {data.horizon && <span>Horizon: {data.horizon}</span>}
        {data.priority && <span>Priority: {data.priority}</span>}
        {data.source && <span>Source: {data.source}{data.sourceId ? ` (${data.sourceId})` : ''}</span>}
        {data.domains.length > 0 && <span>Domains: {data.domains.join(', ')}</span>}
      </div>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setEditDialog(true)} style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Edit initiative</button>
      </div>
      {editDialog && (
        <EditInitiativeDialog
          data={data}
          saving={updateMut.isPending}
          error={updateMut.error ? (updateMut.error as Error).message : null}
          onCancel={() => setEditDialog(false)}
          onSave={(patch) => updateMut.mutate(patch)}
        />
      )}

      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Move to:</span>
          {nextStatuses.map((s) => (
            <button key={s} disabled={updateMut.isPending} onClick={() => updateMut.mutate({ status: s })}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {s}
            </button>
          ))}
          {updateMut.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(updateMut.error as Error).message}</span>}
        </div>
      )}

      <Section title="Declared responsibility">
        <p style={{ marginTop: 0, fontSize: 13, color: 'var(--foreground-muted)' }}>Initiative responsibility is declared metadata and is not inherited by Work Items.</p>
        <div style={{ fontSize: 14 }}>Owners: {data.owners.length ? data.owners.join(', ') : 'Unassigned'}</div>
        <div style={{ fontSize: 14, marginTop: 6 }}>Contributors: {data.contributors.length ? data.contributors.join(', ') : 'None declared'}</div>
        <button disabled={updateMut.isPending} onClick={() => setAssignmentDialog(true)} style={{ marginTop: 12, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Edit assignments</button>
      </Section>
      {assignmentDialog && <AssignmentDialog title={`Edit assignments — ${data.id}`} owners={data.owners} contributors={data.contributors} saving={updateMut.isPending} error={updateMut.error ? (updateMut.error as Error).message : null} onCancel={() => setAssignmentDialog(false)} onSave={(owners, contributors) => updateMut.mutate({ owners, contributors })} />}

      <Section title="Planning Context">
        <InitiativePlanningContext
          initiativeId={data.id}
          epic={data.epic}
          onOpenEpic={(epicId) => router.navigate({ to: '/planning/epics/$id', params: { id: epicId } })}
        />
      </Section>
      <CollaborationOverview data={collaboration.data} loading={collaboration.isLoading} error={Boolean(collaboration.error)} onOpenWorkItem={(id) => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: id } })} />

      <Section title="Progress">
        <div style={{ display: 'flex', gap: 40, fontSize: 14 }}>
          <div>
            <div style={{ color: 'var(--foreground-muted)', fontSize: 12, marginBottom: 4 }}>Planning coverage</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{data.progress.planning.materialized}/{data.progress.planning.totalCandidates}</div>
            <div style={{ color: 'var(--foreground-muted)', fontSize: 12 }}>candidates materialized</div>
          </div>
          <div>
            <div style={{ color: 'var(--foreground-muted)', fontSize: 12, marginBottom: 4 }}>Delivery</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{data.progress.delivery.byState.completed ?? 0}/{data.progress.delivery.total}</div>
            <div style={{ color: 'var(--foreground-muted)', fontSize: 12 }}>Work Items completed</div>
          </div>
        </div>
      </Section>

      <InitiativeCompletion id={data.id} status={data.status} />

      <Section title="Analysis">
        {data.analysis.findings.length === 0
          ? <div style={{ fontSize: 14, color: 'var(--foreground-muted)' }}>No gaps detected.</div>
          : data.analysis.findings.map((f, i) => <FindingRow key={i} f={f} />)}
      </Section>

      <Section title={`Candidates (${data.candidates.length})`}>
        <InitiativeCandidates
          id={data.id}
          candidates={data.candidates}
          onOpenWorkItem={(wiId) => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: wiId } })}
        />
      </Section>

      <Section title={`Associated Work Items (${data.workItems.length})`}>
        {data.workItems.length === 0
          ? <div style={{ fontSize: 14, color: 'var(--foreground-muted)' }}>No Work Items associated yet.</div>
          : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {data.workItems.map((w) => (
                <li key={w.id} style={{ marginBottom: 4 }}>
                  <button onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: w.id } })}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                    {w.id}
                  </button>
                  {' '}{w.title} <span style={{ color: 'var(--foreground-muted)' }}>[{w.status}]</span>
                </li>
              ))}
            </ul>
          )}
      </Section>

      {data.externalLinks.length > 0 && (
        <Section title="External links">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {data.externalLinks.map((l, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {l.integration}:{l.externalId}{l.externalType ? ` (${l.externalType})` : ''}
                {l.externalStatus ? <span style={{ color: 'var(--foreground-muted)' }}> — signal: {l.externalStatus}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}

/** Read the body text under a `## Heading` (case-insensitive), up to the next same/higher heading. */
function extractSection(body: string, heading: string): string {
  const lines = body.split(/\r?\n/)
  const want = heading.trim().toLowerCase()
  let start = -1
  let level = 0
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+(.*)$/)
    if (h && h[2].trim().toLowerCase() === want) { start = i; level = h[1].length; break }
  }
  if (start === -1) return ''
  const out: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const h = lines[i].match(/^(#{1,6})\s+/)
    if (h && h[1].length <= level) break
    out.push(lines[i])
  }
  return out.join('\n').trim()
}

// Edit Initiative metadata + intention (WI-079 AC-02/AC-04). Edits attributes and the "## Goal"
// intention section without replacing the whole document; the loaded revision guards against stale
// forms. Status changes stay on the lifecycle buttons; completion stays in the Completion Review.
function EditInitiativeDialog({ data, saving, error, onCancel, onSave }: {
  data: InitiativeDetailData
  saving: boolean
  error: string | null
  onCancel: () => void
  onSave: (patch: { title?: string; horizon?: string; priority?: string; domains?: string[]; sections?: Record<string, string> }) => void
}) {
  const initialGoal = extractSection(data.body, 'Goal')
  const [title, setTitle] = useState(data.title)
  const [horizon, setHorizon] = useState(data.horizon ?? '')
  const [priority, setPriority] = useState(data.priority ?? '')
  const [domains, setDomains] = useState(data.domains.join(', '))
  const [goal, setGoal] = useState(initialGoal)

  const submit = () => {
    const nextDomains = domains.split(',').map((d) => d.trim()).filter(Boolean)
    const patch: { title?: string; horizon?: string; priority?: string; domains?: string[]; sections?: Record<string, string> } = {}
    if (title.trim() && title.trim() !== data.title) patch.title = title.trim()
    if (horizon.trim() !== (data.horizon ?? '')) patch.horizon = horizon.trim()
    if (priority.trim() !== (data.priority ?? '')) patch.priority = priority.trim()
    if (nextDomains.join(',') !== data.domains.join(',')) patch.domains = nextDomains
    if (goal.trim() !== initialGoal) patch.sections = { Goal: goal.trim() }
    onSave(patch)
  }

  const inputStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }
  const labelStyle = { display: 'grid', gap: 5 } as const
  const btn = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 } as const

  return (
    <div role="dialog" aria-modal="true" aria-label={`Edit initiative ${data.id}`} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', color: 'var(--foreground)' }}>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Edit initiative {data.id}</h3>
          <label style={labelStyle}><span style={{ fontSize: 13, fontWeight: 600 }}>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} /></label>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ ...labelStyle, flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Horizon</span><input value={horizon} onChange={(e) => setHorizon(e.target.value)} placeholder="now, next, later…" style={inputStyle} /></label>
            <label style={{ ...labelStyle, flex: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Priority</span><input value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="high, medium…" style={inputStyle} /></label>
          </div>
          <label style={labelStyle}><span style={{ fontSize: 13, fontWeight: 600 }}>Domains</span><input value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="comma-separated" style={inputStyle} /></label>
          <label style={labelStyle}><span style={{ fontSize: 13, fontWeight: 600 }}>Goal (intention)</span><textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={4} placeholder="Replaces the ## Goal section; other sections are preserved." style={{ ...inputStyle, resize: 'vertical' }} /></label>
          {error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</span>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ ...btn, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }}>Cancel</button>
            <button onClick={submit} disabled={saving || !title.trim()} style={{ ...btn, border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
