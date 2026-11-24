import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearch } from '@tanstack/react-router'
import { Map as MapIcon, Boxes, AlertTriangle, ArrowRight } from 'lucide-react'
import {
  api, getPlanningOverview, getPlanDetail, getEpicDetail, disassociateInitiative,
  type PlanningDelivery, type PlanningFinding,
} from '../lib/api'
import { EmptyState } from '../components/EmptyState'
import { StatusBadge } from '../components/StatusBadge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  CreatePlanDrawer, EditPlanDrawer, MilestonesDrawer,
  CreateEpicDrawer, EditEpicDrawer, AssociateInitiativeDrawer,
} from '../components/PlanningManage'
import { PlanningCompletion } from '../components/PlanningCompletion'
import { MilestonesTracking } from '../components/MilestonesTracking'
import { PlanningInsights } from '../components/PlanningInsights'
import { NextActions } from '../components/NextActions'
import { PlanningBreadcrumb, type Crumb } from '../components/PlanningBreadcrumb'
import { originFrom, type FromContext } from '../lib/planning-nav'
import type { InsightArtifactKind } from '../lib/api'
import { Initiatives } from './Initiatives'
import { CollaborationOverview } from '../components/CollaborationOverview'
import { SectionTabs, type Section } from '../components/SectionTabs'

// WI-088 — open a Planning entity carrying a return path (and optional target section) so the detail can
// restore the origin tab/filter on Back. Global routes still resolve with no context.
function useOpenWithContext() {
  const router = useRouter()
  return (kind: InsightArtifactKind, id: string, section?: string) => {
    const search = { from: originFrom('/planning'), fromLabel: 'Planning' }
    const hash = section
    if (kind === 'plan') router.navigate({ to: '/planning/plans/$id', params: { id }, hash, search })
    else if (kind === 'epic') router.navigate({ to: '/planning/epics/$id', params: { id }, hash, search })
    else if (kind === 'initiative') router.navigate({ to: '/initiatives/$initiativeId', params: { initiativeId: id }, hash, search })
    else router.navigate({ to: '/work-items/$workItemId', params: { workItemId: id }, hash, search })
  }
}

