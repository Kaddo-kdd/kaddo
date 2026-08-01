import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let root: string
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-095-')) })
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
  write('knowledge/business/business.md', '---\ntype: business\n---\n# Business\nEnough content.\n')
  write('knowledge/product/product.md', '---\ntype: product\n---\n# Product\nEnough content.\n')
  write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n# Capabilities\nEnough content.\n')
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

// --- Parsing ---

describe('VS-095 — parsing', () => {
  it('parses scope_confidence', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `scope_confidence:
  level: medium
  reasons:
    - Backend confirmed.
    - Frontend inspected.`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.scopeConfidence).toEqual({ level: 'medium', reasons: ['Backend confirmed.', 'Frontend inspected.'] })
  })

  it('parses module_coverage', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  core:
    status: affected
    reason: Registration API.
  frontend:
    status: reviewed-not-affected
    reason: No changes needed.`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.moduleCoverage?.core?.status).toBe('affected')
    expect(wi?.moduleCoverage?.frontend?.status).toBe('reviewed-not-affected')
  })

  it('parses impact_analysis', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `impact_analysis:
  surfaces:
    backend:
      status: affected
      reason: Must accept non-beta users.
    database:
      status: reviewed-not-affected
      reason: Existing schema supports it.`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.impactAnalysis?.backend?.status).toBe('affected')
    expect(wi?.impactAnalysis?.database?.status).toBe('reviewed-not-affected')
  })

  it('legacy WI remains valid without scope fields', async () => {
    setupProject()
    writeWI('draft', 'WI-001')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.scopeConfidence).toBeUndefined()
    expect(wi?.moduleCoverage).toBeUndefined()
    expect(wi?.impactAnalysis).toBeUndefined()
  })

  it('invalid coverage status is ignored', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  core:
    status: invalid-status`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.moduleCoverage).toBeUndefined()
  })
})

// --- Module coverage consistency ---

describe('VS-095 — module coverage', () => {
  it('affected module aligns with affected_modules', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `affected_modules:
  - core
module_coverage:
  core:
    status: affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['core'], [])
    expect(result.findings.some((f) => f.severity === 'blocking')).toBe(false)
  })

  it('reviewed-not-affected module is not added to affected_modules', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `affected_modules:
  - core
module_coverage:
  core:
    status: affected
  frontend:
    status: reviewed-not-affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], [])
    expect(result.findings.some((f) => f.message.includes('frontend') && f.severity === 'blocking')).toBe(false)
  })

  it('unknown module remains visible', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  frontend:
    status: unknown`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['frontend'], [])
    expect(result.unknownModules).toContain('frontend')
  })

  it('unknown module ID is blocking', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  nonexistent:
    status: affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['core'], [])
    expect(result.findings.some((f) => f.severity === 'blocking' && f.message.includes('nonexistent'))).toBe(true)
  })

  it('core works as reserved module', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `affected_modules:
  - core
module_coverage:
  core:
    status: affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, [], [])
    expect(result.findings.some((f) => f.message.includes('core') && f.severity === 'blocking')).toBe(false)
  })
})

// --- Consistency ---

describe('VS-095 — consistency', () => {
  it('affected module missing from affected_modules produces finding', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `affected_modules:
  - core
module_coverage:
  core:
    status: affected
  frontend:
    status: affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], [])
    expect(result.findings.some((f) => f.severity === 'blocking' && f.message.includes('frontend') && f.message.includes('missing from affected_modules'))).toBe(true)
  })

  it('affected_modules with reviewed-not-affected status produces finding', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `affected_modules:
  - core
  - frontend
module_coverage:
  core:
    status: affected
  frontend:
    status: reviewed-not-affected`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], [])
    expect(result.findings.some((f) => f.severity === 'blocking' && f.message.includes('frontend') && f.message.includes('not "affected"'))).toBe(true)
  })

  it('ready WI with blocking unknown produces finding', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('ready', 'WI-001', `module_coverage:
  frontend:
    status: unknown`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['frontend'], [])
    expect(result.findings.some((f) => f.severity === 'warning' && f.message.includes('unknown'))).toBe(true)
  })

  it('draft WI may retain unknowns without warning', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  frontend:
    status: unknown`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, ['frontend'], [])
    expect(result.unknownModules).toContain('frontend')
    expect(result.findings.some((f) => f.message.includes('ready'))).toBe(false)
  })
})

