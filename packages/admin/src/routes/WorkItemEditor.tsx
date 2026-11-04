import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { api, ApiError } from '../lib/api'
import type { WorkItemEditModel, WorkItemInput, ValidationResult } from '../lib/api'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { WorkItemStatus } from '../components/WorkItemStatus'
import { ArtifactPath } from '../components/ArtifactPath'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Section } from '../components/Section'
import { TextField, TextArea, PrimaryButton, SecondaryButton } from '../components/editor/primitives'
import { ListEditor } from '../components/editor/ListEditor'
import { ModulesEditor } from '../components/editor/ModulesEditor'
import { ImpactAnalysisEditor } from '../components/editor/ImpactAnalysisEditor'
import { ScopeConfidenceEditor } from '../components/editor/ScopeConfidenceEditor'
import { AcceptanceCriteriaEditor } from '../components/editor/AcceptanceCriteriaEditor'
import { RelationshipSelector } from '../components/editor/RelationshipSelector'
import { ValidationPanel } from '../components/editor/ValidationPanel'

function toInput(m: WorkItemEditModel): WorkItemInput {
  const { id: _id, status: _s, revision: _r, path: _p, editable: _e, editableReason: _er, ...input } = m
  return input
}

function Skeleton() {
  return <div style={{ padding: 24 }}><div style={{ height: 300, background: 'var(--surface-muted)', borderRadius: 'var(--radius)', animation: 'pulse 1.5s ease-in-out infinite' }} /><style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style></div>
}

function ProgressRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: 'var(--foreground)' }}>{label}</span>
      <span style={{ color: done ? 'var(--success)' : 'var(--foreground-muted)' }}>{done ? '✓ Provided' : '○ Not yet'}</span>
    </div>
  )
}

