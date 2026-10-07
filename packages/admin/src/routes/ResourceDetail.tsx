import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'

export function ResourceDetail() {
  const { resourceId } = useParams({ from: '/resources/$resourceId' })
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: r, isLoading, error } = useQuery({ queryKey: ['resource', resourceId], queryFn: () => api.getResource(resourceId), retry: false })

  const [editing, setEditing] = useState(false)
  const [provider, setProvider] = useState('')
  const [purpose, setPurpose] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [refs, setRefs] = useState<{ id: string; role: string }[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => api.updateResource(resourceId, { provider: provider.trim() || undefined, purpose: purpose.trim() || undefined }),
    onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: ['resource', resourceId] }) },
    onError: (e: unknown) => setActionError(e instanceof Error ? e.message : 'Update failed.'),
  })

  const startDelete = useMutation({
    mutationFn: () => api.deleteResource(resourceId, false),
    onSuccess: (res) => { setRefs(res.preview?.references ?? []); setConfirmingDelete(true) },
    onError: (e: unknown) => setActionError(e instanceof Error ? e.message : 'Could not check references.'),
  })
  const doDelete = useMutation({
    mutationFn: () => api.deleteResource(resourceId, true),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['resources'] }); router.navigate({ to: '/resources' }) },
    onError: (e: unknown) => setActionError(e instanceof Error ? e.message : 'Delete failed.'),
  })

  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>
  if (error || !r) return <div style={{ padding: 24, color: 'var(--danger)' }}>{(error as Error)?.message ?? 'Not found.'}</div>

  return (
    <div style={{ padding: '24px 32px', maxWidth: 820, margin: '0 auto' }}>
      <button onClick={() => router.navigate({ to: '/resources' })} style={back}>← Resources</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
        <div>
          <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground-muted)' }}>{r.id}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 0' }}>{r.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setProvider(r.provider ?? ''); setPurpose(r.purpose ?? ''); setEditing((v) => !v); setActionError(null) }} style={btn}>{editing ? 'Cancel' : 'Edit'}</button>
          <button onClick={() => { setActionError(null); startDelete.mutate() }} style={{ ...btn, color: 'var(--danger)' }}>Delete</button>
        </div>
      </div>

      {actionError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{actionError}</p>}

      {confirmingDelete && (
        <div style={{ ...card, borderColor: 'var(--danger)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Delete {r.id}?</p>
          {refs.length > 0 ? (
            <>
              <p style={{ margin: '0 0 6px', fontSize: 13 }}>It is referenced by (these references are NOT removed):</p>
              <ul style={{ margin: '0 0 10px', fontSize: 13 }}>{refs.map((x, i) => <li key={i}><span className="font-mono">{x.id}</span> — {x.role}</li>)}</ul>
            </>
          ) : <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--foreground-muted)' }}>Nothing references it.</p>}
          <button onClick={() => doDelete.mutate()} style={{ ...btn, background: 'var(--danger)', color: '#fff', border: 'none' }}>{doDelete.isPending ? 'Deleting…' : 'Confirm delete'}</button>
          <button onClick={() => setConfirmingDelete(false)} style={{ ...btn, marginLeft: 8 }}>Cancel</button>
        </div>
      )}

      {editing && (
        <div style={card}>
          <label style={lbl}>Provider<input value={provider} onChange={(e) => setProvider(e.target.value)} style={input} /></label>
          <label style={lbl}>Purpose<textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></label>
          <button disabled={save.isPending} onClick={() => save.mutate()} style={{ ...btn, background: 'var(--primary)', color: 'var(--primary-foreground, #141b2d)', border: 'none' }}>{save.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      )}

      <Section title="Details">
        <Grid rows={[
          ['Type', r.resourceType ?? '—'],
          ['Provider', r.provider ?? '—'],
          ['Scope', r.scope ? (r.scope.module ? `${r.scope.type}/${r.scope.module}` : r.scope.type) : '—'],
          ['Environments', r.environments.join(', ') || '—'],
          ['Used by modules', r.modules.join(', ') || '—'],
          ['Purpose', r.purpose ?? '—'],
        ]} />
      </Section>

      {r.interfaces.length > 0 && (
        <Section title="Access interfaces">
          {r.interfaces.map((i, idx) => (
            <div key={idx} style={{ fontSize: 14, marginBottom: 6 }}>
              <span className="font-mono" style={{ fontWeight: 600 }}>{i.type}</span>{i.tool || i.provider ? ` (${i.tool ?? i.provider})` : ''}
              {i.purpose && <span style={{ color: 'var(--foreground-muted)' }}> — {i.purpose}</span>}
            </div>
          ))}
        </Section>
      )}

      {Object.keys(r.boundaries).length > 0 && (
        <Section title="Access boundaries">
          <Grid rows={Object.entries(r.boundaries).map(([env, ops]) => [env, ops.join(', ')])} />
        </Section>
      )}

      {(r.authRefs.length > 0 || r.authMode) && (
        <Section title="Authentication (references only — never values)">
          <Grid rows={[['Mode', r.authMode ?? '—'], ['References', r.authRefs.join(', ') || '—']]} />
        </Section>
      )}

      {r.references.length > 0 && (
        <Section title="Related Work Items">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {r.references.map((x, i) => (
              <button key={i} onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: x.id } })} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 14 }}>
                <span className="font-mono" style={{ fontWeight: 600 }}>{x.id}</span> — {x.role} →
              </button>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: '0 0 8px' }}>{title}</h3>
      {children}
    </div>
  )
}
function Grid({ rows }: { rows: (string | null)[][] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: '8px 16px', fontSize: 14 }}>
      {rows.map(([k, v], i) => (<><span key={`k${i}`} style={{ color: 'var(--foreground-muted)' }}>{k}</span><span key={`v${i}`} style={{ whiteSpace: 'pre-wrap' }}>{v}</span></>))}
    </div>
  )
}

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginTop: 12 }
const btn: React.CSSProperties = { padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }
const back: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 13 }
const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: 14, width: '100%' }
const lbl: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--foreground-muted)', marginBottom: 10 }
