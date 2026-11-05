import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-wiw-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function initProject(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: wiw', '  state: pre-ai', '  structure: multirepo', 'team:', '  size: small'].join('\n'))
}
function emptyInput(over: Partial<import('../src/core/work-item-write.js').WorkItemInput> = {}) {
  return {
    title: 'T', type: 'feature', scopeUnknowns: [], affectedModules: [], moduleCoverage: [],
    impactAnalysis: [], acceptanceCriteria: [], decisions: [], relatedKnowledge: [], scopeConfidence: null,
    ...over,
  }
}

describe('VS-099: create', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('creates a draft with a Core-assigned id and canonical path', async () => {
    const core = await import('../src/core.js')
    const res = core.createWorkItem(dir, { intent: 'Enable regular registration after beta', type: 'feature' })
    expect(res.id).toBe('WI-001')
    expect(res.path).toMatch(/^knowledge\/delivery\/work-items\/draft\/WI-001-/)
    expect(fs.existsSync(path.join(dir, res.path))).toBe(true)
    const wi = core.getWorkItem(dir, 'WI-001')
    expect(wi.status).toBe('draft')
    expect(wi.title).toBe('Enable regular registration after beta')
  })

  it('allocates the next id without collisions', async () => {
    const core = await import('../src/core.js')
    core.createWorkItem(dir, { intent: 'First', type: 'feature' })
    const second = core.createWorkItem(dir, { intent: 'Second', type: 'bugfix' })
    expect(second.id).toBe('WI-002')
  })

  it('rejects an empty intent and unknown type', async () => {
    const core = await import('../src/core.js')
    expect(() => core.createWorkItem(dir, { intent: '   ', type: 'feature' })).toThrow('intent')
    expect(() => core.createWorkItem(dir, { intent: 'x', type: 'nope' })).toThrow('type')
  })

  it('accepts every canonical Work Item type offered by the capture definition', async () => {
    const core = await import('../src/core.js')
    for (const t of core.getWorkItemCaptureDefinition().types.map((x) => x.value)) {
      const res = core.createWorkItem(dir, { intent: `A ${t}`, type: t })
      expect(core.getWorkItem(dir, res.id).type).toBe(t)
    }
  })
})

describe('VS-099: edit round-trip', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('persists outcome, modules, coverage, impact, confidence, unknowns and criteria', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'Enable registration', type: 'feature' })
    const edit = core.getWorkItemForEdit(dir, id)
    const res = core.updateWorkItem(dir, id, emptyInput({
      title: 'Enable registration', type: 'feature',
      actor: 'New visitor',
      currentBehavior: 'Public page sends visitors to the beta flow.',
      targetBehavior: 'A visitor completes regular registration.',
      entryPoints: 'Public registration page',
      scopeConfidence: { level: 'medium', reasons: ['Backend confirmed.'] },
      scopeUnknowns: ['Is email verification required?'],
      affectedModules: ['core', 'frontend'],
      moduleCoverage: [{ id: 'core', status: 'affected' }, { id: 'frontend', status: 'affected', reason: 'Form changes.' }],
      impactAnalysis: [{ surface: 'frontend', status: 'affected' }, { surface: 'feature-flags', status: 'unknown', question: 'Flag needed?' }],
      acceptanceCriteria: [{ text: 'A visitor can register.', checked: null }],
    }), edit.revision)
    expect(res.revision).not.toBe(edit.revision)

    const wi = core.getWorkItem(dir, id)
    expect(wi.currentBehavior).toContain('beta flow')
    expect(wi.targetBehavior).toContain('completes regular registration')
    expect(wi.scopeConfidence?.level).toBe('medium')
    expect(wi.affectedModules).toEqual(['core', 'frontend'])
    expect(wi.moduleCoverage.find((c) => c.id === 'frontend')?.reason).toBe('Form changes.')
    expect(wi.impactAnalysis.find((i) => i.surface === 'feature-flags')?.status).toBe('unknown')
    expect(wi.scopeUnknowns).toEqual(['Is email verification required?'])
    expect(wi.acceptanceCriteria[0].text).toBe('A visitor can register.')
  })

  it('reloading the edit model reflects saved values', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    let edit = core.getWorkItemForEdit(dir, id)
    core.updateWorkItem(dir, id, emptyInput({ title: 'X', actor: 'Someone' }), edit.revision)
    edit = core.getWorkItemForEdit(dir, id)
    expect(edit.actor).toBe('Someone')
  })
})