export function WorkItemEditor() {
  const { workItemId } = useParams({ from: '/work-items/$workItemId/edit' })
  const router = useRouter()
  const queryClient = useQueryClient()

  const editQuery = useQuery({ queryKey: ['work-item-edit', workItemId], queryFn: () => api.getWorkItemEdit(workItemId), refetchOnWindowFocus: false, retry: false })
  const modulesQuery = useQuery({ queryKey: ['modules'], queryFn: api.getModules })

  const [model, setModel] = useState<WorkItemInput | null>(null)
  const [revision, setRevision] = useState('')
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [dialog, setDialog] = useState<null | 'conflict' | 'unsaved' | 'ready' | 'reopen'>(null)
  const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)

  // Seed local editor state once the model loads.
  useEffect(() => {
    if (editQuery.data && editQuery.data.editable && model === null) {
      setModel(toInput(editQuery.data))
      setRevision(editQuery.data.revision)
    }
  }, [editQuery.data, model])

  // Warn on browser refresh/close with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const update = (patch: Partial<WorkItemInput>) => { setModel((m) => (m ? { ...m, ...patch } : m)); setDirty(true); setValidation(null) }

  const guardedNavigate = (fn: () => void) => {
    if (dirty) { setPendingNav(() => fn); setDialog('unsaved') }
    else fn()
  }

  const save = async (): Promise<boolean> => {
    if (!model) return false
    setBusy(true); setBanner(null)
    try {
      const res = await api.updateWorkItem(workItemId, model, revision)
      setRevision(res.revision); setDirty(false)
      setBanner({ tone: 'success', text: `Work Item saved. ${workItemId} remains Draft.` })
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      queryClient.invalidateQueries({ queryKey: ['work-item', workItemId] })
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDialog('conflict')
      else setBanner({ tone: 'danger', text: err instanceof ApiError ? err.message : 'The Work Item could not be saved. No partial changes were written.' })
      return false
    } finally {
      setBusy(false)
    }
  }

  const validate = async () => {
    if (dirty && !(await save())) return
    setBusy(true)
    try {
      setValidation(await api.validateWorkItem(workItemId))
    } catch (err) {
      setBanner({ tone: 'danger', text: err instanceof ApiError ? err.message : 'The Work Item could not be validated.' })
    } finally {
      setBusy(false)
    }
  }

  const markReady = async () => {
    setDialog(null); setBusy(true)
    try {
      await api.transitionReady(workItemId, revision)
      setDirty(false)
      queryClient.invalidateQueries({ queryKey: ['work-items'] })
      router.navigate({ to: '/work-items/$workItemId', params: { workItemId } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setDialog('conflict')
      else setBanner({ tone: 'danger', text: err instanceof ApiError ? err.message : 'The transition could not be completed.' })
      setBusy(false)
    }
  }

  const reopen = async () => {
    setDialog(null); setBusy(true)
    try {
      await api.transitionDraft(workItemId, editQuery.data!.revision)
      await editQuery.refetch()
      setModel(null) // re-seed from the reopened draft
      setBusy(false)
    } catch (err) {
      setBanner({ tone: 'danger', text: err instanceof ApiError ? err.message : 'The Work Item could not be reopened.' })
      setBusy(false)
    }
  }

  if (editQuery.isLoading) return <Skeleton />
  if (editQuery.error) {
    const notFound = editQuery.error instanceof ApiError && editQuery.error.status === 404
    return (
      <div style={{ padding: '24px 32px', maxWidth: 900, margin: '0 auto' }}>
        <Breadcrumbs crumbs={[{ label: 'Work Items', path: '/work-items' }, { label: workItemId }]} />
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--foreground-muted)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>{notFound ? 'Work Item not found' : 'Could not open the editor'}</h2>
          <p style={{ fontSize: 14 }}>{(editQuery.error as Error).message}</p>
        </div>
      </div>
    )
  }

  const data = editQuery.data!

  // Not editable — a Ready item offers reopen; anything else is read-only.
  if (!data.editable) {
    return (
      <div style={{ padding: '24px 32px', maxWidth: 720, margin: '0 auto' }}>
        <Breadcrumbs crumbs={[{ label: 'Work Items', path: '/work-items' }, { label: data.id, path: `/work-items/${data.id}` }, { label: 'Edit' }]} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{data.title} <WorkItemStatus status={data.status} /></h2>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginTop: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--foreground)', marginTop: 0 }}>{data.editableReason}</p>
          {data.status === 'ready' && (
            <PrimaryButton onClick={() => setDialog('reopen')}>Reopen as Draft</PrimaryButton>
          )}
        </div>
        {dialog === 'reopen' && (
          <ConfirmDialog title="Reopen as Draft?" confirmLabel="Reopen as Draft" onCancel={() => setDialog(null)} onConfirm={reopen}>
            This Work Item is Ready. Editing its scope may invalidate the approved refinement. It will return to Draft.
          </ConfirmDialog>
        )}
      </div>
    )
  }

  if (!model) return <Skeleton />

  // `core` is always a valid module; mapped modules come from Core.
  const modules = ['core', ...(modulesQuery.data?.modules.map((m) => m.id) ?? [])].filter((v, i, a) => a.indexOf(v) === i)
  const progress = {
    outcome: Boolean(model.currentBehavior?.trim() && model.targetBehavior?.trim()),
    journey: Boolean(model.entryPoints?.trim() || model.endToEndFlow?.trim()),
    modules: model.affectedModules.length > 0,
    impact: model.impactAnalysis.length > 0,
    acceptance: model.acceptanceCriteria.length > 0,
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto', paddingBottom: 96 }}>
      <Breadcrumbs crumbs={[{ label: 'Work Items', path: '/work-items' }, { label: data.id, path: `/work-items/${data.id}` }, { label: 'Edit' }]} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground-muted)' }}>{data.id}</span>
        <WorkItemStatus status="draft" />
        {dirty && <span style={{ fontSize: 12, color: 'var(--warning)' }}>Unsaved changes</span>}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 4px' }}>{model.title || 'Untitled Work Item'}</h2>
      <div style={{ marginBottom: 8 }}><ArtifactPath path={data.path} /></div>

      {banner && (
        <div role="status" style={{ margin: '12px 0', padding: 12, borderRadius: 'var(--radius)', fontSize: 14,
          background: banner.tone === 'success' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--danger) 12%, transparent)',
          border: `1px solid ${banner.tone === 'success' ? 'var(--success)' : 'var(--danger)'}` }}>
          {banner.text}
        </div>
      )}

      {/* Refinement progress (guidance — Core validation is authoritative) */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginTop: 12 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--foreground-muted)', margin: '0 0 6px' }}>Refinement</h3>
        <ProgressRow label="Outcome" done={progress.outcome} />
        <ProgressRow label="Journey" done={progress.journey} />
        <ProgressRow label="Modules" done={progress.modules} />
        <ProgressRow label="Impact" done={progress.impact} />
        <ProgressRow label="Acceptance criteria" done={progress.acceptance} />
      </div>

      <Section title="Intent">
        <TextField id="f-title" label="Title" value={model.title} onChange={(v) => update({ title: v })} />
        <TextArea id="f-summary" label="Summary" hint="The original intent for this Work Item." value={model.summary ?? ''} onChange={(v) => update({ summary: v })} rows={2} />
      </Section>

      <Section title="Assigned responsibility">
        <TextField id="f-owners" label="Owners" hint="Comma-separated identifiers. Declared responsibility is not inferred from Git." value={model.owners.join(', ')} onChange={(v) => update({ owners: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
        <TextField id="f-contributors" label="Contributors" hint="Comma-separated declared collaborators; observed Git authors stay separate." value={model.contributors.join(', ')} onChange={(v) => update({ contributors: v.split(',').map((x) => x.trim()).filter(Boolean) })} />
      </Section>

      <Section title="Outcome">
        <TextField id="f-actor" label="Actor" hint="Who experiences the change (optional)." value={model.actor ?? ''} onChange={(v) => update({ actor: v })} />
        <TextArea id="f-outcome" label="Observable outcome" value={model.outcome ?? ''} onChange={(v) => update({ outcome: v })} rows={2} />
        <TextArea id="f-current" label="Current behavior" value={model.currentBehavior ?? ''} onChange={(v) => update({ currentBehavior: v })} />
        <TextArea id="f-target" label="Target behavior" value={model.targetBehavior ?? ''} onChange={(v) => update({ targetBehavior: v })} />
      </Section>

      <Section title="Journey">
        <TextArea id="f-entry" label="Entry points" value={model.entryPoints ?? ''} onChange={(v) => update({ entryPoints: v })} rows={2} />
        <TextArea id="f-flow" label="End-to-end flow" hint="Describe the flow from entry point to result." value={model.endToEndFlow ?? ''} onChange={(v) => update({ endToEndFlow: v })} rows={4} />
      </Section>

      <Section title="Modules">
        <ModulesEditor modules={modules} coverage={model.moduleCoverage} onChange={(coverage) => update({ moduleCoverage: coverage, affectedModules: coverage.filter((c) => c.status === 'affected').map((c) => c.id) })} />
      </Section>

      <Section title="Impact analysis">
        <ImpactAnalysisEditor impact={model.impactAnalysis} onChange={(impactAnalysis) => update({ impactAnalysis })} />
      </Section>

      <Section title="Scope confidence">
        <ScopeConfidenceEditor value={model.scopeConfidence} onChange={(scopeConfidence) => update({ scopeConfidence })} />
      </Section>

      <Section title="Open scope questions">
        <ListEditor items={model.scopeUnknowns} onChange={(scopeUnknowns) => update({ scopeUnknowns })} placeholder="Is registration controlled by a feature flag?" addLabel="+ Add question" ariaLabel="Scope question" />
      </Section>

      <Section title="Acceptance criteria">
        <AcceptanceCriteriaEditor criteria={model.acceptanceCriteria} onChange={(acceptanceCriteria) => update({ acceptanceCriteria })} />
      </Section>

      <Section title="Relationships">
        <RelationshipSelector
          decisions={model.decisions}
          relatedKnowledge={model.relatedKnowledge}
          onDecisions={(decisions) => update({ decisions })}
          onRelatedKnowledge={(relatedKnowledge) => update({ relatedKnowledge })}
        />
      </Section>

      {validation && <div style={{ marginTop: 24 }}><ValidationPanel result={validation} /></div>}

      {/* Sticky action bar */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: 24, background: 'var(--background)', borderTop: '1px solid var(--border)', padding: '14px 0', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <SecondaryButton onClick={() => guardedNavigate(() => router.navigate({ to: '/work-items/$workItemId', params: { workItemId } }))} disabled={busy}>Back</SecondaryButton>
        <SecondaryButton onClick={validate} disabled={busy}>Validate</SecondaryButton>
        <SecondaryButton onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</SecondaryButton>
        <PrimaryButton onClick={() => setDialog('ready')} disabled={busy || !validation?.canMarkReady}>Mark ready</PrimaryButton>
      </div>

      {dialog === 'conflict' && (
        <ConfirmDialog title="Work Item changed externally" confirmLabel="Reload" cancelLabel="Cancel" tone="danger"
          onCancel={() => setDialog(null)}
          onConfirm={() => { setDialog(null); setModel(null); setValidation(null); setDirty(false); editQuery.refetch() }}>
          This Work Item changed outside Kaddo Admin. Your changes have not been written. Reload the latest version before continuing.
        </ConfirmDialog>
      )}
      {dialog === 'unsaved' && (
        <ConfirmDialog title="Leave without saving?" confirmLabel="Leave" tone="danger"
          onCancel={() => { setDialog(null); setPendingNav(null) }}
          onConfirm={() => { setDialog(null); const n = pendingNav; setPendingNav(null); setDirty(false); n?.() }}>
          You have unsaved changes. Leaving will discard your local changes.
        </ConfirmDialog>
      )}
      {dialog === 'ready' && (
        <ConfirmDialog title={`Mark ${workItemId} as Ready?`} confirmLabel="Mark ready" onCancel={() => setDialog(null)} onConfirm={markReady}>
          This means the scope has been reviewed and the Work Item is prepared for implementation.
        </ConfirmDialog>
      )}
    </div>
  )
}
