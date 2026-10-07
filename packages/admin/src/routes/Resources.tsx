import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'
import type { ResourceSummary } from '../lib/api'

const RESOURCE_TYPES = ['database', 'cloud', 'api', 'queue', 'storage', 'repository', 'platform', 'service', 'other']

/** Group resources by ownership scope for multirepo projects (System, then per module). */
function groupByScope(resources: ResourceSummary[]): { label: string; items: ResourceSummary[] }[] {
  const system: ResourceSummary[] = []
  const byModule = new Map<string, ResourceSummary[]>()
  for (const r of resources) {
    if (r.scope?.type === 'module' && r.scope.module) {
      const list = byModule.get(r.scope.module) ?? []
      list.push(r); byModule.set(r.scope.module, list)
    } else {
      system.push(r)
    }
  }
  const groups: { label: string; items: ResourceSummary[] }[] = []
  if (system.length) groups.push({ label: 'System', items: system })
  for (const [mod, items] of [...byModule.entries()].sort()) groups.push({ label: mod, items })
  return groups
}

export function Resources() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['resources'], queryFn: () => api.getResources(), retry: false })

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('database')
  const [provider, setProvider] = useState('')
  const [scopeType, setScopeType] = useState('system')
  const [moduleId, setModuleId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => api.createResource({
      title: title.trim(), resourceType: type, provider: provider.trim() || undefined,
      scope: scopeType === 'module' ? { type: 'module', module: moduleId.trim() } : { type: 'system' },
    }),
    onSuccess: (res) => {
      setShowForm(false); setTitle(''); setProvider(''); setModuleId(''); setScopeType('system'); setFormError(null)
      queryClient.invalidateQueries({ queryKey: ['resources'] })
      router.navigate({ to: '/resources/$resourceId', params: { resourceId: res.id } })
    },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Could not create the resource.'),
  })

  if (isLoading) return <div style={{ padding: 24 }}>Loading…</div>
  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>{(error as Error).message}</div>

  const resources = data?.resources ?? []
  const groups = groupByScope(resources)

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Resources</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: 14, margin: '4px 0 0' }}>
            External systems this project uses. Read-only knowledge — never connected, never stores secrets.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} style={btnPrimary}>{showForm ? 'Cancel' : '+ New resource'}</button>
      </div>

      {showForm && (
        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Name"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Supabase Main" style={input} /></Field>
            <Field label="Type">
              <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Provider (optional)"><input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="supabase" style={input} /></Field>
            <Field label="Scope">
              <select value={scopeType} onChange={(e) => setScopeType(e.target.value)} style={input}>
                <option value="system">system</option>
                <option value="module">module</option>
              </select>
            </Field>
            {scopeType === 'module' && <Field label="Module id"><input value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="orders-api" style={input} /></Field>}
          </div>
          {formError && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{formError}</p>}
          <div style={{ marginTop: 12 }}>
            <button disabled={!title.trim() || create.isPending} onClick={() => create.mutate()} style={btnPrimary}>
              {create.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {resources.length === 0 && !showForm && (
        <div style={{ ...card, color: 'var(--foreground-muted)' }}>No Project Resources yet. Create one, or add Markdown under <code>knowledge/tech/resources/</code>.</div>
      )}

      {groups.map((g) => (
        <div key={g.label} style={{ marginBottom: 20 }}>
          {groups.length > 1 && <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--foreground-muted)', letterSpacing: 0.4, margin: '0 0 8px' }}>{g.label}</h3>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.items.map((r) => (
              <button key={r.id} onClick={() => router.navigate({ to: '/resources/$resourceId', params: { resourceId: r.id } })} style={row}>
                <div>
                  <div className="font-mono" style={{ fontWeight: 600 }}>{r.id}</div>
                  <div style={{ fontSize: 13, color: 'var(--foreground-muted)' }}>{r.title}</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--foreground-muted)', textAlign: 'right' }}>
                  <div>{r.resourceType ?? '—'}{r.provider ? ` · ${r.provider}` : ''}</div>
                  {r.modules.length > 0 && <div style={{ fontSize: 12 }}>used by: {r.modules.join(', ')}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      <span style={{ color: 'var(--foreground-muted)' }}>{label}</span>
      {children}
    </label>
  )
}

const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }
const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', color: 'var(--foreground)', fontFamily: 'inherit', fontSize: 14 }
const btnPrimary: React.CSSProperties = { padding: '8px 14px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'var(--primary-foreground, #141b2d)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }
