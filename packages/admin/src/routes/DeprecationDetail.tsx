import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { api, type DeprecationTarget } from '../lib/api'

export function DeprecationDetail() {
  const { planId } = useParams({ from: '/deprecations/$planId' })
  const router = useRouter()
  const { data: plan, isLoading, error } = useQuery({ queryKey: ['deprecation', planId], queryFn: () => api.getDeprecation(planId), retry: false })
  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (error || !plan) return <div style={{ padding: 24, color: 'var(--danger)' }}>{(error as Error)?.message ?? 'Not found.'}</div>
  return <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
    <button onClick={() => router.navigate({ to: '/deprecations' })} style={back}>← Deprecations</button>
    <h2 style={{ fontSize: 22, margin: '10px 0 2px' }}><span className="font-mono">{plan.id}</span> {plan.title}</h2>
    {plan.purpose && <p style={{ color: 'var(--foreground-muted)' }}>{plan.purpose}</p>}
    <Section title="Pipeline"><div style={chips}>{Object.entries(plan.pipeline).map(([state, count]) => <span key={state} style={chip}><b>{count}</b> {state}</span>)}</div></Section>
    <Section title="Retirement waves">{plan.dependency.waves.map((wave, index) => <div key={index} style={{ marginBottom: 6 }}>Wave {index + 1}: <span className="font-mono">{wave.join(', ')}</span></div>)}{plan.dependency.blocked.map((item) => <div key={item.target} style={{ color: 'var(--danger)' }}>{item.target}: {item.reason}</div>)}</Section>
    <Section title="Environment matrix"><table style={table}><thead><tr><th>Target</th><th>Dev</th><th>Test</th><th>Prod</th><th>Lifecycle</th><th>Wave</th></tr></thead><tbody>{plan.targets.map((target) => <tr key={target.id} onClick={() => router.navigate({ to: '/deprecations/$planId', params: { planId } })}><td className="font-mono">{target.id}</td><td>{target.environment.perEnvironment.development}</td><td>{target.environment.perEnvironment.test}</td><td>{target.environment.perEnvironment.production}</td><td>{target.lifecycle}</td><td>{target.wave ?? '—'}</td></tr>)}</tbody></table></Section>
    <Section title="Board"><div style={board}>{plan.board.filter((column) => column.count > 0).map((column) => <div key={column.state} style={columnStyle}><b>{column.state}</b><small>{column.count} target(s)</small>{column.targets.map((id) => <span key={id} className="font-mono" style={ticket}>{id}</span>)}</div>)}</div></Section>
    <Section title="Targets">{plan.targets.map((target) => <Target key={target.id} target={target} />)}</Section>
  </div>
}
function Target({ target }: { target: DeprecationTarget }) { return <div style={targetCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><b className="font-mono">{target.id}</b> <span>{target.title ?? target.locator ?? target.type}</span></div><span>{target.lifecycle}</span></div><div style={details}>Type: {target.type} · Locator: {target.locator ?? '—'} · Module: {target.module ?? '—'} · Resource: {target.resource?.id ?? '—'}</div><div style={details}>Dependencies: {target.dependsOnRemoval.join(', ') || '—'} · Dependents: {target.dependents.join(', ') || '—'} · Wave: {target.wave ?? '—'}</div><div style={details}>Observation: {target.observation.reasons.join(' ')}</div>{target.runbooks.length > 0 && <div style={details}>Runbooks: {target.runbooks.map((runbook) => `${runbook.id} (${runbook.approval.status})`).join(', ')}</div>}</div> }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section style={{ marginTop: 24 }}><h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>{title}</h3>{children}</section> }
const back: React.CSSProperties = { background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit' }
const chips: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const chip: React.CSSProperties = { padding: '5px 8px', background: 'var(--surface-muted)', borderRadius: 'var(--radius)', fontSize: 12 }
const table: React.CSSProperties = { borderCollapse: 'collapse', width: '100%', fontSize: 13 }
const board: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }
const columnStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }
const ticket: React.CSSProperties = { padding: 6, background: 'var(--surface-muted)', fontSize: 12 }
const targetCard: React.CSSProperties = { padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 10 }
const details: React.CSSProperties = { color: 'var(--foreground-muted)', fontSize: 12, marginTop: 7 }