// --- User-facing coverage ---

describe('VS-095 — user-facing coverage', () => {
  it('user-facing WI without frontend assessment produces warning', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-USER-1', `module_coverage:
  core:
    status: affected`)
    // Override the title to be user-facing
    const wiPath = path.join(root, 'knowledge/delivery/work-items/draft/WI-USER-1.md')
    const content = fs.readFileSync(wiPath, 'utf8').replace('WI-USER-1 feature', 'Enable user registration')
    fs.writeFileSync(wiPath, content)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-USER-1')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], ['frontend'])
    expect(result.findings.some((f) => f.severity === 'warning' && f.message.includes('user-facing'))).toBe(true)
  })

  it('assessed frontend reviewed-not-affected removes warning', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-USER-2', `module_coverage:
  core:
    status: affected
  frontend:
    status: reviewed-not-affected`)
    const wiPath = path.join(root, 'knowledge/delivery/work-items/draft/WI-USER-2.md')
    const content = fs.readFileSync(wiPath, 'utf8').replace('WI-USER-2 feature', 'Enable user registration')
    fs.writeFileSync(wiPath, content)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-USER-2')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], ['frontend'])
    expect(result.findings.some((f) => f.message.includes('user-facing'))).toBe(false)
  })

  it('affected frontend removes warning', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-USER-3', `affected_modules:
  - core
  - frontend
module_coverage:
  core:
    status: affected
  frontend:
    status: affected`)
    const wiPath = path.join(root, 'knowledge/delivery/work-items/draft/WI-USER-3.md')
    const content = fs.readFileSync(wiPath, 'utf8').replace('WI-USER-3 feature', 'Enable user registration')
    fs.writeFileSync(wiPath, content)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-USER-3')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], ['frontend'])
    expect(result.findings.some((f) => f.message.includes('user-facing'))).toBe(false)
  })

  it('backend-only technical WI does not require frontend', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-TECH-1', `module_coverage:
  core:
    status: affected`)
    const wiPath = path.join(root, 'knowledge/delivery/work-items/draft/WI-TECH-1.md')
    const content = fs.readFileSync(wiPath, 'utf8').replace('WI-TECH-1 feature', 'Optimize expired session index query')
    fs.writeFileSync(wiPath, content)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-TECH-1')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], ['frontend'])
    expect(result.findings.some((f) => f.message.includes('user-facing'))).toBe(false)
  })

  it('no keyword heuristic produces blocking error', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-USER-4', `module_coverage:
  core:
    status: affected`)
    const wiPath = path.join(root, 'knowledge/delivery/work-items/draft/WI-USER-4.md')
    const content = fs.readFileSync(wiPath, 'utf8').replace('WI-USER-4 feature', 'Enable user registration')
    fs.writeFileSync(wiPath, content)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-USER-4')!
    const result = analyzeScopeCoverage(wi, ['core', 'frontend'], ['frontend'])
    expect(result.findings.every((f) => f.severity !== 'blocking' || !f.message.includes('user-facing'))).toBe(true)
  })
})

// --- Confidence ---

describe('VS-095 — confidence', () => {
  it('high, medium and low are accepted', async () => {
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    for (const level of ['high', 'medium', 'low']) {
      setupProject()
      writeWI('draft', 'WI-001', `scope_confidence:
  level: ${level}
  reasons:
    - test`)
      const arts = readArtifacts(path.join(root, 'knowledge'))
      const wi = arts.find((a) => a.id === 'WI-001')
      expect(wi?.scopeConfidence?.level).toBe(level)
    }
  })

  it('invalid value is rejected', async () => {
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('draft', 'WI-001', `scope_confidence:
  level: extreme`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')
    expect(wi?.scopeConfidence).toBeNull()
  })

  it('ready + low confidence produces warning', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('ready', 'WI-001', `scope_confidence:
  level: low
  reasons:
    - Description ambiguous.`)
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, [], [])
    expect(result.findings.some((f) => f.severity === 'warning' && f.message.includes('low'))).toBe(true)
  })

  it('missing confidence remains compatible for legacy WI', async () => {
    const { analyzeScopeCoverage } = await import('../src/core/scope-coverage.js')
    const { readArtifacts } = await import('../src/services/artifact-reader.js')
    setupProject()
    writeWI('ready', 'WI-001')
    const arts = readArtifacts(path.join(root, 'knowledge'))
    const wi = arts.find((a) => a.id === 'WI-001')!
    const result = analyzeScopeCoverage(wi, [], [])
    expect(result.hasScopeCoverage).toBe(false)
    expect(result.findings).toHaveLength(0)
  })
})

// --- Context and explain ---

describe('VS-095 — context and explain', () => {
  it('context renders scope coverage', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `scope_confidence:
  level: medium
  reasons:
    - Core confirmed.
module_coverage:
  core:
    status: affected
  frontend:
    status: unknown`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.scopeConfidence?.level).toBe('medium')
    expect(wi?.scopeUnknowns).toContain('frontend')
  })

  it('explain lists affected and reviewed modules', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `module_coverage:
  core:
    status: affected
  admin:
    status: reviewed-not-affected`)
    const { buildProjectExplanation, renderExplanationHuman } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.scopeCoverage.length).toBe(1)
    expect(exp.scopeCoverage[0].moduleCoverage?.core?.status).toBe('affected')
    const md = renderExplanationHuman(exp)
    expect(md).toContain('Affected: core')
    expect(md).toContain('Reviewed, not affected: admin')
  })

  it('context JSON includes scope fields matching CLI model', async () => {
    setupProject()
    writeWI('draft', 'WI-001', `scope_confidence:
  level: high
  reasons:
    - All confirmed.
module_coverage:
  core:
    status: affected`)
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    const wi = pack!.knowledge.activeWorkItems.find((w) => w.id === 'WI-001')
    expect(wi?.scopeConfidence?.level).toBe('high')
    expect(wi?.moduleCoverage?.core?.status).toBe('affected')
  })
})

// --- Regression ---

describe('VS-095 — regression', () => {
  it('legacy Work Items remain readable', async () => {
    setupProject()
    writeWI('draft', 'WI-001')
    writeWI('completed', 'WI-002')
    const { loadAndBuildContextPack } = await import('../src/core/context-pack.js')
    const pack = loadAndBuildContextPack(root)
    expect(pack!.knowledge.allWorkItems.length).toBe(2)
  })

  it('completed WI without scope fields does not reopen', async () => {
    setupProject()
    writeWI('completed', 'WI-001')
    const { buildProjectExplanation } = await import('../src/core/project-explain.js')
    const exp = buildProjectExplanation(root)
    expect(exp.scopeCoverage.length).toBe(0)
  })
})

// --- Safety ---

describe('VS-095 — safety', () => {
  it('no LLM or git calls in modified files', () => {
    const files = [
      'src/core/scope-coverage.ts',
      'src/services/artifact-reader.ts',
      'src/core/context-pack.ts',
      'src/core/project-explain.ts',
    ]
    for (const f of files) {
      const content = fs.readFileSync(path.join(__dirname, '..', f), 'utf8')
      expect(content).not.toMatch(/openai|anthropic|execSync|child_process/)
    }
  })
})
