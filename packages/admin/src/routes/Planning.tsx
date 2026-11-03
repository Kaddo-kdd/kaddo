import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Map as MapIcon, Milestone as MilestoneIcon, Boxes, AlertTriangle, ArrowRight, Target } from 'lucide-react'
import {
  getPlanningOverview, getPlanDetail, getEpicDetail,
  type PlanningDelivery, type PlanningFinding, type InitiativeInPlanning,
} from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { Initiatives } from './Initiatives'

function DeliveryBar({ d }: { d: PlanningDelivery }) {
  return <span style={muted}>delivery {d.completed}/{d.total} completed{d.blocked ? ` · ${d.blocked} blocked` : ''}</span>
}
function Findings({ findings }: { findings: PlanningFinding[] }) {
  if (findings.length === 0) return null
  return (
    <div style={findingsBox}>
      <strong style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={15} /> Planning checks</strong>
      {findings.map((f, i) => <div key={i} style={{ ...muted, color: f.level === 'error' ? 'var(--danger)' : 'var(--warning)' }}>{f.message}</div>)}
    </div>
  )
}
function ReadinessNote() {
  return <p style={mutedSmall}>Completion is never automatic — closing a Plan or Epic always requires human approval, even when all work is done.</p>
}

// --- Unified Planning (tabs: Overview / Delivery Plans / Epics / Initiatives) ---

type PlanningTab = 'overview' | 'plans' | 'epics' | 'initiatives'

function InitiativeCard({ i, onOpen }: { i: InitiativeInPlanning; onOpen: (id: string) => void }) {
  return (
    <button style={card} onClick={() => onOpen(i.id)}>
      <div style={cardTop}><StatusBadge variant="info">{i.status}</StatusBadge><span style={mono}>{i.id}</span></div>
      <strong>{i.title}</strong>
      <span style={muted}>{i.epic ? `in ${i.epic}` : 'independent (no epic)'}{i.owners.length ? ` · owner(s): ${i.owners.join(', ')}` : ''}</span>
      {/* Planning Coverage (materialized candidates) is distinct from Delivery (linked Work Items). */}
      <span style={muted}>coverage {i.planning.materialized}/{i.planning.totalCandidates} materialized</span>
      <span style={muted}>{i.hasWorkItems ? `delivery ${i.delivery.completed ?? 0}/${i.delivery.total} completed` : 'No Work Items linked'}</span>
    </button>
  )
}

