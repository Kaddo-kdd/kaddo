import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ie-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function initProject(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: test-project', '  state: pre-ai', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
}

const IN_PROGRESS_WI = [
  '---',
  'id: WI-020',
  'title: Add evidence collection',
  'type: feature',
  'status: in-progress',
  'affected_modules: [core]',
  'domains: [Delivery]',
  '---', '',
  '# Add evidence collection', '',
  '## Acceptance criteria', '',
  '- Evidence collection produces structured output',
  '- AC verification maps each criterion',
  '- Release gates block completion when failed',
  '',
].join('\n')

const IN_PROGRESS_WI_WITH_GATES = [
  '---',
  'id: WI-021',
  'title: Gated work item',
  'type: feature',
  'status: in-progress',
  'affected_modules: [core]',
  'release_gates:',
  '  - id: unit-tests',
  '    status: passed',
  '  - id: security-review',
  '    status: failed',
  '    reason: Pending audit',
  'completion_exceptions:',
  '  - id: EX-001',
  '    status: accepted',
  '    reason: Deferred to next sprint',
  '---', '',
  '# Gated work item', '',
  '## Acceptance criteria', '',
  '- Feature works end to end',
  '',
].join('\n')

const IN_PROGRESS_WI_REJECTED_EXCEPTION = [
  '---',
  'id: WI-022',
  'title: Rejected exception item',
  'type: feature',
  'status: in-progress',
  'completion_exceptions:',
  '  - id: EX-002',
  '    status: rejected',
  '    reason: Not acceptable',
  '---', '',
  '# Rejected exception item', '',
  '## Acceptance criteria', '',
  '- Basic functionality works',
  '',
].join('\n')

const DRAFT_WI = [
  '---', 'id: WI-023', 'title: Draft item', 'type: feature', 'status: draft', '---', '',
  '# Draft item', '',
].join('\n')

const READY_WI = [
  '---', 'id: WI-024', 'title: Ready item', 'type: feature', 'status: ready', '---', '',
  '# Ready item', '',
].join('\n')

const COMPLETED_WI = [
  '---', 'id: WI-025', 'title: Completed item', 'type: feature', 'status: completed', '---', '',
  '# Completed item', '',
].join('\n')

// --- Evidence Collection ---

describe('VS-111: collectImplementationEvidence', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('collects evidence for in-progress WI with changed paths and validations', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const evidence = core.collectImplementationEvidence(dir, 'WI-020', {
      repos: [{
        repoId: 'core',
        changedPaths: ['src/core/foo.ts', 'src/core/bar.ts'],
        validations: [{ command: 'pnpm test', status: 'passed' }],
      }],
      acVerifications: [],
    })
    expect(evidence.repositories).toBeDefined()
    expect(evidence.repositories!['core']).toBeDefined()
    expect(evidence.repositories!['core'].changed_paths).toEqual(['src/core/foo.ts', 'src/core/bar.ts'])
    expect(evidence.repositories!['core'].validations![0].status).toBe('passed')
  })

  it('throws WorkItemNotFoundError for unknown WI', async () => {
    const core = await import('../src/core.js')
    expect(() => core.collectImplementationEvidence(dir, 'WI-999', {
      repos: [], acVerifications: [],
    })).toThrow(core.WorkItemNotFoundError)
  })

  it('throws WorkItemNotInProgressError for draft WI', async () => {
    write(dir, 'knowledge/delivery/work-items/draft/WI-023.md', DRAFT_WI)
    const core = await import('../src/core.js')
    expect(() => core.collectImplementationEvidence(dir, 'WI-023', {
      repos: [], acVerifications: [],
    })).toThrow(core.WorkItemNotInProgressError)
  })

  it('throws WorkItemNotInProgressError for ready WI', async () => {
    write(dir, 'knowledge/delivery/work-items/ready/WI-024.md', READY_WI)
    const core = await import('../src/core.js')
    expect(() => core.collectImplementationEvidence(dir, 'WI-024', {
      repos: [], acVerifications: [],
    })).toThrow(core.WorkItemNotInProgressError)
  })

  it('throws WorkItemNotInProgressError for completed WI', async () => {
    write(dir, 'knowledge/delivery/work-items/completed/WI-025.md', COMPLETED_WI)
    const core = await import('../src/core.js')
    expect(() => core.collectImplementationEvidence(dir, 'WI-025', {
      repos: [], acVerifications: [],
    })).toThrow(core.WorkItemNotInProgressError)
  })

  it('filters secret paths from changed_paths', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const evidence = core.collectImplementationEvidence(dir, 'WI-020', {
      repos: [{
        repoId: 'core',
        changedPaths: ['src/app.ts', '.env', '.env.local', 'config/credentials.json', 'certs/server.key', 'src/token-utils.ts'],
        validations: [],
      }],
      acVerifications: [],
    })
    const paths = evidence.repositories!['core'].changed_paths!
    expect(paths).toContain('src/app.ts')
    expect(paths).not.toContain('.env')
    expect(paths).not.toContain('.env.local')
    expect(paths).not.toContain('config/credentials.json')
    expect(paths).not.toContain('certs/server.key')
  })

  it('handles empty repos array', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const evidence = core.collectImplementationEvidence(dir, 'WI-020', {
      repos: [],
      acVerifications: [],
    })
    expect(evidence.repositories).toEqual({})
  })

  it('preserves migrations in evidence', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const evidence = core.collectImplementationEvidence(dir, 'WI-020', {
      repos: [{
        repoId: 'core',
        changedPaths: ['migrations/001.sql'],
        validations: [],
        migrations: [{ id: '001', environment: 'staging', status: 'applied' }],
      }],
      acVerifications: [],
    })
    expect(evidence.repositories!['core'].migrations).toHaveLength(1)
    expect(evidence.repositories!['core'].migrations![0].id).toBe('001')
  })
})

