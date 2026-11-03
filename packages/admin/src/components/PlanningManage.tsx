import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../lib/api'
import type { PlanDetail, EpicDetail } from '../lib/api'

// Planning Management UI (WI-076): create/edit Plans and Epics, manage milestones, and manage
// Initiative↔Epic associations. Every form delegates to the server (Core); nothing writes artifacts
// here and no lifecycle is changed. Edits carry the loaded `revision` so a concurrent change is caught.

// --- Shared primitives -------------------------------------------------------

function Drawer({ title, subtitle, onClose, children, footer, wide }: {
  title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer: ReactNode; wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose() }} style={overlay}>
      <div ref={ref} style={{ ...drawer, maxWidth: wide ? 640 : 460 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          {subtitle && <p style={{ ...muted, margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ padding: 20, overflowY: 'auto', display: 'grid', gap: 14 }}>{children}</div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>{footer}</div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {children}
      {hint && <span style={{ ...muted, fontSize: 12 }}>{hint}</span>}
    </label>
  )
}
function Text({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return <input type="text" value={value} placeholder={placeholder} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} style={input} />
}
function Area({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange(e.target.value)} style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
}
function Primary({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button onClick={onClick} disabled={disabled} style={{ ...btn, ...btnPrimary, opacity: disabled ? 0.6 : 1 }}>{children}</button>
}
function Ghost({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} style={{ ...btn, ...btnGhost }}>{children}</button>
}
function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0, flex: 1 }}>{(error as Error).message}</p>
}

/** A newline-separated textarea mapped to a trimmed string[] (stable order, no empties). */
function listToText(list: string[]): string { return list.join('\n') }
function textToList(text: string): string[] { return text.split('\n').map((s) => s.trim()).filter(Boolean) }

// --- Create / Edit Plan ------------------------------------------------------

export function CreatePlanDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [confirming, setConfirming] = useState(false)
  const m = useMutation({
    mutationFn: () => api.createPlan({ title: title.trim(), objective: objective.trim() || undefined }),
    onSuccess: ({ id }) => { qc.invalidateQueries({ queryKey: ['planning'] }); onCreated(id) },
  })
  return (
    <Drawer title="Create Delivery Plan" subtitle="Plans are optional — they organize milestones and Epics. The id and status are set by Kaddo." onClose={onClose}
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!title.trim() || m.isPending} onClick={() => confirming ? m.mutate() : setConfirming(true)}>{m.isPending ? 'Creating…' : confirming ? 'Confirm & create' : 'Review'}</Primary></>}>
      <Field label="Title"><Text value={title} onChange={(v) => { setTitle(v); setConfirming(false) }} placeholder="e.g. Technical Roadmap" autoFocus /></Field>
      <Field label="Objective" hint="Optional."><Area value={objective} onChange={(v) => { setObjective(v); setConfirming(false) }} placeholder="What this plan aims to achieve" /></Field>
      {confirming && <div style={summaryBox}>Will create a new Delivery Plan <strong>“{title.trim()}”</strong> with status <code>draft</code>. Its id is generated automatically.</div>}
    </Drawer>
  )
}

