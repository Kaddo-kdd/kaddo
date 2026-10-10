import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-runbook-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

function productionReadyPlan(): string {
  return [
    '---', 'id: DEP-052', 'type: deprecation-plan', 'title: Retire legacy database object', 'purpose: Retire a verified legacy object.', 'targets:',
    '  - id: DEP-TGT-DEPENDENCY', '    type: function', '    locator: src/legacy.ts#caller', '    lifecycle: completed',
    '  - id: DEP-TGT-DB', '    type: database-object', '    title: Legacy audit table', '    locator: dbo.LegacyAudit', '    lifecycle: production-ready',
    '    resource: RES-main-db', '    depends_on_removal: [DEP-TGT-DEPENDENCY]',
    '    environments:', '      development: removed', '      test: removed', '      production: active',
    '    assessment:', '      blast_radius: medium', '      reversibility: backup-required',
    '    usage_evidence:', '      database:', '        status: no-usage', '        quality: observed-fact', '        detail: verified in dev and test',
    '---', '', '# Purpose', '', 'Retire the legacy object.', '',
  ].join('\n')
}

describe('WI-052 — Production Runbooks', () => {
  let dir: string
  beforeEach(() => {
    dir = tmpDir()
    write(dir, 'knowledge/legacy/deprecations/DEP-052.md', productionReadyPlan())
    write(dir, 'knowledge/tech/resources/main-db.md', [
      '---', 'id: RES-main-db', 'type: project-resource', 'title: Main database', 'resource_type: database',
      'access_boundaries:', '  production: [read, approved-write]',
      'access_interfaces:', '  - type: sql', '    tool: psql', '    operations: [read, write]', '    environments: [production]',
      '---', '', '# Purpose', '', 'Primary database.', '',
    ].join('\n'))
  })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('builds bounded target/resource/evidence context only after Dev/Test verification', async () => {
    const core = await import('../src/core.js')
    const context = core.buildProductionRunbookContext(dir, 'DEP-052', 'DEP-TGT-DB')
    expect(context.eligible).toBe(true)
    expect(context.resource?.id).toBe('RES-main-db')
    expect(context.dependencies.map((item) => item.id)).toEqual(['DEP-TGT-DEPENDENCY'])
    expect(context.nextStep).toMatch(/human approval/i)
  })

  it('creates a versioned proposal containing every mandatory section', async () => {
    const core = await import('../src/core.js')
    const runbook = core.createProductionRunbook(dir, 'DEP-052', 'DEP-TGT-DB')
    expect(runbook.id).toBe('RB-001')
    expect(runbook.path).toMatch(/^knowledge\/delivery\/runbooks\/RB-001-/)
    for (const section of core.RUNBOOK_SECTIONS) expect(runbook.markdownBody).toContain(`## ${section}`)
    expect(runbook.markdownBody).toMatch(/never executes production commands/i)
    expect(runbook.markdownBody).toContain('production-changed → observing → completed')
    expect(core.getProductionRunbook(dir, 'RB-001')?.approval.status).toBe('pending')
    expect(core.validateProductionRunbook(runbook).filter((item) => item.level === 'error')).toEqual([])
  })

  it('refuses a proposal when development and test are not both removed', async () => {
    const core = await import('../src/core.js')
    const file = path.join(dir, 'knowledge/legacy/deprecations/DEP-052.md')
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('      test: removed', '      test: active'))
    const context = core.buildProductionRunbookContext(dir, 'DEP-052', 'DEP-TGT-DB')
    expect(context.eligible).toBe(false)
    expect(context.blockers.join(' ')).toMatch(/Development and test/i)
    expect(() => core.createProductionRunbook(dir, 'DEP-052', 'DEP-TGT-DB')).toThrow(/Development and test/i)
  })

  it('marks a runbook invalid when backup or rollback is missing', async () => {
    const core = await import('../src/core.js')
    const runbook = core.createProductionRunbook(dir, 'DEP-052', 'DEP-TGT-DB')
    const incomplete = { ...runbook, markdownBody: runbook.markdownBody.replace('## Backup/Recovery', '## Removed backup').replace('## Rollback', '## Removed rollback') }
    const findings = core.validateProductionRunbook(incomplete)
    expect(findings.filter((item) => item.level === 'error').map((item) => item.message).join(' ')).toMatch(/Backup\/Recovery.*Rollback/s)
  })

  it('rejects destructive commands until a human approver and timestamp are recorded', async () => {
    const core = await import('../src/core.js')
    const runbook = core.createProductionRunbook(dir, 'DEP-052', 'DEP-TGT-DB')
    const pending = { ...runbook, markdownBody: `${runbook.markdownBody}\nDROP TABLE dbo.LegacyAudit;` }
    expect(core.validateProductionRunbook(pending).some((item) => item.level === 'error' && /explicit human approval/i.test(item.message))).toBe(true)
    const approved = { ...pending, approval: { required: true, status: 'approved' as const, approvedBy: 'release-manager', approvedAt: '2026-10-10T10:00:00Z' } }
    expect(core.validateProductionRunbook(approved).some((item) => item.level === 'error')).toBe(false)
    expect(core.validateProductionRunbook(approved).some((item) => item.level === 'warning' && /never execute/i.test(item.message))).toBe(true)
  })
})
