import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-098-'))
}

function writeFile(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

function initProject(dir: string, extra: Record<string, string> = {}) {
  writeFile(dir, '.kaddo/config.yml', [
    'project:',
    '  name: test-098',
    '  state: pre-ai',
    '  structure: multirepo',
    'team:',
    '  size: small',
  ].join('\n'))
  for (const [rel, content] of Object.entries(extra)) writeFile(dir, rel, content)
}

const RICH_WI = [
  '---',
  'id: WI-006',
  'title: Add profile birth date',
  'type: feature',
  'status: completed',
  'implementation_status: completed',
  'validation_status: accepted-with-exceptions',
  'release_status: blocked',
  'affected_modules: [core, frontend]',
  'decisions: [ADR-004]',
  'related_knowledge: [PROD-1]',
  'scope_confidence:',
  '  level: medium',
  '  reasons:',
  '    - Backend behavior was confirmed.',
  'module_coverage:',
  '  core:',
  '    status: affected',
  '    reason: Profile API changes.',
  '  frontend:',
  '    status: affected',
  '  admin:',
  '    status: reviewed-not-affected',
  'impact_analysis:',
  '  surfaces:',
  '    frontend:',
  '      status: affected',
  '    database:',
  '      status: reviewed-not-affected',
  '    feature-flags:',
  '      status: unknown',
  '      question: Is a flag needed?',
  'release_gates:',
  '  - id: remote-migration',
  '    status: blocked',
  '    reason: Supabase remote migration pending',
  '  - id: automated-validation',
  '    status: pending',
  'completion_exceptions:',
  '  - id: exc-1',
  '    status: accepted',
  '    reason: Automated validation was not executed.',
  'implementation_evidence:',
  '  repositories:',
  '    core:',
  '      role: core',
  '      status: completed',
  '      changed_paths:',
  '        - src/profile/api.ts',
  '    frontend:',
  '      role: module',
  '      status: completed',
  '      changed_paths:',
  '        - src/pages/profile/BirthDate.tsx',
  '---',
  '',
  '# Add profile birth date',
  '',
  '## Current behavior',
  '',
  'Users cannot manage their birth date.',
  '',
  '## Target behavior',
  '',
  'Users can optionally store and update their birth date.',
  '',
  '## Entry points',
  '',
  'Profile settings',
  '',
  '## Scope unknowns',
  '',
  '- Is age validation required?',
  '- Should birth date appear in a public profile?',
  '',
  '## Acceptance criteria',
  '',
  '- [x] API accepts a nullable birth date.',
  '- [ ] Automated validation still pending.',
  '- Public profile does not expose birth date.',
  '',
].join('\n')

const ACTIVE_WI = [
  '---',
  'id: WI-007',
  'title: Enable regular registration after beta',
  'type: feature',
  'status: ready',
  'affected_modules: [core]',
  'scope_confidence:',
  '  level: high',
  '  reasons: []',
  '---',
  '',
  '# Enable registration',
  '',
  '## Current behavior',
  '',
  '_What happens today?_',
  '',
].join('\n')

const ARCHIVED_WI = [
  '---',
  'id: WI-005',
  'title: Old idea',
  'type: spike',
  'status: archived',
  '---',
  '',
  '# Old idea',
  '',
].join('\n')

const LEGACY_WI = [
  '---',
  'id: WI-OLD',
  'title: Legacy item',
  'type: feature',
  'status: done',
  '---',
  '',
  '# Legacy',
  '',
  '## Problem',
  '',
  'Something old.',
  '',
].join('\n')

const ADR = [
  '---',
  'id: ADR-004',
  'type: adr',
  'title: Profile data handling',
  'status: accepted',
  '---',
  '',
  '# ADR-004',
  '',
].join('\n')

const PRODUCT_KNOWLEDGE = [
  '---',
  'id: PROD-1',
  'type: capabilities',
  'title: Profile capability',
  '---',
  '',
  '# Profile',
  '',
].join('\n')

function fullProject(dir: string) {
  initProject(dir, {
    'knowledge/delivery/work-items/completed/WI-006.md': RICH_WI,
    'knowledge/delivery/work-items/ready/WI-007.md': ACTIVE_WI,
    'knowledge/delivery/work-items/archived/WI-005.md': ARCHIVED_WI,
    'knowledge/tech/decisions/ADR-004.md': ADR,
    'knowledge/product/capabilities.md': PRODUCT_KNOWLEDGE,
  })
}

// ─── Core: summary ────────────────────────────────────────────────────────────

describe('VS-098: Core work item summary', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('summarizes counts by lifecycle', async () => {
    fullProject(dir)
    const core = await import('../src/core.js')
    const s = core.getWorkItemsSummary(dir)
    expect(s.total).toBe(3)
    expect(s.active).toBe(1)
    expect(s.ready).toBe(1)
    expect(s.completed).toBe(1)
    expect(s.archived).toBe(1)
  })

  it('empty project yields zeroed summary', async () => {
    initProject(dir)
    const core = await import('../src/core.js')
    const s = core.getWorkItemsSummary(dir)
    expect(s.total).toBe(0)
    expect(s.active).toBe(0)
  })
})