export function EditPlanDrawer({ plan, onClose }: { plan: PlanDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState(plan.title)
  const [objective, setObjective] = useState(plan.objective ?? '')
  const [successCriteria, setSuccess] = useState(listToText(plan.successCriteria))
  const [risks, setRisks] = useState(listToText(plan.risks))
  const [dependsOn, setDeps] = useState(listToText(plan.dependsOn))
  const [references, setRefs] = useState(listToText(plan.references))
  const m = useMutation({
    mutationFn: () => api.updatePlan(plan.id, {
      title: title.trim(), objective: objective.trim() || null,
      successCriteria: textToList(successCriteria), risks: textToList(risks),
      dependsOn: textToList(dependsOn), references: textToList(references),
      expectedRevision: plan.revision,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planning'] }); qc.invalidateQueries({ queryKey: ['planning', 'plan', plan.id] }); onClose() },
  })
  return (
    <Drawer title="Edit Plan" subtitle={`${plan.id} · lifecycle stays ${plan.status} (metadata only)`} onClose={onClose} wide
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!title.trim() || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save'}</Primary></>}>
      <Field label="Title"><Text value={title} onChange={setTitle} /></Field>
      <Field label="Objective"><Area value={objective} onChange={setObjective} /></Field>
      <Field label="Success criteria" hint="One per line."><Area value={successCriteria} onChange={setSuccess} /></Field>
      <Field label="Risks" hint="One per line."><Area value={risks} onChange={setRisks} /></Field>
      <Field label="Dependencies" hint="One per line (e.g. other Plan/Epic ids)."><Area value={dependsOn} onChange={setDeps} /></Field>
      <Field label="References" hint="One per line."><Area value={references} onChange={setRefs} /></Field>
    </Drawer>
  )
}

// --- Milestones --------------------------------------------------------------

type MsRow = { id: string; title: string; exitCriteria: string }

export function MilestonesDrawer({ plan, onClose }: { plan: PlanDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<MsRow[]>(plan.milestones.map((m) => ({ id: m.id, title: m.title, exitCriteria: listToText(m.exitCriteria) })))
  const set = (i: number, patch: Partial<MsRow>) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, ...patch } : row))
  const add = () => setRows((r) => [...r, { id: '', title: '', exitCriteria: '' }])
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))
  const m = useMutation({
    mutationFn: () => api.updatePlan(plan.id, {
      milestones: rows.map((row) => ({ id: row.id.trim(), title: row.title.trim() || undefined, exitCriteria: textToList(row.exitCriteria) })),
      expectedRevision: plan.revision,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planning'] }); qc.invalidateQueries({ queryKey: ['planning', 'plan', plan.id] }); onClose() },
  })
  const valid = rows.every((r) => /^[A-Za-z0-9._-]+$/.test(r.id.trim()))
  return (
    <Drawer title="Manage Milestones" subtitle={`${plan.id} · ids are unique within the plan. A milestone used by an Epic can't be removed or renamed here.`} onClose={onClose} wide
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!valid || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save milestones'}</Primary></>}>
      {rows.length === 0 && <p style={muted}>No milestones yet.</p>}
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={row.id} placeholder="RM-01" onChange={(e) => set(i, { id: e.target.value })} style={{ ...input, flex: '0 0 120px', fontFamily: 'var(--font-mono, monospace)' }} />
            <input value={row.title} placeholder="Milestone title" onChange={(e) => set(i, { title: e.target.value })} style={{ ...input, flex: 1 }} />
            <button onClick={() => remove(i)} aria-label="Remove milestone" style={{ ...btn, ...btnGhost, color: 'var(--danger)' }}>Remove</button>
          </div>
          <textarea value={row.exitCriteria} placeholder="Exit criteria, one per line" rows={2} onChange={(e) => set(i, { exitCriteria: e.target.value })} style={{ ...input, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      ))}
      <Ghost onClick={add}>+ Add Milestone</Ghost>
    </Drawer>
  )
}

// --- Create / Edit Epic ------------------------------------------------------

function usePlanMilestones(planId: string | '') {
  return useQuery({
    queryKey: ['planning', 'plan', planId, 'milestones'],
    queryFn: () => api.getPlanDetail(planId),
    enabled: !!planId,
    retry: false,
  })
}

export function CreateEpicDrawer({ onClose, onCreated, defaultPlan = '' }: { onClose: () => void; onCreated: (id: string) => void; defaultPlan?: string }) {
  const qc = useQueryClient()
  const overview = useQuery({ queryKey: ['planning'], queryFn: api.getPlanningOverview })
  const [title, setTitle] = useState('')
  const [outcome, setOutcome] = useState('')
  const [plan, setPlan] = useState(defaultPlan)
  const [milestone, setMilestone] = useState('')
  const planDetail = usePlanMilestones(plan)
  const m = useMutation({
    mutationFn: () => api.createEpic({ title: title.trim(), outcome: outcome.trim() || undefined, plan: plan || undefined, milestone: milestone || undefined }),
    onSuccess: ({ id }) => { qc.invalidateQueries({ queryKey: ['planning'] }); onCreated(id) },
  })
  const plans = overview.data?.plans ?? []
  const milestones = planDetail.data?.milestones ?? []
  return (
    <Drawer title="Create Epic" subtitle="Epics group related Initiatives and Work Items. A Plan and milestone are optional." onClose={onClose}
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!title.trim() || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Creating…' : 'Create'}</Primary></>}>
      <Field label="Title"><Text value={title} onChange={setTitle} placeholder="e.g. Runtime Performance" autoFocus /></Field>
      <Field label="Expected outcome" hint="Optional."><Area value={outcome} onChange={setOutcome} /></Field>
      <Field label="Related Plan" hint="Optional — leave as “None” for an independent Epic.">
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setMilestone('') }} style={input}>
          <option value="">None (independent)</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.title}</option>)}
        </select>
      </Field>
      {plan && (
        <Field label="Milestone" hint={milestones.length === 0 ? 'This Plan has no milestones yet.' : 'Optional.'}>
          <select value={milestone} onChange={(e) => setMilestone(e.target.value)} style={input} disabled={milestones.length === 0}>
            <option value="">None</option>
            {milestones.map((ms) => <option key={ms.id} value={ms.id}>{ms.id} — {ms.title}</option>)}
          </select>
        </Field>
      )}
    </Drawer>
  )
}