// --- Verification ---

describe('VS-111: verifyWorkItem', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('produces AC verification results', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [{ command: 'pnpm test', status: 'passed' }] }],
      acVerifications: [
        { criterion: 'Evidence collection produces structured output', status: 'passed' },
        { criterion: 'AC verification maps each criterion', status: 'passed' },
        { criterion: 'Release gates block completion when failed', status: 'failed' },
      ],
    })
    expect(result.acVerifications).toHaveLength(3)
    expect(result.acSummary.total).toBe(3)
    expect(result.acSummary.passed).toBe(2)
    expect(result.acSummary.failed).toBe(1)
  })

  it('computes acSummary counts correctly', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [
        { criterion: 'A', status: 'passed' },
        { criterion: 'B', status: 'failed' },
        { criterion: 'C', status: 'not-verified' },
        { criterion: 'D', status: 'manual-review-required' },
      ],
    })
    expect(result.acSummary).toEqual({ total: 4, passed: 1, failed: 1, notVerified: 1, manualReview: 1 })
  })

  it('handles manual-review-required ACs', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [
        { criterion: 'Visual test', status: 'manual-review-required', evidence: 'Screenshot attached' },
      ],
    })
    expect(result.acVerifications[0].status).toBe('manual-review-required')
    expect(result.acSummary.manualReview).toBe(1)
  })

  it('computes planned vs actual when affected_modules exist', async () => {
    const multiModuleWI = [
      '---', 'id: WI-020b', 'title: Multi-module', 'type: feature', 'status: in-progress',
      'affected_modules: [core, cli]', 'domains: [Delivery]',
      '---', '', '# Multi-module', '',
    ].join('\n')
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020b.md', multiModuleWI)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-020b', {
      repos: [
        { repoId: 'core', changedPaths: ['src/core.ts'], validations: [] },
        { repoId: 'api', changedPaths: ['src/api.ts'], validations: [] },
      ],
      acVerifications: [],
    })
    expect(result.plannedVsActual).not.toBeNull()
    expect(result.plannedVsActual!.plannedModules).toEqual(['core', 'cli'])
    expect(result.plannedVsActual!.addedModules).toContain('api')
    expect(result.plannedVsActual!.missingModules).toContain('cli')
  })

  it('reads release gates from frontmatter', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-021.md', IN_PROGRESS_WI_WITH_GATES)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-021', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [{ criterion: 'Feature works end to end', status: 'passed' }],
    })
    expect(result.releaseGates).toHaveLength(2)
    expect(result.releaseGates[0].id).toBe('unit-tests')
    expect(result.releaseGates[1].status).toBe('failed')
  })

  it('derives validationStatus from evidence', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const result = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [{ command: 'pnpm test', status: 'passed' }] }],
      acVerifications: [{ criterion: 'A', status: 'passed' }],
    })
    expect(result.validationStatus).toBe('passed')
  })
})

// --- Completion Evaluation ---