// ─── Core: list + filters ─────────────────────────────────────────────────────

describe('VS-098: Core work item list', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); fullProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('returns all items with delivery signals and module list', async () => {
    const core = await import('../src/core.js')
    const res = core.getWorkItems(dir)
    expect(res.items.length).toBe(3)
    expect(res.modules).toEqual(['core', 'frontend'])
    const wi6 = res.items.find((i) => i.id === 'WI-006')!
    expect(wi6.implementationStatus).toBe('completed')
    expect(wi6.validationStatus).toBe('accepted-with-exceptions')
    expect(wi6.releaseStatus).toBe('blocked')
    expect(wi6.affectedModules).toEqual(['core', 'frontend'])
  })

  it('filters by status', async () => {
    const core = await import('../src/core.js')
    expect(core.getWorkItems(dir, { status: 'completed' }).items.map((i) => i.id)).toEqual(['WI-006'])
    expect(core.getWorkItems(dir, { status: 'ready' }).items.map((i) => i.id)).toEqual(['WI-007'])
  })

  it('filters by module', async () => {
    const core = await import('../src/core.js')
    const res = core.getWorkItems(dir, { module: 'frontend' })
    expect(res.items.map((i) => i.id)).toEqual(['WI-006'])
  })

  it('searches by id, title and module', async () => {
    const core = await import('../src/core.js')
    expect(core.getWorkItems(dir, { query: 'birth' }).items.map((i) => i.id)).toEqual(['WI-006'])
    expect(core.getWorkItems(dir, { query: 'WI-007' }).items.map((i) => i.id)).toEqual(['WI-007'])
    expect(core.getWorkItems(dir, { query: 'core' }).items.length).toBe(2)
  })

  it('summary is unaffected by filters', async () => {
    const core = await import('../src/core.js')
    const res = core.getWorkItems(dir, { status: 'completed' })
    expect(res.summary.total).toBe(3)
  })
})

// ─── Core: detail ─────────────────────────────────────────────────────────────