export function EditEpicDrawer({ epic, onClose }: { epic: EpicDetail; onClose: () => void }) {
  const qc = useQueryClient()
  const overview = useQuery({ queryKey: ['planning'], queryFn: api.getPlanningOverview })
  const [title, setTitle] = useState(epic.title)
  const [outcome, setOutcome] = useState(epic.outcome ?? '')
  const [plan, setPlan] = useState(epic.plan ?? '')
  const [milestone, setMilestone] = useState(epic.milestone ?? '')
  const [successCriteria, setSuccess] = useState(listToText(epic.successCriteria))
  const [dependsOn, setDeps] = useState(listToText(epic.dependsOn))
  const [relatedCapabilities, setCaps] = useState(listToText(epic.relatedCapabilities))
  const [decisions, setDecisions] = useState(listToText(epic.decisions))
  const planDetail = usePlanMilestones(plan)
  const m = useMutation({
    mutationFn: () => api.updateEpic(epic.id, {
      title: title.trim(), outcome: outcome.trim() || null,
      plan: plan || null, milestone: plan ? (milestone || null) : null,
      successCriteria: textToList(successCriteria), dependsOn: textToList(dependsOn),
      relatedCapabilities: textToList(relatedCapabilities), decisions: textToList(decisions),
      expectedRevision: epic.revision,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planning'] }); qc.invalidateQueries({ queryKey: ['planning', 'epic', epic.id] }); onClose() },
  })
  const plans = overview.data?.plans ?? []
  const otherEpics = (overview.data?.epics ?? []).filter((e) => e.id !== epic.id)
  const milestones = planDetail.data?.milestones ?? []
  // The Epic had a milestone, and the effective milestone after this edit is empty — i.e. the Plan was
  // detached or changed. Warn explicitly that the milestone association is also being removed (WI-076).
  const milestoneWillClear = !!epic.milestone && (!plan || milestone === '')
  return (
    <Drawer title="Edit Epic" subtitle={`${epic.id} · lifecycle stays ${epic.status} (metadata only)`} onClose={onClose} wide
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!title.trim() || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save'}</Primary></>}>
      <Field label="Title"><Text value={title} onChange={setTitle} /></Field>
      <Field label="Expected outcome"><Area value={outcome} onChange={setOutcome} /></Field>
      <Field label="Related Plan">
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setMilestone('') }} style={input}>
          <option value="">None (independent)</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.title}</option>)}
        </select>
      </Field>
      {milestoneWillClear && (
        <div style={{ ...summaryBox, borderColor: 'var(--warning)', color: 'var(--warning)' }}>
          {plan
            ? <>Changing the Plan will also remove this Epic's milestone association (<strong>{epic.milestone}</strong>). Pick a milestone from the new Plan to keep one.</>
            : <>Removing the Plan will also remove this Epic's milestone association (<strong>{epic.milestone}</strong>).</>}
        </div>
      )}
      {plan && (
        <Field label="Milestone" hint={milestones.length === 0 ? 'This Plan has no milestones yet.' : undefined}>
          <select value={milestone} onChange={(e) => setMilestone(e.target.value)} style={input} disabled={milestones.length === 0}>
            <option value="">None</option>
            {milestones.map((ms) => <option key={ms.id} value={ms.id}>{ms.id} — {ms.title}</option>)}
          </select>
        </Field>
      )}
      <Field label="Success criteria" hint="One per line."><Area value={successCriteria} onChange={setSuccess} /></Field>
      <Field label="Dependencies (Epic ids)" hint={otherEpics.length ? `One per line. Existing: ${otherEpics.map((e) => e.id).join(', ')}` : 'One per line.'}><Area value={dependsOn} onChange={setDeps} /></Field>
      <Field label="Related capabilities" hint="One per line."><Area value={relatedCapabilities} onChange={setCaps} /></Field>
      <Field label="Decisions" hint="One per line."><Area value={decisions} onChange={setDecisions} /></Field>
    </Drawer>
  )
}

