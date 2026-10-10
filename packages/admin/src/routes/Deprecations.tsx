import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { api } from '../lib/api'

export function Deprecations() {
  const router = useRouter()
  const { data, isLoading, error } = useQuery({ queryKey: ['deprecations'], queryFn: () => api.getDeprecations(), retry: false })
  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (error) return <div style={{ padding: 24, color: 'var(--danger)' }}>{(error as Error).message}</div>
  const plans = data?.plans ?? []
  return <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
    <h2 style={{ fontSize: 22, margin: 0 }}>Deprecations</h2>
    <p style={{ color: 'var(--foreground-muted)', marginTop: 4 }}>Controlled retirement plans, derived from canonical Kaddo knowledge.</p>
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