describe('WI-077: assignment-only updates', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('updates assignments in-progress without changing lifecycle or body', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-001.md', '---\ntype: feature\nid: WI-001\ntitle: In flight\nstatus: in-progress\n---\n# In flight\n\n## Acceptance criteria\n\n- Preserve me\n')
    const result = core.updateWorkItemAssignments(dir, 'WI-001', { owners: ['developer-a'], contributors: ['developer-b'] }, core.getWorkItemForEdit(dir, 'WI-001').revision)
    expect(result.status).toBe('in-progress')
    const saved = fs.readFileSync(path.join(dir, 'knowledge/delivery/work-items/in-progress/WI-001.md'), 'utf-8')
    expect(saved).toContain('status: in-progress')
    expect(saved).toContain('Preserve me')
    expect(core.getWorkItem(dir, 'WI-001').owners).toEqual(['developer-a'])
  })

  it('rejects stale assignment updates and completed Work Items', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/delivery/work-items/completed/WI-002.md', '---\ntype: feature\nid: WI-002\ntitle: Done\nstatus: completed\n---\n# Done\n')
    expect(() => core.updateWorkItemAssignments(dir, 'WI-002', { owners: ['developer-a'], contributors: [] }, core.getWorkItemForEdit(dir, 'WI-002').revision)).toThrow('Assignments cannot be changed')
    expect(() => core.updateWorkItemAssignments(dir, 'WI-002', { owners: [], contributors: [] }, 'stale')).toThrow('changed outside')
  })
})

describe('VS-099: no-lossy rewrite', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('preserves unknown frontmatter keys and unknown body sections', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/delivery/work-items/draft/WI-050.md', [
      '---', 'id: WI-050', 'title: Legacy draft', 'type: feature', 'status: draft',
      'future_field:', '  nested: keep-me', 'custom_tag: important',
      '---', '', '# Legacy draft', '', '## Current behavior', '', 'Old.', '',
      '## Custom future section', '', 'Do not delete this content.', '',
    ].join('\n'))
    const edit = core.getWorkItemForEdit(dir, 'WI-050')
    core.updateWorkItem(dir, 'WI-050', emptyInput({ title: 'Legacy draft', currentBehavior: 'Updated.' }), edit.revision)
    const raw = fs.readFileSync(path.join(dir, 'knowledge/delivery/work-items/draft/WI-050.md'), 'utf-8')
    expect(raw).toContain('future_field')
    expect(raw).toContain('keep-me')
    expect(raw).toContain('custom_tag')
    expect(raw).toContain('Custom future section')
    expect(raw).toContain('Do not delete this content.')
    expect(raw).toContain('Updated.')
  })
})

describe('VS-099: concurrency', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('detects an external change and refuses to overwrite', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    const edit = core.getWorkItemForEdit(dir, id)
    // External modification after the editor loaded.
    const p = path.join(dir, edit.path)
    fs.writeFileSync(p, fs.readFileSync(p, 'utf-8') + '\n<!-- external -->\n', 'utf-8')
    expect(() => core.updateWorkItem(dir, id, emptyInput({ title: 'X' }), edit.revision))
      .toThrow(core.WorkItemWriteError)
    try {
      core.updateWorkItem(dir, id, emptyInput({ title: 'X' }), edit.revision)
    } catch (err) {
      expect((err as { code: string }).code).toBe('WORK_ITEM_CONFLICT')
    }
    // The external content survived (no silent overwrite).
    expect(fs.readFileSync(p, 'utf-8')).toContain('external')
  })
})