describe('VS-111: evaluateCompletion', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('READY_TO_COMPLETE when all ACs pass and no blockers', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const verification = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [{ command: 'pnpm test', status: 'passed' }] }],
      acVerifications: [
        { criterion: 'Evidence collection produces structured output', status: 'passed' },
        { criterion: 'AC verification maps each criterion', status: 'passed' },
        { criterion: 'Release gates block completion when failed', status: 'passed' },
      ],
    })
    const evaluation = core.evaluateCompletion(verification)
    expect(evaluation.readiness).toBe('READY_TO_COMPLETE')
    expect(evaluation.blockers).toHaveLength(0)
  })

  it('NEEDS_WORK when an AC fails', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-020.md', IN_PROGRESS_WI)
    const core = await import('../src/core.js')
    const verification = core.verifyWorkItem(dir, 'WI-020', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [
        { criterion: 'Evidence collection produces structured output', status: 'passed' },
        { criterion: 'AC verification maps each criterion', status: 'failed' },
      ],
    })
    const evaluation = core.evaluateCompletion(verification)
    expect(evaluation.readiness).toBe('NEEDS_WORK')
    expect(evaluation.blockers.length).toBeGreaterThan(0)
  })

  it('BLOCKED when release gate is failed', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-021.md', IN_PROGRESS_WI_WITH_GATES)
    const core = await import('../src/core.js')
    const verification = core.verifyWorkItem(dir, 'WI-021', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [{ criterion: 'Feature works end to end', status: 'passed' }],
    })
    const evaluation = core.evaluateCompletion(verification)
    expect(evaluation.readiness).toBe('BLOCKED')
    expect(evaluation.blockers.some((b) => b.includes('security-review'))).toBe(true)
  })

  it('BLOCKED when exception is rejected', async () => {
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-022.md', IN_PROGRESS_WI_REJECTED_EXCEPTION)
    const core = await import('../src/core.js')
    const verification = core.verifyWorkItem(dir, 'WI-022', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [] }],
      acVerifications: [{ criterion: 'Basic functionality works', status: 'passed' }],
    })
    const evaluation = core.evaluateCompletion(verification)
    expect(evaluation.readiness).toBe('BLOCKED')
    expect(evaluation.blockers.some((b) => b.includes('EX-002'))).toBe(true)
  })

  it('READY_WITH_EXCEPTIONS when accepted exceptions exist', async () => {
    const wiContent = [
      '---',
      'id: WI-026',
      'title: Exception item',
      'type: feature',
      'status: in-progress',
      'completion_exceptions:',
      '  - id: EX-003',
      '    status: accepted',
      '    reason: Known limitation',
      '---', '',
      '# Exception item', '',
      '## Acceptance criteria', '',
      '- Feature works', '',
    ].join('\n')
    write(dir, 'knowledge/delivery/work-items/in-progress/WI-026.md', wiContent)
    const core = await import('../src/core.js')
    const verification = core.verifyWorkItem(dir, 'WI-026', {
      repos: [{ repoId: 'core', changedPaths: ['src/foo.ts'], validations: [{ command: 'pnpm test', status: 'passed' }] }],
      acVerifications: [{ criterion: 'Feature works', status: 'passed' }],
    })
    const evaluation = core.evaluateCompletion(verification)
    expect(evaluation.readiness).toBe('READY_WITH_EXCEPTIONS')
  })
})

// --- filterSecretPaths ---

describe('VS-111: filterSecretPaths', () => {
  it('filters known secret patterns', async () => {
    const core = await import('../src/core.js')
    const result = core.filterSecretPaths([
      'src/app.ts',
      '.env',
      '.env.production',
      'config/credentials.yml',
      'certs/tls.key',
      'secrets/api.pem',
      'auth/token-refresh.ts',
      'dist/bundle.js',
      'keys/deploy.p12',
    ])
    expect(result).toEqual(['src/app.ts', 'dist/bundle.js'])
  })
})

// --- Regression ---

describe('VS-111: No regression on existing Core exports', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); initProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('buildRefinementHandoff and buildImplementationHandoff still work', async () => {
    const readyWi = [
      '---', 'id: WI-030', 'title: Regression test', 'type: feature', 'status: ready',
      'affected_modules: [core]', 'domains: [Tech]',
      'scope_confidence:', '  level: high', '  reasons: [clear]',
      '---', '',
      '# Regression test', '',
      '## Current behavior', '', 'None.', '',
      '## Target behavior', '', 'Something.', '',
      '## Acceptance criteria', '', '- It works.', '',
    ].join('\n')
    write(dir, 'knowledge/delivery/work-items/ready/WI-030.md', readyWi)
    const core = await import('../src/core.js')
    const refH = core.buildRefinementHandoff(dir, 'WI-030')
    expect(refH.workItemId).toBe('WI-030')
    const implH = core.buildImplementationHandoff(dir, 'WI-030')
    expect(implH.workItemId).toBe('WI-030')
  })
})