export function Planning({ initialTab = 'overview' }: { initialTab?: PlanningTab }) {
  const router = useRouter()
  const [tab, setTab] = useState<PlanningTab>(initialTab)
  const q = useQuery({ queryKey: ['planning'], queryFn: getPlanningOverview, retry: false })

  const tabs: { id: PlanningTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Delivery Plans' },
    { id: 'epics', label: 'Epics' },
    { id: 'initiatives', label: 'Initiatives' },
  ]

  const Header = (
    <>
      <header style={header}>
        <div>
          <h2 style={heading}><MapIcon size={22} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: 8 }} />Planning</h2>
          <p style={subheading}>Understand, organize and track the project's work. Delivery Plans and Epics are optional — Initiatives and Work Items work without them.</p>
        </div>
      </header>
      <div role="tablist" aria-label="Planning sections" style={tabBar}>
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} style={{ ...tabBtn, ...(tab === t.id ? tabBtnActive : {}) }}>{t.label}</button>
        ))}
      </div>
    </>
  )

  if (q.isLoading) return <div style={page}>{Header}<p style={muted}>Loading Planning…</p></div>
  if (q.error) return <div style={page}>{Header}<EmptyState title="Planning unavailable" description={(q.error as Error).message} action={{ label: 'Retry', onClick: () => void q.refetch() }} /></div>
  const data = q.data!
  const t = data.totals
  const hasAny = t.plans + t.epics + t.initiatives > 0

  const Plans = (
    <section style={section}>
      <h3 style={h3}><MapIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Delivery Plans</h3>
      {data.plans.length === 0 ? <p style={muted}>No delivery plans yet. Plans are optional — create one with <code>kaddo plan create</code> to group milestones and Epics.</p> : (
        <div style={cardGrid}>
          {data.plans.map((p) => (
            <button key={p.id} style={card} onClick={() => router.navigate({ to: '/planning/plans/$id', params: { id: p.id } })}>
              <div style={cardTop}><StatusBadge variant="info">{p.status}</StatusBadge><span style={mono}>{p.id}</span></div>
              <strong>{p.title}</strong>
              <span style={muted}>{p.milestones} milestone(s) · {p.epics} epic(s)</span>
              <DeliveryBar d={p.delivery} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
  const Epics = (
    <section style={section}>
      <h3 style={h3}><Boxes size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Epics</h3>
      {data.epics.length === 0 ? <p style={muted}>No epics yet. Epics are optional — they group work across Initiatives and Work Items.</p> : (
        <div style={cardGrid}>
          {data.epics.map((e) => (
            <button key={e.id} style={card} onClick={() => router.navigate({ to: '/planning/epics/$id', params: { id: e.id } })}>
              <div style={cardTop}><StatusBadge variant="info">{e.status}</StatusBadge><span style={mono}>{e.id}</span></div>
              <strong>{e.title}</strong>
              <span style={muted}>{e.plan ? `${e.plan}${e.milestone ? ` · ${e.milestone}` : ''}` : 'unassigned to a plan'}</span>
              <DeliveryBar d={e.delivery} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
  const InitiativesOverview = (
    <section style={section}>
      <h3 style={h3}><Target size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Initiatives</h3>
      {data.initiatives.length === 0 ? <p style={muted}>No initiatives yet.</p> : (
        <div style={cardGrid}>
          {data.initiatives.map((i) => <InitiativeCard key={i.id} i={i} onOpen={(id) => router.navigate({ to: '/initiatives/$initiativeId', params: { initiativeId: id } })} />)}
        </div>
      )}
    </section>
  )

  return (
    <div style={page}>
      {Header}
      {tab === 'overview' && (
        <>
          {!hasAny ? (
            <EmptyState title="Planning is optional" description="This project has no Plans, Epics or Initiatives yet. Start with an Initiative to group outcomes, add an Epic when work spans several Work Items, and a Delivery Plan to organize milestones. Work Items work on their own too." action={{ label: 'View Work Items', onClick: () => router.navigate({ to: '/work-items' }) }} />
          ) : (
            <>
              <section style={grid}>
                <Metric label="Delivery Plans" value={t.plans} />
                <Metric label="Epics" value={t.epics} />
                <Metric label="Initiatives" value={t.initiatives} />
                <Metric label="Work Items linked" value={t.workItems} />
                <Metric label="Blocked Work Items" value={t.blockedWorkItems} />
                {t.epicsWithPendingDependencies > 0 && <Metric label="Epics with pending dependencies" value={t.epicsWithPendingDependencies} />}
                <Metric label="Initiatives without Epic" value={t.unassignedInitiatives} />
              </section>
              <Findings findings={data.findings} />
              {t.plans === 0 && t.epics === 0 && t.initiatives > 0 && (
                <p style={mutedSmall}>This project organizes work with Initiatives. You can optionally group them into Epics and Delivery Plans — nothing is required or migrated.</p>
              )}
              {Plans}
              {Epics}
              {InitiativesOverview}
            </>
          )}
        </>
      )}
      {tab === 'plans' && Plans}
      {tab === 'epics' && Epics}
      {tab === 'initiatives' && <div style={{ marginTop: 8 }}><Initiatives /></div>}
    </div>
  )
}

// --- Plan detail -----------------------------------------------------------

export function PlanDetail({ id }: { id: string }) {
  const router = useRouter()
  const q = useQuery({ queryKey: ['planning', 'plan', id], queryFn: () => getPlanDetail(id), retry: false })
  if (q.isLoading) return <div style={page}>Loading plan…</div>
  if (q.error) return <div style={page}><EmptyState title="Plan not found" description={(q.error as Error).message} action={{ label: 'Back to Planning', onClick: () => router.navigate({ to: '/planning' }) }} /></div>
  const p = q.data!
  return (
    <div style={page}>
      <button style={back} onClick={() => router.navigate({ to: '/planning' })}>← Planning</button>
      <h2 style={heading}>{p.title}</h2>
      <p style={subheading}><span style={mono}>{p.id}</span> · <StatusBadge variant="info">{p.status}</StatusBadge></p>
      {p.objective && <p style={muted}>{p.objective}</p>}
      <Findings findings={p.findings} />

      <section style={grid}>
        <Metric label="Epics" value={p.progress.epics.total} />
        <Metric label="Initiatives" value={p.progress.planning.initiatives} />
        <Metric label="Work Items" value={p.progress.delivery.total} />
        <Metric label="Completed" value={p.progress.delivery.completed} />
        <Metric label="Blocked" value={p.progress.delivery.blocked} />
      </section>
      <ReadinessNote />

      <section style={section}>
        <h3 style={h3}><MilestoneIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Milestones</h3>
        {p.milestones.length === 0 ? <p style={muted}>No milestones defined.</p> : p.milestones.map((m) => (
          <div key={m.id} style={row}><strong style={mono}>{m.id}</strong> {m.title}{m.exitCriteria.length > 0 && <ul style={list}>{m.exitCriteria.map((c, i) => <li key={i}>{c}</li>)}</ul>}</div>
        ))}
      </section>

      <section style={section}>
        <h3 style={h3}><Boxes size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Epics</h3>
        {p.epics.length === 0 ? <p style={muted}>No epics in this plan yet.</p> : (
          <div style={cardGrid}>
            {p.epics.map((e) => (
              <button key={e.id} style={card} onClick={() => router.navigate({ to: '/planning/epics/$id', params: { id: e.id } })}>
                <div style={cardTop}><StatusBadge variant={e.blocked.length ? 'warning' : 'info'}>{e.status}</StatusBadge><span style={mono}>{e.id}</span></div>
                <strong>{e.title}</strong>
                <span style={muted}>{e.milestone ?? '—'}</span>
                <DeliveryBar d={e.delivery} />
                {e.blocked.length > 0 && <span style={{ ...mutedSmall, color: 'var(--warning)' }}>blocked by {e.blocked.join(', ')}</span>}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// --- Epic detail -----------------------------------------------------------

export function EpicDetail({ id }: { id: string }) {
  const router = useRouter()
  const q = useQuery({ queryKey: ['planning', 'epic', id], queryFn: () => getEpicDetail(id), retry: false })
  if (q.isLoading) return <div style={page}>Loading epic…</div>
  if (q.error) return <div style={page}><EmptyState title="Epic not found" description={(q.error as Error).message} action={{ label: 'Back to Planning', onClick: () => router.navigate({ to: '/planning' }) }} /></div>
  const e = q.data!
  const r = e.progress.readiness
  return (
    <div style={page}>
      <button style={back} onClick={() => (e.plan ? router.navigate({ to: '/planning/plans/$id', params: { id: e.plan } }) : router.navigate({ to: '/planning' }))}>← {e.plan ?? 'Planning'}</button>
      <h2 style={heading}>{e.title}</h2>
      <p style={subheading}><span style={mono}>{e.id}</span> · <StatusBadge variant="info">{e.status}</StatusBadge>{e.plan && <> · {e.plan}{e.milestone ? ` / ${e.milestone}` : ''}</>}</p>
      {e.outcome && <p style={muted}><strong>Outcome:</strong> {e.outcome}</p>}
      <Findings findings={e.findings} />

      <section style={grid}>
        <Metric label="Work Items" value={e.progress.delivery.total} />
        <Metric label="Completed" value={e.progress.delivery.completed} />
        <Metric label="Blocked" value={e.progress.delivery.blocked} />
        <Metric label="Success criteria" value={r.successCriteria} />
        <Metric label="Preconditions met" value={r.meetsCompletionPreconditions ? 'Yes' : 'No'} />
      </section>
      <ReadinessNote />
      {r.blockingDependencies.length > 0 && <p style={{ ...muted, color: 'var(--warning)' }}>Blocking dependencies: {r.blockingDependencies.join(', ')}</p>}

      <section style={section}>
        <h3 style={h3}>Initiatives & responsibilities</h3>
        {e.initiatives.length === 0 ? <p style={muted}>No initiatives associated.</p> : e.initiatives.map((i) => (
          <div key={i.id} style={row}>
            <a style={link} onClick={() => router.navigate({ to: '/initiatives/$initiativeId', params: { initiativeId: i.id } })}><span style={mono}>{i.id}</span> {i.title}</a> <StatusBadge variant="muted">{i.status}</StatusBadge>
            <div style={mutedSmall}>{i.owners.length ? <>owner(s): {i.owners.join(', ')}</> : 'unassigned'}{i.contributors.length ? ` · contributors: ${i.contributors.join(', ')}` : ''}</div>
          </div>
        ))}
      </section>

      <section style={section}>
        <h3 style={h3}>Work Items</h3>
        {e.workItems.length === 0 ? <p style={muted}>No work items yet.</p> : e.workItems.map((w) => (
          <div key={w.id} style={row}>
            <a style={link} onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: w.id } })}><span style={mono}>{w.id}</span> {w.title}</a> <StatusBadge variant="muted">{w.status}</StatusBadge> <ArrowRight size={13} color="var(--foreground-muted)" />
          </div>
        ))}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div style={metricCard}><span>{label}</span><strong>{String(value)}</strong></div>
}

const page: React.CSSProperties = { padding: '24px 32px', maxWidth: 1180, margin: '0 auto' }
const heading: React.CSSProperties = { margin: 0, fontSize: 24 }
const h3: React.CSSProperties = { margin: '0 0 8px' }
const subheading: React.CSSProperties = { color: 'var(--foreground-muted)', margin: '6px 0 0', maxWidth: 820 }
const header: React.CSSProperties = { marginBottom: 12 }
const tabBar: React.CSSProperties = { display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: 8 }
const tabBtn: React.CSSProperties = { padding: '8px 14px', border: 'none', borderBottom: '2px solid transparent', background: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', font: 'inherit', fontSize: 14 }
const tabBtnActive: React.CSSProperties = { color: 'var(--foreground)', borderBottomColor: 'var(--primary)', fontWeight: 600 }
const section: React.CSSProperties = { marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16 }
const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginTop: 8 }
const card: React.CSSProperties = { textAlign: 'left', display: 'grid', gap: 6, padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', font: 'inherit', color: 'var(--foreground)' }
const cardTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const metricCard: React.CSSProperties = { padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', display: 'grid', gap: 6, color: 'var(--foreground-muted)', fontSize: 13 }
const muted: React.CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const mutedSmall: React.CSSProperties = { color: 'var(--foreground-muted)', fontSize: 12, margin: '4px 0 0' }
const mono: React.CSSProperties = { fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }
const row: React.CSSProperties = { padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }
const list: React.CSSProperties = { margin: '4px 0 0', paddingLeft: 18, color: 'var(--foreground-muted)', fontSize: 13 }
const back: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', font: 'inherit', padding: 0, marginBottom: 10 }
const link: React.CSSProperties = { color: 'var(--primary)', cursor: 'pointer', textDecoration: 'none' }
const findingsBox: React.CSSProperties = { margin: '14px 0', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', display: 'grid', gap: 4 }