describe('VS-099: validation + transitions', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('flags coverage/affected inconsistency as blocking', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    const edit = core.getWorkItemForEdit(dir, id)
    core.updateWorkItem(dir, id, emptyInput({
      title: 'X', affectedModules: ['core'],
      moduleCoverage: [{ id: 'frontend', status: 'affected' }],
    }), edit.revision)
    const { findings, canMarkReady } = core.validateWorkItem(dir, id)
    expect(findings.some((f) => f.level === 'blocking' && f.message.includes('frontend'))).toBe(true)
    expect(canMarkReady).toBe(false)
  })

  it('does not auto-transition on save; Mark Ready is explicit and uses Core', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    let edit = core.getWorkItemForEdit(dir, id)
    const upd = core.updateWorkItem(dir, id, emptyInput({
      title: 'X', targetBehavior: 'Done.', affectedModules: ['core'],
      moduleCoverage: [{ id: 'core', status: 'affected' }],
      scopeConfidence: { level: 'high', reasons: [] },
      acceptanceCriteria: [{ text: 'Works.', checked: null }],
    }), edit.revision)
    expect(core.getWorkItem(dir, id).status).toBe('draft') // still draft after save

    const t = core.transitionWorkItem(dir, id, 'ready', upd.revision)
    expect(t.status).toBe('ready')
    expect(core.getWorkItem(dir, id).status).toBe('ready')
  })

  it('refuses Mark Ready with blocking findings', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    const edit = core.getWorkItemForEdit(dir, id)
    const upd = core.updateWorkItem(dir, id, emptyInput({
      title: 'X', affectedModules: ['core'], moduleCoverage: [{ id: 'frontend', status: 'affected' }],
    }), edit.revision)
    expect(() => core.transitionWorkItem(dir, id, 'ready', upd.revision)).toThrow('blocking')
  })

  it('reopen Ready → Draft, and a ready item is not directly editable', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'X', type: 'feature' })
    let edit = core.getWorkItemForEdit(dir, id)
    const upd = core.updateWorkItem(dir, id, emptyInput({
      title: 'X', targetBehavior: 'Done.', affectedModules: ['core'],
      moduleCoverage: [{ id: 'core', status: 'affected' }], scopeConfidence: { level: 'high', reasons: [] },
      acceptanceCriteria: [{ text: 'Works.', checked: null }],
    }), edit.revision)
    const ready = core.transitionWorkItem(dir, id, 'ready', upd.revision)

    const readyEdit = core.getWorkItemForEdit(dir, id)
    expect(readyEdit.editable).toBe(false)
    expect(readyEdit.editableReason).toContain('Reopen')
    // Direct update is refused for a ready item.
    expect(() => core.updateWorkItem(dir, id, emptyInput({ title: 'X' }), ready.revision)).toThrow(core.WorkItemWriteError)

    const back = core.transitionWorkItem(dir, id, 'draft', ready.revision)
    expect(back.status).toBe('draft')
    expect(core.getWorkItemForEdit(dir, id).editable).toBe(true)
  })

  it('starts a ready item without loss or duplicate artifacts', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'Start', type: 'feature' })
    const initial = core.getWorkItemForEdit(dir, id)
    const updated = core.updateWorkItem(dir, id, emptyInput({ title: 'Start', targetBehavior: 'Done.', affectedModules: ['core'], moduleCoverage: [{ id: 'core', status: 'affected' }], scopeConfidence: { level: 'high', reasons: [] }, acceptanceCriteria: [{ text: 'Works.', checked: null }] }), initial.revision)
    const ready = core.transitionWorkItem(dir, id, 'ready', updated.revision)
    const started = core.transitionWorkItem(dir, id, 'in-progress', ready.revision)
    expect(started.status).toBe('in-progress')
    expect(started.path).toContain('/in-progress/')
    expect(fs.existsSync(path.join(dir, started.path))).toBe(true)
    expect(fs.existsSync(path.join(dir, ready.path))).toBe(false)
    expect(fs.readFileSync(path.join(dir, started.path), 'utf8')).toContain('## Target behavior\n\nDone.')
  })

  it('rejects stale and invalid transitions to in-progress', async () => {
    const core = await import('../src/core.js')
    const { id } = core.createWorkItem(dir, { intent: 'Start', type: 'feature' })
    const edit = core.getWorkItemForEdit(dir, id)
    expect(() => core.transitionWorkItem(dir, id, 'in-progress', edit.revision)).toThrow('Cannot transition a draft')
    write(dir, 'knowledge/delivery/work-items/completed/WI-999.md', '---\nid: WI-999\ntitle: Done\ntype: feature\nstatus: completed\n---\n# Done')
    expect(() => core.transitionWorkItem(dir, 'WI-999', 'in-progress', core.getWorkItemForEdit(dir, 'WI-999').revision)).toThrow('Cannot transition a completed')
  })

})

describe('VS-099: source of truth', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('created Work Item exists as a project artifact independent of any Admin DB', async () => {
    const core = await import('../src/core.js')
    const res = core.createWorkItem(dir, { intent: 'Persisted', type: 'feature' })
    // No Admin SQLite involved — the artifact is the source of truth.
    expect(fs.existsSync(path.join(dir, res.path))).toBe(true)
    expect(core.getWorkItems(dir).items.map((i) => i.id)).toContain('WI-001')
  })
})