// --- Associate / Reassign Initiative ----------------------------------------

export function AssociateInitiativeDrawer({ epicId, onClose }: { epicId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const overview = useQuery({ queryKey: ['planning'], queryFn: api.getPlanningOverview })
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const m = useMutation({
    mutationFn: () => api.associateInitiative(epicId, selected),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planning'] })
      qc.invalidateQueries({ queryKey: ['planning', 'epic', epicId] })
      qc.invalidateQueries({ queryKey: ['initiative', selected] })
      onClose()
    },
  })
  const all = overview.data?.initiatives ?? []
  const q = search.trim().toLowerCase()
  const matches = all
    .filter((i) => !q || i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.status.toLowerCase().includes(q))
    // Initiatives without an Epic are prioritized; the currently-targeted Epic's own ones are hidden.
    .filter((i) => i.epic !== epicId)
    .sort((a, b) => (a.epic ? 1 : 0) - (b.epic ? 1 : 0))
  const current = all.find((i) => i.id === selected)
  const reassigning = !!current?.epic
  return (
    <Drawer title="Associate Initiative" subtitle={`Link an existing Initiative to ${epicId}. Initiatives without an Epic are listed first.`} onClose={onClose} wide
      footer={<><ErrorText error={m.error} /><Ghost onClick={onClose}>Cancel</Ghost><Primary disabled={!selected || m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : reassigning ? 'Confirm reassignment' : 'Associate'}</Primary></>}>
      <Field label="Search" hint="By id, title or status."><Text value={search} onChange={setSearch} placeholder="Filter initiatives…" autoFocus /></Field>
      <div style={{ display: 'grid', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
        {matches.length === 0 && <p style={muted}>No matching initiatives.</p>}
        {matches.map((i) => (
          <button key={i.id} onClick={() => setSelected(i.id)} style={{ ...pickRow, ...(selected === i.id ? pickRowActive : {}) }}>
            <span><span style={mono}>{i.id}</span> {i.title}</span>
            <span style={muted}>{i.epic ? `in ${i.epic}` : 'no epic'}</span>
          </button>
        ))}
      </div>
      {current && (
        <div style={summaryBox}>
          {reassigning
            ? <>Reassign <strong>{current.id}</strong> from <code>{current.epic}</code> to <code>{epicId}</code>. This only changes the association — no Work Item or lifecycle is modified.</>
            : <>Associate <strong>{current.id}</strong> with <code>{epicId}</code>.</>}
        </div>
      )}
    </Drawer>
  )
}

// --- Initiative-side Planning Context ---------------------------------------

export function InitiativePlanningContext({ initiativeId, epic, onOpenEpic }: {
  initiativeId: string; epic: string | null; onOpenEpic: (epicId: string) => void
}) {
  const qc = useQueryClient()
  const overview = useQuery({ queryKey: ['planning'], queryFn: api.getPlanningOverview })
  const epicDetail = useQuery({ queryKey: ['planning', 'epic', epic], queryFn: () => api.getEpicDetail(epic as string), enabled: !!epic, retry: false })
  const [target, setTarget] = useState('')
  const [confirm, setConfirm] = useState<null | 'change' | 'remove'>(null)
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['initiative', initiativeId] })
    qc.invalidateQueries({ queryKey: ['planning'] })
    if (epic) qc.invalidateQueries({ queryKey: ['planning', 'epic', epic] })
  }
  const assoc = useMutation({ mutationFn: () => api.associateInitiative(target, initiativeId), onSuccess: () => { setConfirm(null); setTarget(''); invalidate() } })
  const remove = useMutation({ mutationFn: () => api.disassociateInitiative(epic as string, initiativeId), onSuccess: () => { setConfirm(null); invalidate() } })
  const epics = (overview.data?.epics ?? []).filter((e) => e.id !== epic)
  const d = epicDetail.data

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {epic ? (
        <>
          <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
            <div>Epic: <button style={{ ...linkBtn }} onClick={() => onOpenEpic(epic)}><span style={mono}>{epic}</span>{d ? ` — ${d.title}` : ''}</button></div>
            <div style={muted}>Plan: {d?.plan ?? '—'}{d?.milestone ? ` · Milestone: ${d.milestone}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...input, width: 'auto', minWidth: 220 }}>
              <option value="">Change to another Epic…</option>
              {epics.map((e) => <option key={e.id} value={e.id}>{e.id} — {e.title}</option>)}
            </select>
            <Primary disabled={!target || assoc.isPending} onClick={() => setConfirm('change')}>Change</Primary>
            <Ghost onClick={() => setConfirm('remove')}>Remove association</Ghost>
          </div>
        </>
      ) : (
        <>
          <p style={muted}>Not associated with any Epic. Associating organizes this Initiative's Work Items under an Epic.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...input, width: 'auto', minWidth: 220 }}>
              <option value="">Select an Epic…</option>
              {epics.map((e) => <option key={e.id} value={e.id}>{e.id} — {e.title}</option>)}
            </select>
            <Primary disabled={!target || assoc.isPending} onClick={() => assoc.mutate()}>Associate</Primary>
          </div>
        </>
      )}
      {(assoc.error || remove.error) && <ErrorText error={assoc.error || remove.error} />}

      {confirm === 'change' && (
        <ConfirmBox title="Reassign Initiative" confirmLabel={assoc.isPending ? 'Saving…' : 'Confirm reassignment'} onCancel={() => setConfirm(null)} onConfirm={() => assoc.mutate()}>
          Move <strong>{initiativeId}</strong> from <code>{epic}</code> to <code>{target}</code>? Only the association changes — no Work Item or lifecycle is modified.
        </ConfirmBox>
      )}
      {confirm === 'remove' && (
        <ConfirmBox title="Remove association" confirmLabel={remove.isPending ? 'Removing…' : 'Remove'} tone="danger" onCancel={() => setConfirm(null)} onConfirm={() => remove.mutate()}>
          Remove <strong>{initiativeId}</strong> from <code>{epic}</code>? The Initiative, its Work Items, owners and lifecycle are kept.
        </ConfirmBox>
      )}
    </div>
  )
}

function ConfirmBox({ title, children, confirmLabel, tone = 'primary', onConfirm, onCancel }: {
  title: string; children: ReactNode; confirmLabel: string; tone?: 'primary' | 'danger'; onConfirm: () => void; onCancel: () => void
}) {
  const color = tone === 'danger' ? 'var(--danger)' : 'var(--primary)'
  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onCancel() }} style={overlay}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', padding: 22, maxWidth: 440, width: '100%' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{title}</h3>
        <div style={{ ...muted, lineHeight: 1.5, marginBottom: 18 }}>{children}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Ghost onClick={onCancel}>Cancel</Ghost>
          <button onClick={onConfirm} style={{ ...btn, border: `1px solid ${color}`, background: color, color: '#fff' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// --- Styles ------------------------------------------------------------------

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }
const drawer: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg, 12px)', boxShadow: 'var(--shadow)', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', color: 'var(--foreground)' }
const input: CSSProperties = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }
const btn: CSSProperties = { padding: '8px 14px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }
const btnPrimary: CSSProperties = { border: '1px solid var(--primary)', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)' }
const btnGhost: CSSProperties = { border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', fontWeight: 500 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }
const linkBtn: CSSProperties = { background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', font: 'inherit', padding: 0 }
const summaryBox: CSSProperties = { padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-muted)', fontSize: 13, color: 'var(--foreground-muted)', lineHeight: 1.5 }
const pickRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', textAlign: 'left', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', font: 'inherit', fontSize: 13 }
const pickRowActive: CSSProperties = { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)' }