describe('VS-098: Core work item detail', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); fullProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('exposes identity, lifecycle and delivery status', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.id).toBe('WI-006')
    expect(wi.title).toBe('Add profile birth date')
    expect(wi.status).toBe('completed')
    expect(wi.implementationStatus).toBe('completed')
    expect(wi.validationStatus).toBe('accepted-with-exceptions')
    expect(wi.releaseStatus).toBe('blocked')
    expect(wi.path).toBe('knowledge/delivery/work-items/completed/WI-006.md')
  })

  it('parses outcome prose sections', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.currentBehavior).toContain('cannot manage their birth date')
    expect(wi.targetBehavior).toContain('optionally store and update')
    expect(wi.entryPoints).toContain('Profile settings')
  })

  it('parses scope confidence, coverage, impact and unknowns', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.scopeConfidence?.level).toBe('medium')
    expect(wi.moduleCoverage.find((c) => c.id === 'core')?.status).toBe('affected')
    expect(wi.impactAnalysis.find((i) => i.surface === 'feature-flags')?.status).toBe('unknown')
    expect(wi.scopeUnknowns.length).toBe(2)
  })

  it('parses acceptance criteria with per-criterion state when present, none invented', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.acceptanceCriteria.length).toBe(3)
    expect(wi.acceptanceCriteria[0]).toEqual({ text: 'API accepts a nullable birth date.', checked: true })
    expect(wi.acceptanceCriteria[1].checked).toBe(false)
    expect(wi.acceptanceCriteria[2].checked).toBeNull()
  })

  it('parses multirepo implementation evidence', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.implementationEvidence.map((e) => e.module).sort()).toEqual(['core', 'frontend'])
    const coreRepo = wi.implementationEvidence.find((e) => e.module === 'core')!
    expect(coreRepo.status).toBe('completed')
    expect(coreRepo.changedPaths).toContain('src/profile/api.ts')
  })

  it('parses release gates and completion exceptions', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.releaseGates.map((g) => g.id)).toEqual(['remote-migration', 'automated-validation'])
    expect(wi.releaseGates[0].status).toBe('blocked')
    expect(wi.completionExceptions[0].reason).toContain('Automated validation')
  })

  it('links decisions and related knowledge to navigable artifacts', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    const adr = wi.decisions.find((d) => d.id === 'ADR-004')!
    expect(adr.knowledgeId).toBe('ADR-004')
    expect(adr.knowledgeLayer).toBe('tech')
    expect(wi.relatedKnowledge.map((k) => k.id)).toContain('PROD-1')
  })

  it('a completed Work Item with blocked release is not reinterpreted as blocked', async () => {
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    expect(wi.status).toBe('completed')
    expect(wi.releaseStatus).toBe('blocked')
  })

  it('throws WorkItemNotFoundError for unknown id', async () => {
    const core = await import('../src/core.js')
    expect(() => core.getWorkItem(dir, 'WI-999')).toThrow(core.WorkItemNotFoundError)
  })
})

// ─── Core: legacy ─────────────────────────────────────────────────────────────

describe('VS-098: Legacy work items', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('legacy Work Item opens without new metadata and does not fail', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/completed/WI-OLD.md': LEGACY_WI })
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-OLD')
    expect(wi.status).toBe('completed') // legacy `done` maps to completed
    expect(wi.scopeConfidence).toBeNull()
    expect(wi.moduleCoverage).toEqual([])
    expect(wi.impactAnalysis).toEqual([])
    expect(wi.implementationEvidence).toEqual([])
    expect(wi.releaseGates).toEqual([])
    expect(wi.acceptanceCriteria).toEqual([])
  })

  it('template placeholder sections are treated as absent, never invented', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/ready/WI-007.md': ACTIVE_WI })
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-007')
    expect(wi.currentBehavior).toBeNull() // body is the `_What happens today?_` placeholder
  })
})

// ─── WI-025: canonical Markdown body (no information loss) ──────────────────────

const FUTURE_WI = [
  '---',
  'id: WI-FUTURE',
  'title: Item with an unmodeled section',
  'type: feature',
  'status: completed',
  'affected_modules: [core]',
  '---',
  '',
  '# Item with an unmodeled section',
  '',
  '## Current behavior',
  '',
  'Something today.',
  '',
  '## Rollout Strategy',
  '',
  'Release progressively to the first tenant group.',
  '',
  '## Learning',
  '',
  'The original assumption about X was incorrect.',
  '',
].join('\n')