function Btn({ onClick, children, primary }: { onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return <button onClick={onClick} style={primary ? actionPrimary : actionGhost}>{children}</button>
}

function DeliveryBar({ d }: { d: PlanningDelivery }) {
  return <span style={muted}>delivery {d.completed}/{d.total} completed{d.blocked ? ` · ${d.blocked} blocked` : ''}</span>
}
// WI-085 — Planning checks: a compact summary by severity, capped by default so a long list of pending
// dependencies never dominates the Overview; "Show all" reveals the rest. No finding is hidden or recolored.
const FINDINGS_CAP = 5
function Findings({ findings }: { findings: PlanningFinding[] }) {
  const [showAll, setShowAll] = useState(false)
  if (findings.length === 0) return null
  const errors = findings.filter((f) => f.level === 'error').length
  const warnings = findings.length - errors
  const shown = showAll ? findings : findings.slice(0, FINDINGS_CAP)
  return (
    <div style={findingsBox}>
      <strong style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><AlertTriangle size={15} /> Planning checks <span style={{ ...muted, fontWeight: 400 }}>· {findings.length} check{findings.length === 1 ? '' : 's'}{errors > 0 ? ` · ${errors} error${errors === 1 ? '' : 's'}` : ''}{warnings > 0 ? ` · ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}</span></strong>
      {shown.map((f, i) => <div key={i} style={{ ...muted, color: f.level === 'error' ? 'var(--danger)' : 'var(--warning)' }}>{f.message}</div>)}
      {findings.length > FINDINGS_CAP && (
        <button onClick={() => setShowAll((v) => !v)} style={{ marginTop: 6, background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit', fontSize: 13 }}>
          {showAll ? 'Show fewer' : `Show all ${findings.length} checks`}
        </button>
      )}
    </div>
  )
}

// --- Unified Planning (tabs: Overview / Delivery Plans / Epics / Initiatives) ---

type PlanningTab = 'overview' | 'plans' | 'epics' | 'initiatives'

export function Planning({ initialTab = 'overview' }: { initialTab?: PlanningTab }) {
  const router = useRouter()
  const [tab, setTab] = useState<PlanningTab>(initialTab)
  const [creating, setCreating] = useState<null | 'plan' | 'epic'>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const q = useQuery({ queryKey: ['planning'], queryFn: getPlanningOverview, retry: false })
  const openInsight = useOpenWithContext()

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
  // Initiative-first project: no Plans/Epics but Initiatives exist — order the Overview around them.
  const initiativeFirst = t.plans === 0 && t.epics === 0 && t.initiatives > 0

  const Plans = (
    <section style={section}>
      <div style={sectionHead}>
        <h3 style={h3}><MapIcon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Delivery Plans</h3>
        <Btn primary onClick={() => setCreating('plan')}>+ Create Plan</Btn>
      </div>
      {data.plans.length === 0 ? (
        <EmptyState title="No Delivery Plans yet" description="Delivery Plans organize milestones and Epics. They are optional — you can start with Initiatives or create a Plan to organize a larger roadmap." action={{ label: '+ Create Plan', onClick: () => setCreating('plan') }} />
      ) : (
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
      <div style={sectionHead}>
        <h3 style={h3}><Boxes size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Epics</h3>
        <Btn primary onClick={() => setCreating('epic')}>+ Create Epic</Btn>
      </div>
      {data.epics.length === 0 ? (
        <EmptyState title="No Epics yet" description="Epics organize related Initiatives and Work Items around a larger outcome." action={{ label: '+ Create Epic', onClick: () => setCreating('epic') }} />
      ) : (
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

  return (
    <div style={page}>
      {Header}
      {tab === 'overview' && (
        <>
          {!hasAny ? (
            <EmptyState title="Planning is optional" description="This project has no Plans, Epics or Initiatives yet. Start with an Initiative to group outcomes, add an Epic when work spans several Work Items, and a Delivery Plan to organize milestones. Work Items work on their own too." action={{ label: 'Create Plan', onClick: () => setCreating('plan') }} />
          ) : (
            <>
              {/* Status header — where am I (AC-01). One primary create action, not competing CTAs (AC-07). */}
              <section style={statusHeader}>
                <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                  <strong style={{ fontSize: 15 }}>Project planning status</strong>
                  <span style={muted}>
                    {t.plans} plan{t.plans === 1 ? '' : 's'} · {t.epics} epic{t.epics === 1 ? '' : 's'} · {t.initiatives} initiative{t.initiatives === 1 ? '' : 's'} · {t.workItems} work item{t.workItems === 1 ? '' : 's'} linked{t.independentWorkItems > 0 ? ` (+${t.independentWorkItems} independent)` : ''}{t.blockedWorkItems > 0 ? ` · ${t.blockedWorkItems} blocked by dependencies` : ''}
                  </span>
                </div>
                <Btn primary onClick={() => setCreating(t.plans === 0 && t.epics === 0 ? 'plan' : 'epic')}>+ Create {t.plans === 0 && t.epics === 0 ? 'Plan' : 'Epic'}</Btn>
              </section>

              {/* Action-first — what's next & what needs my decision (AC-01..05). */}
              <NextActions onOpen={openInsight} onOpenDiagnostics={() => setShowDiagnostics(true)} />

              {/* Compact structure summary — links to the full lists, never duplicating them here (AC-06). */}
              <section style={structureRow}>
                <span style={{ ...muted, fontWeight: 600 }}>Structure</span>
                <button style={structLink} onClick={() => setTab('plans')}>{t.plans} Plan{t.plans === 1 ? '' : 's'}</button>
                <button style={structLink} onClick={() => setTab('epics')}>{t.epics} Epic{t.epics === 1 ? '' : 's'}</button>
                <button style={structLink} onClick={() => setTab('initiatives')}>{t.initiatives} Initiative{t.initiatives === 1 ? '' : 's'}</button>
                {initiativeFirst && <span style={mutedSmall}>Organized with Initiatives — Plans and Epics are optional.</span>}
              </section>

              {/* Diagnostics on demand — the full findings, insights and explorer, nothing hidden (AC-08). */}
              {showDiagnostics ? (
                <div style={{ marginTop: 16 }}>
                  <div style={sectionHead}>
                    <h3 style={h3}><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Diagnostics</h3>
                    <Btn onClick={() => setShowDiagnostics(false)}>Hide diagnostics</Btn>
                  </div>
                  <Findings findings={data.findings} />
                  <PlanningInsights onOpen={openInsight} />
                </div>
              ) : (
                <button style={diagOpenBtn} onClick={() => setShowDiagnostics(true)}>
                  <AlertTriangle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Open Diagnostics{data.findings.length > 0 ? ` · ${data.findings.length} finding${data.findings.length === 1 ? '' : 's'}` : ''}
                </button>
              )}
            </>
          )}
        </>
      )}
      {tab === 'plans' && Plans}
      {tab === 'epics' && Epics}
      {tab === 'initiatives' && <div style={{ marginTop: 8 }}><Initiatives /></div>}

      {creating === 'plan' && <CreatePlanDrawer onClose={() => setCreating(null)} onCreated={(id) => { setCreating(null); openInsight('plan', id) }} />}
      {creating === 'epic' && <CreateEpicDrawer onClose={() => setCreating(null)} onCreated={(id) => { setCreating(null); openInsight('epic', id) }} />}
    </div>
  )
}

// --- Plan detail -----------------------------------------------------------

export function PlanDetail({ id }: { id: string }) {
  const router = useRouter()
  const ctx = useSearch({ strict: false }) as FromContext
  const [open, setOpen] = useState<null | 'edit' | 'milestones' | 'epic'>(null)
  const q = useQuery({ queryKey: ['planning', 'plan', id], queryFn: () => getPlanDetail(id), retry: false })
  const collaboration = useQuery({ queryKey: ['planning', 'plan', id, 'collaboration'], queryFn: () => api.getPlanCollaboration(id), retry: false })
  if (q.isLoading) return <div style={page}>Loading plan…</div>
  if (q.error) return <div style={page}><EmptyState title="Plan not found" description={(q.error as Error).message} action={{ label: 'Back to Planning', onClick: () => router.navigate({ to: '/planning' }) }} /></div>
  const p = q.data!
  const crumbs: Crumb[] = [{ label: 'Planning', to: '/planning' }, { label: p.id, current: true }]
  return (
    <div style={page}>
      <PlanningBreadcrumb crumbs={crumbs} back={ctx.from ? { from: ctx.from, label: ctx.fromLabel } : undefined} />
      <div style={detailHead}>
        <div>
          <h2 style={heading}>{p.title}</h2>
          <p style={subheading}><span style={mono}>{p.id}</span> · <StatusBadge variant="info">{p.status}</StatusBadge></p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => setOpen('edit')}>Edit Plan</Btn>
          <Btn onClick={() => setOpen('milestones')}>Manage Milestones</Btn>
          <Btn primary onClick={() => setOpen('epic')}>+ Create Epic</Btn>
        </div>
      </div>
      {p.objective && <p style={muted}>{p.objective}</p>}
      <Findings findings={p.findings} />

      {open === 'edit' && <EditPlanDrawer plan={p} onClose={() => setOpen(null)} />}
      {open === 'milestones' && <MilestonesDrawer plan={p} onClose={() => setOpen(null)} />}
      {open === 'epic' && <CreateEpicDrawer defaultPlan={p.id} onClose={() => setOpen(null)} onCreated={(eid) => { setOpen(null); router.navigate({ to: '/planning/epics/$id', params: { id: eid } }) }} />}

      {(() => {
        const unreadable = p.milestones.reduce((n, m) => n + (m.unreadableExitCriteria ?? 0), 0) + (p.unreadableCriteria ?? 0)
        const Overview = (
          <>
            <section style={grid}>
              <Metric label="Epics" value={p.progress.epics.total} />
              <Metric label="Initiatives" value={p.progress.planning.initiatives} />
              <Metric label="Work Items" value={p.progress.delivery.total} />
              <Metric label="Completed" value={p.progress.delivery.completed} />
              <Metric label="Blocked" value={p.progress.delivery.blocked} danger />
            </section>
            {unreadable > 0 && <p style={{ ...mutedSmall, color: 'var(--warning)' }}>{unreadable} criterion(s) in the source are not readable text and are shown separately in Evidence &amp; completion — they are not counted as verified.</p>}
          </>
        )
        const sections: Section[] = [
          { id: 'overview', label: 'Overview', render: () => Overview },
          ...(p.milestones.length > 0 ? [{ id: 'milestones', label: 'Milestones', count: p.milestones.length, render: () => (
            <MilestonesTracking plan={p} onOpenEpic={(eid) => router.navigate({ to: '/planning/epics/$id', params: { id: eid } })} />
          ) }] : []),
          ...(p.epics.length > 0 ? [{ id: 'epics', label: 'Epics', count: p.epics.length, render: () => (
            <div style={cardGrid}>{p.epics.map((e) => (
              <button key={e.id} style={card} onClick={() => router.navigate({ to: '/planning/epics/$id', params: { id: e.id } })}>
                <div style={cardTop}><StatusBadge variant={e.blocked.length ? 'warning' : 'info'}>{e.status}</StatusBadge><span style={mono}>{e.id}</span></div>
                <strong>{e.title}</strong>
                <span style={muted}>{e.milestone ?? '—'}</span>
                <DeliveryBar d={e.delivery} />
                {e.blocked.length > 0 && <span style={{ ...mutedSmall, color: 'var(--warning)' }}>blocked by {e.blocked.join(', ')}</span>}
              </button>
            ))}</div>
          ) }] : []),
          { id: 'evidence', label: 'Evidence & completion', render: () => (
            <PlanningCompletion kind="plan" id={p.id} status={p.status} revision={p.revision} completionDecision={p.completionDecision} />
          ) },
          { id: 'activity', label: 'Activity', render: () => (
            <CollaborationOverview data={collaboration.data} loading={collaboration.isLoading} error={Boolean(collaboration.error)} onOpenWorkItem={(workItemId) => router.navigate({ to: '/work-items/$workItemId', params: { workItemId } })} />
          ) },
        ]
        return <SectionTabs sections={sections} ariaLabel="Plan sections" />
      })()}
    </div>
  )
}

// --- Epic detail -----------------------------------------------------------

export function EpicDetail({ id }: { id: string }) {
  const router = useRouter()
  const ctx = useSearch({ strict: false }) as FromContext
  const qc = useQueryClient()
  const [open, setOpen] = useState<null | 'edit' | 'associate'>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const q = useQuery({ queryKey: ['planning', 'epic', id], queryFn: () => getEpicDetail(id), retry: false })
  const collaboration = useQuery({ queryKey: ['planning', 'epic', id, 'collaboration'], queryFn: () => api.getEpicCollaboration(id), retry: false })
  const removeMut = useMutation({
    mutationFn: (initiativeId: string) => disassociateInitiative(id, initiativeId),
    onSuccess: (_d, initiativeId) => {
      setRemoving(null)
      qc.invalidateQueries({ queryKey: ['planning'] })
      qc.invalidateQueries({ queryKey: ['planning', 'epic', id] })
      qc.invalidateQueries({ queryKey: ['initiative', initiativeId] })
    },
  })
  if (q.isLoading) return <div style={page}>Loading epic…</div>
  if (q.error) return <div style={page}><EmptyState title="Epic not found" description={(q.error as Error).message} action={{ label: 'Back to Planning', onClick: () => router.navigate({ to: '/planning' }) }} /></div>
  const e = q.data!
  const r = e.progress.readiness
  const crumbs: Crumb[] = [
    { label: 'Planning', to: '/planning' },
    ...(e.plan ? [{ label: e.plan, to: `/planning/plans/${e.plan}` } as Crumb] : []),
    ...(e.plan && e.milestone ? [{ label: e.milestone, hint: '(milestone, in plan)' } as Crumb] : []),
    { label: e.id, current: true },
  ]
  return (
    <div style={page}>
      <PlanningBreadcrumb crumbs={crumbs} back={ctx.from ? { from: ctx.from, label: ctx.fromLabel } : undefined} />
      <div style={detailHead}>
        <div>
          <h2 style={heading}>{e.title}</h2>
          <p style={subheading}><span style={mono}>{e.id}</span> · <StatusBadge variant="info">{e.status}</StatusBadge>{e.plan && <> · {e.plan}{e.milestone ? ` / ${e.milestone}` : ''}</>}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn onClick={() => setOpen('edit')}>Edit Epic</Btn>
          <Btn primary onClick={() => setOpen('associate')}>+ Associate Initiative</Btn>
        </div>
      </div>
      {e.outcome && <p style={muted}><strong>Outcome:</strong> {e.outcome}</p>}
      <Findings findings={e.findings} />

      {open === 'edit' && <EditEpicDrawer epic={e} onClose={() => setOpen(null)} />}
      {open === 'associate' && <AssociateInitiativeDrawer epicId={e.id} onClose={() => setOpen(null)} />}
      {removing && (
        <ConfirmDialog title="Remove association" confirmLabel="Remove" tone="danger" onCancel={() => setRemoving(null)} onConfirm={() => removeMut.mutate(removing)}>
          Remove <strong>{removing}</strong> from this Epic? The Initiative, its Work Items, owners and lifecycle are kept — only the association is removed.
          {removeMut.error && <p style={{ color: 'var(--danger)', marginTop: 8 }}>{(removeMut.error as Error).message}</p>}
        </ConfirmDialog>
      )}

      {(() => {
        const unreadable = e.unreadableCriteria ?? 0
        const Overview = (
          <>
            <section style={grid}>
              <Metric label="Work Items" value={e.progress.delivery.total} />
              <Metric label="Completed" value={e.progress.delivery.completed} />
              <Metric label="Blocked" value={e.progress.delivery.blocked} danger />
              <Metric label="Success criteria (declared)" value={r.successCriteria} />
            </section>
            {r.blockingDependencies.length > 0 && <p style={{ ...muted, color: 'var(--warning)' }}>Blocking dependencies: {r.blockingDependencies.join(', ')}</p>}
            {unreadable > 0 && <p style={{ ...mutedSmall, color: 'var(--warning)' }}>{unreadable} criterion(s) in the source are not readable text (see Evidence &amp; completion) — not counted as verified.</p>}
          </>
        )
        const Relations = (
          <>
            <h4 style={h4}>Initiatives &amp; responsibilities</h4>
            {e.initiatives.length === 0 ? (
              <EmptyState title="No Initiatives associated" description="Associate an existing Initiative to organize its Work Items under this Epic." action={{ label: '+ Associate Initiative', onClick: () => setOpen('associate') }} />
            ) : e.initiatives.map((i) => (
              <div key={i.id} style={{ ...row, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <a style={link} onClick={() => router.navigate({ to: '/initiatives/$initiativeId', params: { initiativeId: i.id } })}><span style={mono}>{i.id}</span> {i.title}</a> <StatusBadge variant="muted">{i.status}</StatusBadge>
                  <div style={mutedSmall}>{i.owners.length ? <>owner(s): {i.owners.join(', ')}</> : 'unassigned'}{i.contributors.length ? ` · contributors: ${i.contributors.join(', ')}` : ''}</div>
                </div>
                <button onClick={() => setRemoving(i.id)} style={{ ...actionGhost, color: 'var(--danger)', flex: '0 0 auto' }}>Remove</button>
              </div>
            ))}
            <h4 style={{ ...h4, marginTop: 14 }}>Work Items</h4>
            {e.workItems.length === 0 ? <p style={muted}>No work items yet.</p> : e.workItems.map((w) => (
              <div key={w.id} style={row}>
                <a style={link} onClick={() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId: w.id } })}><span style={mono}>{w.id}</span> {w.title}</a> <StatusBadge variant="muted">{w.status}</StatusBadge> <ArrowRight size={13} color="var(--foreground-muted)" />
              </div>
            ))}
          </>
        )
        const sections: Section[] = [
          { id: 'overview', label: 'Overview', render: () => Overview },
          { id: 'relations', label: 'Relations & delivery', count: e.initiatives.length + e.workItems.length, render: () => Relations },
          { id: 'evidence', label: 'Evidence & completion', render: () => <PlanningCompletion kind="epic" id={e.id} status={e.status} revision={e.revision} completionDecision={e.completionDecision} /> },
          { id: 'activity', label: 'Activity', render: () => <CollaborationOverview data={collaboration.data} loading={collaboration.isLoading} error={Boolean(collaboration.error)} onOpenWorkItem={(workItemId) => router.navigate({ to: '/work-items/$workItemId', params: { workItemId } })} /> },
        ]
        return <SectionTabs sections={sections} ariaLabel="Epic sections" />
      })()}
    </div>
  )
}

function Metric({ label, value, hint, danger }: { label: string; value: string | number; hint?: string; danger?: boolean }) {
  const strong = danger && Number(value) > 0 ? { color: 'var(--danger)' } : undefined
  return <div style={metricCard}><span>{label}</span><strong style={strong}>{String(value)}</strong>{hint && <span style={{ fontSize: 11, fontWeight: 400 }}>{hint}</span>}</div>
}

const page: React.CSSProperties = { padding: '24px 32px', maxWidth: 1180, margin: '0 auto' }
const statusHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const structureRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 16, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }
const structLink: React.CSSProperties = { background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit', fontSize: 13 }
const diagOpenBtn: React.CSSProperties = { marginTop: 16, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', width: '100%', textAlign: 'left' }
const heading: React.CSSProperties = { margin: 0, fontSize: 24 }
const h3: React.CSSProperties = { margin: '0 0 8px' }
const h4: React.CSSProperties = { margin: '0 0 8px', fontSize: 15 }
const subheading: React.CSSProperties = { color: 'var(--foreground-muted)', margin: '6px 0 0', maxWidth: 820 }
const header: React.CSSProperties = { marginBottom: 12 }
const sectionHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }
const detailHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }
const actionPrimary: React.CSSProperties = { padding: '8px 14px', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }
const actionGhost: React.CSSProperties = { padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }
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
const link: React.CSSProperties = { color: 'var(--primary)', cursor: 'pointer', textDecoration: 'none' }
const findingsBox: React.CSSProperties = { margin: '14px 0', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', display: 'grid', gap: 4 }
