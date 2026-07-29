import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-094-1-')) })
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }) })

function write(rel: string, content: string) {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content)
}

const BASE_CONFIG = `version: 1
project:
  name: test-project
  state: pre-ai
  structure: monorepo
  language: en
team:
  size: small
`

function setupProject() {
  write('.kaddo/config.yml', BASE_CONFIG)
  write('knowledge/business/business.md', '---\ntype: business\n---\n# Business\nEnough content to pass quality checks for the business layer artifact.\n')
  write('knowledge/product/product.md', '---\ntype: product\n---\n# Product\nEnough content to pass quality checks for the product layer artifact.\n')
  write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Capabilities\nEnough content to pass quality checks.\n')
  write('knowledge/tech/current-state.md', '---\ntype: current-state\n---\n# State\nEnough content.\n')
  write('knowledge/tech/codebase.md', '---\ntype: codebase\n---\n# Codebase\nEnough content.\n')
}

function writeWI(folder: string, id: string, extra: string = '') {
  write(`knowledge/delivery/work-items/${folder}/${id}.md`, `---
type: feature
id: ${id}
title: ${id} feature
status: ${folder === 'completed' ? 'completed' : folder === 'archived' ? 'archived' : folder}
${extra}
---
# ${id}
`)
}

// --- Project Route ---

describe('VS-094.1 — project route', () => {
  it('AC1: completed WI satisfies refine-work-item', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('done')
  })

  it('AC1: archived WI satisfies refine-work-item', async () => {
    setupProject()
    writeWI('archived', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('done')
  })

  it('AC1: ready WI satisfies refine-work-item', async () => {
    setupProject()
    writeWI('ready', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('done')
  })

  it('AC1: in-progress WI satisfies refine-work-item', async () => {
    setupProject()
    writeWI('in-progress', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('done')
  })

  it('AC1: blocked WI satisfies refine-work-item', async () => {
    setupProject()
    writeWI('blocked', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('done')
  })

  it('draft unrefined WI keeps refine-work-item current', async () => {
    setupProject()
    writeWI('draft', 'WI-001')
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('current')
  })

  it('no WI keeps refine-work-item pending', async () => {
    setupProject()
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const route = buildProjectRoute(root)
    const step = route.steps.find((s) => s.id === 'refine-work-item')
    expect(step?.status).toBe('pending')
  })

  it('AC3: completed WI increases route progress', async () => {
    setupProject()
    const { buildProjectRoute } = await import('../src/core/project-route.js')
    const routeWithout = buildProjectRoute(root)
    const refineWithout = routeWithout.steps.find((s) => s.id === 'refine-work-item')
    expect(refineWithout?.status).toBe('pending')

    writeWI('completed', 'WI-001')
    const routeWith = buildProjectRoute(root)
    const refineWith = routeWith.steps.find((s) => s.id === 'refine-work-item')
    expect(refineWith?.status).toBe('done')
    expect(routeWith.completed).toBeGreaterThan(routeWithout.completed)
  })
})

// --- Missing Context ---

describe('VS-094.1 — missing context', () => {
  it('AC4: no Work Items at all produces missing context', async () => {
    setupProject()
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.missing.some((m) => m.includes('work items'))).toBe(true)
  })

  it('AC6: completed-only does not produce missing context', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.missing.some((m) => m.toLowerCase().includes('work items'))).toBe(false)
  })

  it('AC6: archived-only does not produce missing context', async () => {
    setupProject()
    writeWI('archived', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.missing.some((m) => m.toLowerCase().includes('work items'))).toBe(false)
  })
})

// --- Work Item Summaries ---

describe('VS-094.1 — work item summary', () => {
  it('AC12: summary contains counts by lifecycle', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    writeWI('draft', 'WI-002')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.workItemSummary.total).toBe(2)
    expect(pack.workItemSummary.completed).toBe(1)
    expect(pack.workItemSummary.draft).toBe(1)
    expect(pack.workItemSummary.active).toBe(1)
  })

  it('AC13: completed-only summary is emitted', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.workItemSummary.summary).toBe('completed-only')
  })

  it('historical-only summary for completed + archived', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    writeWI('archived', 'WI-002')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.workItemSummary.summary).toBe('historical-only')
  })

  it('AC14: none summary when no WIs', async () => {
    setupProject()
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack.workItemSummary.summary).toBe('none')
  })
})

// --- Context JSON ---

describe('VS-094.1 — context JSON', () => {
  it('AC15-17: activeWorkItems, completedWorkItems, allWorkItems', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    writeWI('draft', 'WI-002')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)

    expect(pack.knowledge.activeWorkItems.length).toBe(1)
    expect(pack.knowledge.activeWorkItems[0].id).toBe('WI-002')

    expect(pack.knowledge.completedWorkItems.length).toBe(1)
    expect(pack.knowledge.completedWorkItems[0].id).toBe('WI-001')

    expect(pack.knowledge.allWorkItems.length).toBe(2)
  })

  it('AC18: legacy workItems aliases activeWorkItems', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    writeWI('draft', 'WI-002')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)

    expect(pack.knowledge.workItems).toEqual(pack.knowledge.activeWorkItems)
  })
})

// --- Defaults ---

