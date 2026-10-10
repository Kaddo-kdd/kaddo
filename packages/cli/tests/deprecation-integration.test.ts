import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-depint2-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function init(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: di', '  state: legacy', '  structure: multirepo', 'team:', '  size: small'].join('\n'))
  write(dir, '.kaddo/modules.yml', ['modules:', '  - id: web', '    name: web', '    path: packages/web', '  - id: api', '    name: api', '    path: packages/api'].join('\n'))
}

// A multirepo plan: web route + api function in wave 1, a shared DB object in wave 2.
const PLAN = [
  '---', 'id: DEP-001', 'type: deprecation-plan', 'title: Retire legacy credit', 'targets:',
  '  - id: DEP-TGT-WEB', '    type: ui', '    locator: web/CreditForm.tsx', '    module: web', '    lifecycle: candidate',
  '  - id: DEP-TGT-API', '    type: route', '    locator: POST /legacy/credit', '    module: api', '    lifecycle: candidate',
  '  - id: DEP-TGT-DB', '    type: database-object', '    locator: dbo.OLD_CREDIT', '    resource: RES-main-db', '    lifecycle: candidate',
  '    depends_on_removal: [DEP-TGT-WEB, DEP-TGT-API]',
  '---', '', '# Purpose', '', 'Retire legacy credit.', '',
].join('\n')

describe('WI-050 — Work Item + Project Resource integration', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); init(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('parses deprecation_targets on a Work Item (WI -> DEP -> target), several notations (AC-10)', async () => {
    const core = await import('../src/core.js')
    const refs = core.parseWorkItemDeprecationTargets({
      deprecation_targets: ['DEP-TGT-API', 'DEP-001/DEP-TGT-DB', { plan: 'DEP-001', target: 'DEP-TGT-WEB' }],
    })
    expect(refs).toEqual([
      { plan: null, target: 'DEP-TGT-API' },
      { plan: 'DEP-001', target: 'DEP-TGT-DB' },
      { plan: 'DEP-001', target: 'DEP-TGT-WEB' },
    ])
  })

  it('WorkItemDetail surfaces deprecationTargets', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    write(dir, 'knowledge/delivery/work-items/ready/WI-900.md', [
      '---', 'id: WI-900', 'type: feature', 'title: Retire web credit form', 'status: ready',
      'affected_modules: [web]', 'deprecation_targets: [DEP-001/DEP-TGT-WEB]', '---', '', '# WI-900', '', 'Body.',
    ].join('\n'))
    const wi = core.getWorkItem(dir, 'WI-900')!
    expect(wi.deprecationTargets).toEqual([{ plan: 'DEP-001', target: 'DEP-TGT-WEB' }])
  })

  it('proposes one WI candidate per wave/module (multirepo), carrying resources (AC-03)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    const plan = core.getDeprecationPlan(dir, 'DEP-001')!
    const candidates = core.proposeWorkItemCandidates(plan)
    // Wave 1 splits into api + web (alphabetical); wave 2 is the shared DB object (no module).
    expect(candidates.map((c) => ({ wave: c.wave, module: c.module, targets: c.deprecationTargets }))).toEqual([
      { wave: 1, module: 'api', targets: ['DEP-TGT-API'] },
      { wave: 1, module: 'web', targets: ['DEP-TGT-WEB'] },
      { wave: 2, module: null, targets: ['DEP-TGT-DB'] },
    ])
    const dbCandidate = candidates.find((c) => c.deprecationTargets.includes('DEP-TGT-DB'))!
    expect(dbCandidate.resources).toEqual(['RES-main-db'])
  })

  it('enriches the Implementation Handoff with Relevant Deprecation Targets + resource boundary (AC-04)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    write(dir, 'knowledge/tech/resources/main-db.md', [
      '---', 'id: RES-main-db', 'type: project-resource', 'title: Main DB', 'resource_type: database',
      'access_boundaries:', '  production: [read]', '---', '', '# Purpose', '', 'Primary DB.',
    ].join('\n'))
    write(dir, 'knowledge/delivery/work-items/ready/WI-901.md', [
      '---', 'id: WI-901', 'type: feature', 'title: Retire DB object', 'status: ready',
      'affected_modules: [api]', 'deprecation_targets: [DEP-001/DEP-TGT-DB]', '---', '', '# WI-901', '', 'Body.',
    ].join('\n'))
    const handoff = core.buildImplementationHandoff(dir, 'WI-901')
    expect(handoff.deprecationTargets).toEqual([{ plan: 'DEP-001', target: 'DEP-TGT-DB' }])
    expect(handoff.text).toContain('Relevant Deprecation Targets')
    expect(handoff.text).toContain('DEP-TGT-DB')
    expect(handoff.text).toContain('depends_on_removal: DEP-TGT-WEB, DEP-TGT-API')
    expect(handoff.text).toContain('RES-main-db')
    expect(handoff.text).toContain('production: read') // resource boundary surfaced
    expect(handoff.text).toContain('Runbook') // production safety reminder
  })

  it('handoff notes a target that cannot be resolved rather than inventing one', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/legacy/deprecations/DEP-001.md', PLAN)
    write(dir, 'knowledge/delivery/work-items/ready/WI-902.md', [
      '---', 'id: WI-902', 'type: feature', 'title: Ghost', 'status: ready',
      'affected_modules: [api]', 'deprecation_targets: [DEP-TGT-GHOST]', '---', '', '# WI-902', '', 'Body.',
    ].join('\n'))
    const handoff = core.buildImplementationHandoff(dir, 'WI-902')
    expect(handoff.text).toContain('target not found')
  })
})