describe('WI-025: canonical Markdown body', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir() })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('exposes the verbatim body (not reconstructed from parsed fields)', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/completed/WI-006.md': RICH_WI })
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-006')
    // Starts at the artifact's own H1 and keeps the exact heading + bullet text.
    expect(wi.markdownBody.startsWith('# Add profile birth date')).toBe(true)
    expect(wi.markdownBody).toContain('## Acceptance criteria')
    expect(wi.markdownBody).toContain('- [x] API accepts a nullable birth date.')
    // Not the frontmatter.
    expect(wi.markdownBody).not.toContain('id: WI-006')
  })

  it('keeps unmodeled and future sections visible (Rollout Strategy, Learning)', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/completed/WI-FUTURE.md': FUTURE_WI })
    const core = await import('../src/core.js')
    const wi = core.getWorkItem(dir, 'WI-FUTURE')
    // Core models none of these headings, yet the body preserves them for Full Definition.
    expect(wi.markdownBody).toContain('## Rollout Strategy')
    expect(wi.markdownBody).toContain('Release progressively to the first tenant group.')
    expect(wi.markdownBody).toContain('## Learning')
    expect(wi.markdownBody).toContain('The original assumption about X was incorrect.')
  })

  it('is carried through the Admin Server adapter', async () => {
    initProject(dir, { 'knowledge/delivery/work-items/completed/WI-006.md': RICH_WI })
    const { getWorkItemDetail } = await import('../../admin-server/src/core-adapter.js')
    const wi = getWorkItemDetail(dir, 'WI-006')
    expect(typeof wi.markdownBody).toBe('string')
    expect(wi.markdownBody).toContain('## Acceptance criteria')
  })
})

// ─── Adapter + security ───────────────────────────────────────────────────────

describe('VS-098: Admin Server adapter', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); fullProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('getWorkItemsList returns the list model', async () => {
    const { getWorkItemsList } = await import('../../admin-server/src/core-adapter.js')
    const res = getWorkItemsList(dir, {})
    expect(res.summary.total).toBe(3)
    expect(res.items.length).toBe(3)
  })

  it('getWorkItemDetail returns a Work Item', async () => {
    const { getWorkItemDetail } = await import('../../admin-server/src/core-adapter.js')
    const wi = getWorkItemDetail(dir, 'WI-006')
    expect(wi.id).toBe('WI-006')
  })

  it('rejects path traversal and absolute paths', async () => {
    const { getWorkItemDetail } = await import('../../admin-server/src/core-adapter.js')
    expect(() => getWorkItemDetail(dir, '../../etc/passwd')).toThrow('Invalid Work Item')
    expect(() => getWorkItemDetail(dir, '/etc/passwd')).toThrow('Invalid Work Item')
    expect(() => getWorkItemDetail(dir, 'a\\b')).toThrow('Invalid Work Item')
  })

  it('unknown Work Item yields WORK_ITEM_NOT_FOUND', async () => {
    const { getWorkItemDetail, CoreError } = await import('../../admin-server/src/core-adapter.js')
    try {
      getWorkItemDetail(dir, 'WI-404')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(CoreError)
      expect((err as { code: string }).code).toBe('WORK_ITEM_NOT_FOUND')
    }
  })
})

// ─── Contracts ────────────────────────────────────────────────────────────────

describe('VS-098: Contracts', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); fullProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('list response matches WorkItemsListSchema', async () => {
    const { getWorkItemsList } = await import('../../admin-server/src/core-adapter.js')
    const { WorkItemsListSchema } = await import('../../admin-server/src/contracts/schemas.js')
    const res = getWorkItemsList(dir, {})
    expect(WorkItemsListSchema.safeParse(res).success).toBe(true)
  })

  it('detail response matches WorkItemDetailSchema', async () => {
    const { getWorkItemDetail } = await import('../../admin-server/src/core-adapter.js')
    const { WorkItemDetailSchema } = await import('../../admin-server/src/contracts/schemas.js')
    const wi = getWorkItemDetail(dir, 'WI-006')
    const parsed = WorkItemDetailSchema.safeParse(wi)
    expect(parsed.success).toBe(true)
  })
})

// ─── Source of truth ──────────────────────────────────────────────────────────

describe('VS-098: Source of truth', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); fullProject(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('Admin does not parse Work Item frontmatter independently of Core', () => {
    const serverSrc = fs.readFileSync(path.resolve(__dirname, '../../admin-server/src/core-adapter.ts'), 'utf-8')
    expect(serverSrc).toContain('coreGetWorkItem')
    expect(serverSrc).not.toContain('gray-matter')
    expect(serverSrc).not.toContain('implementation_evidence')
  })
})
