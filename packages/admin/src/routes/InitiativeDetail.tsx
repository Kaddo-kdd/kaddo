import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { InitiativeFinding } from '../lib/api'

const card = {
  border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)',
  padding: 16, marginBottom: 16,
} as const

const NEXT_STATUS: Record<string, string[]> = {
  candidate: ['planned', 'cancelled'],
  planned: ['in-progress', 'deferred', 'cancelled'],
  'in-progress': ['completed', 'deferred', 'cancelled'],
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['initiative', initiativeId],
    queryFn: () => api.getInitiative(initiativeId),
  })

  const updateMut = useMutation({
    mutationFn: (status: string) => api.updateInitiative(initiativeId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative', initiativeId] })
      queryClient.invalidateQueries({ queryKey: ['initiatives'] })
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
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 20, flexWrap: 'wrap' }}>
        <span>Status: <strong style={{ color: 'var(--foreground)' }}>{data.status}</strong></span>
        {data.horizon && <span>Horizon: {data.horizon}</span>}
        {data.priority && <span>Priority: {data.priority}</span>}
        {data.source && <span>Source: {data.source}{data.sourceId ? ` (${data.sourceId})` : ''}</span>}
        {data.domains.length > 0 && <span>Domains: {data.domains.join(', ')}</span>}
      </div>

      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>Move to:</span>
          {nextStatuses.map((s) => (
            <button key={s} disabled={updateMut.isPending} onClick={() => updateMut.mutate(s)}
              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {s}
            </button>
          ))}
          {updateMut.error && <span style={{ color: 'var(--danger)', fontSize: 13 }}>{(updateMut.error as Error).message}</span>}
        </div>
      )}

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

      <Section title="Completion readiness">
        <div style={{ fontSize: 14, color: data.completion.ready ? 'var(--primary)' : 'var(--foreground)' }}>
          {data.completion.ready ? '✓ Ready for completion' : '○ Not ready'}
        </div>
        {data.completion.reasons.length > 0 && (
          <ul style={{ margin: '8px 0 0 18px', fontSize: 13, color: 'var(--foreground-muted)' }}>
            {data.completion.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </Section>

      <Section title="Analysis">
        {data.analysis.findings.length === 0
          ? <div style={{ fontSize: 14, color: 'var(--foreground-muted)' }}>No gaps detected.</div>
          : data.analysis.findings.map((f, i) => <FindingRow key={i} f={f} />)}
      </Section>

      <Section title={`Candidates (${data.candidates.length})`}>
        {data.candidates.length === 0
          ? <div style={{ fontSize: 14, color: 'var(--foreground-muted)' }}>No candidates.</div>
          : (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
              {data.candidates.map((c) => (
                <li key={c.id} style={{ marginBottom: 4 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--foreground-muted)' }}>{c.id}</span> {c.title}
                  {c.materializedAs ? <span style={{ color: 'var(--primary)' }}> → {c.materializedAs}</span> : <span style={{ color: 'var(--foreground-muted)' }}> (pending)</span>}
                </li>
              ))}
            </ul>
          )}
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
