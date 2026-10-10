import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'

export function Deprecations() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['deprecations'], queryFn: () => api.getDeprecations(), retry: false })
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')

  const createMutation = useMutation({
    mutationFn: () => api.createDeprecation({ title: title.trim(), purpose: purpose.trim() || undefined }),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['deprecations'] })
      setCreating(false); setTitle(''); setPurpose('')
      router.navigate({ to: '/deprecations/$planId', params: { planId: plan.id } })
    },
  })

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>{(error as Error).message}</div>
  const plans = data?.plans ?? []

  return <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, margin: 0 }}>Deprecations</h2>
        <p style={{ color: 'var(--foreground-muted)', marginTop: 4 }}>Plan and track controlled retirement of legacy functionality.</p>
      </div>
      {!creating && <button onClick={() => setCreating(true)} style={primaryBtn}>+ New Deprecation</button>}
    </div>

    {creating && <form style={{ ...card, display: 'grid', gap: 12, marginBottom: 16 }} onSubmit={(e) => { e.preventDefault(); if (title.trim()) createMutation.mutate() }}>
      <strong style={{ fontSize: 15 }}>New Deprecation</strong>
      <label style={label}>Title
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Retiro del flujo legacy de créditos" style={input} />
      </label>
      <label style={label}>What do you want to retire?
        <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} placeholder="Queremos retirar la funcionalidad anterior de créditos y cualquier componente que exista únicamente para soportarla." style={{ ...input, resize: 'vertical' }} />
      </label>
      <p style={safety}>Creating a Deprecation Plan records an intent to investigate retirement. It does not authorize removal.</p>
      {createMutation.isError && <p style={{ color: 'var(--danger)', margin: 0, fontSize: 13 }}>{(createMutation.error as Error).message}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={!title.trim() || createMutation.isPending} style={primaryBtn}>{createMutation.isPending ? 'Creating…' : 'Create draft'}</button>
        <button type="button" onClick={() => { setCreating(false); createMutation.reset() }} style={ghostBtn}>Cancel</button>
      </div>
      <p style={{ color: 'var(--foreground-muted)', margin: 0, fontSize: 12 }}>
        Have several things to retire? Use an MCP-connected agent — it can analyze, group and propose one or more plans.
      </p>
    </form>}

    {plans.length === 0 ? <div style={card}>No Deprecation Plans yet.</div> : <div style={{ display: 'grid', gap: 12 }}>
      {plans.map((plan) => <button key={plan.id} onClick={() => router.navigate({ to: '/deprecations/$planId', params: { planId: plan.id } })} style={row}>
        <div><strong className="font-mono">{plan.id}</strong><div style={{ marginTop: 3 }}>{plan.title}</div></div>
        <div style={metrics}>{[['Targets', plan.summary.targets], ['Soft', plan.summary.softDeprecated], ['Dev/Test', plan.summary.devTestRemoved], ['Prod pending', plan.summary.productionPending], ['Completed', plan.summary.completed]].map(([label, value]) => <span key={String(label)}><b>{value}</b> {label}</span>)}</div>
      </button>)}
    </div>}
  </div>
}

const card: React.CSSProperties = { padding: 16, border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)' }
const row: React.CSSProperties = { ...card, display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', color: 'var(--foreground)', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }
const metrics: React.CSSProperties = { display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end', color: 'var(--foreground-muted)', fontSize: 12 }
const label: React.CSSProperties = { display: 'grid', gap: 5, fontSize: 13, color: 'var(--foreground-muted)' }
const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', borderRadius: 'var(--radius)', font: 'inherit', fontSize: 14 }
const safety: React.CSSProperties = { margin: 0, padding: '8px 10px', fontSize: 12.5, color: 'var(--foreground-muted)', background: 'var(--background)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }
const primaryBtn: React.CSSProperties = { padding: '8px 14px', border: '1px solid var(--accent, #4f7cff)', background: 'var(--accent, #4f7cff)', color: '#fff', borderRadius: 'var(--radius)', cursor: 'pointer', font: 'inherit', fontSize: 14, fontWeight: 600 }
const ghostBtn: React.CSSProperties = { padding: '8px 14px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', borderRadius: 'var(--radius)', cursor: 'pointer', font: 'inherit', fontSize: 14 }