describe('VS-094.1 — legacy defaults', () => {
  it('AC22: completed legacy WI uses not-assessed', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack.knowledge.completedWorkItems[0]
    expect(wi.implementationStatus).toBe('not-assessed')
    expect(wi.validationStatus).toBe('not-assessed')
    expect(wi.releaseStatus).toBe('not-assessed')
  })

  it('AC22: active WI without evidence uses undefined (not not-assessed)', async () => {
    setupProject()
    writeWI('draft', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack.knowledge.activeWorkItems[0]
    expect(wi.implementationStatus).toBeUndefined()
  })
})

// --- Readiness ---

describe('VS-094.1 — readiness', () => {
  it('AC14: completed-only signal is emitted', async () => {
    const { workItemsSignal } = await import('../src/core/next-step.js')
    setupProject()
    writeWI('completed', 'WI-001')
    const signal = workItemsSignal(root)
    expect(signal).toBe('completed-only')
  })
})

// --- Cross-repo evidence: accepted-with-exceptions ---

describe('VS-094.1 — exceptions validation', () => {
  it('AC24: accepted-with-exceptions with completion exception is valid', async () => {
    const { analyzeCrossRepoEvidence } = await import('../src/core/cross-repo-evidence.js')
    const result = analyzeCrossRepoEvidence({
      id: 'WI-001', lifecycle: 'completed',
      implementationStatus: 'completed',
      validationStatus: 'accepted-with-exceptions',
      releaseStatus: 'blocked',
      affectedModules: ['core'],
      rawFrontmatter: {
        completion_exceptions: [{ id: 'tests', status: 'accepted', approved_by: 'human' }],
      },
      registeredModuleIds: [],
      modifiedRepoIds: [],
    })
    expect(result.findings.some((f) => f.message.includes('no exception evidence'))).toBe(false)
  })

  it('AC26: accepted-with-exceptions with validation gate is valid', async () => {
    const { analyzeCrossRepoEvidence } = await import('../src/core/cross-repo-evidence.js')
    const result = analyzeCrossRepoEvidence({
      id: 'WI-001', lifecycle: 'completed',
      implementationStatus: 'completed',
      validationStatus: 'accepted-with-exceptions',
      releaseStatus: 'blocked',
      affectedModules: ['core'],
      rawFrontmatter: {
        release_gates: [{ id: 'automated-validation', status: 'pending', required_for: 'production' }],
      },
      registeredModuleIds: [],
      modifiedRepoIds: [],
    })
    expect(result.findings.some((f) => f.message.includes('no exception evidence'))).toBe(false)
  })

  it('AC25: accepted-with-exceptions without evidence produces warning', async () => {
    const { analyzeCrossRepoEvidence } = await import('../src/core/cross-repo-evidence.js')
    const result = analyzeCrossRepoEvidence({
      id: 'WI-001', lifecycle: 'completed',
      implementationStatus: 'completed',
      validationStatus: 'accepted-with-exceptions',
      releaseStatus: 'blocked',
      affectedModules: ['core'],
      rawFrontmatter: {},
      registeredModuleIds: [],
      modifiedRepoIds: [],
    })
    expect(result.findings.some((f) => f.severity === 'warning' && f.message.includes('no exception evidence'))).toBe(true)
  })

  it('AC22: completed legacy WI defaults to not-assessed in evidence', async () => {
    const { analyzeCrossRepoEvidence } = await import('../src/core/cross-repo-evidence.js')
    const result = analyzeCrossRepoEvidence({
      id: 'WI-001', lifecycle: 'completed',
      implementationStatus: '',
      validationStatus: '',
      releaseStatus: '',
      affectedModules: ['core'],
      rawFrontmatter: {},
      registeredModuleIds: [],
      modifiedRepoIds: [],
    })
    expect(result.implementationStatus).toBe('not-assessed')
    expect(result.validationStatus).toBe('not-assessed')
    expect(result.releaseStatus).toBe('not-assessed')
  })
})

// --- Explain ---

describe('VS-094.1 — explain', () => {
  it('AC19: delivery summary is present when completed WIs exist', async () => {
    setupProject()
    writeWI('completed', 'WI-001', 'implementation_status: completed\nrelease_status: blocked')
    const { buildProjectExplanation, renderExplanationHuman } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.deliverySummary).not.toBeNull()
    expect(exp.deliverySummary!.completedWorkItems).toBe(1)
    expect(exp.deliverySummary!.releaseBlocked).toBe(1)

    const md = renderExplanationHuman(exp)
    expect(md).toContain('## Delivery Summary')
    expect(md).toContain('Completed Work Items: 1')
    expect(md).toContain('Release blocked: 1')
  })

  it('AC20: delivery summary is null when no completed/archived WIs', async () => {
    setupProject()
    writeWI('draft', 'WI-001')
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.deliverySummary).toBeNull()
  })
})

// --- Safety ---

describe('VS-094.1 — safety', () => {
  it('AC36-37: no LLM or git calls in modified files', () => {
    const files = [
      'packages/cli/src/core/project-route.ts',
      'packages/cli/src/core/readiness.ts',
      'packages/cli/src/core/context-pack.ts',
      'packages/cli/src/core/next-step.ts',
      'packages/cli/src/core/cross-repo-evidence.ts',
    ]
    for (const f of files) {
      const content = fs.readFileSync(path.join(__dirname, '..', '..', '..', f), 'utf8')
      expect(content).not.toMatch(/openai|anthropic|execSync|child_process/)
    }
  })
})
