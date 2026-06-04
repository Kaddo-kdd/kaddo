import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  buildProjectExplanation,
  renderExplanationHuman,
  renderExplanationAgent,
} from '../src/core/project-explain.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function initConfig(extra = '') {
  write(
    '.kaddo/config.yml',
    `version: 1
project:
  name: dotear-web
  state: pre-ai
  structure: monorepo
team:
  size: indie
${extra}`
  )
}

function writeScan() {
  write(
    '.kaddo/scan.json',
    JSON.stringify({
      detected: {
        languages: ['TypeScript'],
        frameworks: ['Next.js'],
        packageManagers: ['npm'],
        sourceDirectories: ['src'],
        migrationDirectories: ['supabase/migrations'],
        contractFiles: [],
        infrastructureFiles: ['amplify.yml'],
        testDirectories: [],
      },
    })
  )
}

function writeWorkItem(id: string, status: string, code: string[] = []) {
  const codeBlock = code.length > 0 ? `code:\n${code.map((c) => `  - ${c}`).join('\n')}\n` : ''
  write(
    `knowledge/delivery/work-items/${id}.md`,
    `---
id: ${id}
type: feature
title: ${id} title
status: ${status}
knowledge_level: K2
domains:
  - payments
${codeBlock}---

Body.
`
  )
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-pexplain-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('buildProjectExplanation', () => {
  it('reads project metadata from config', () => {
    initConfig()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.project.name).toBe('dotear-web')
    expect(exp.project.state).toBe('pre-ai')
    expect(exp.project.teamSize).toBe('indie')
    expect(exp.project.structure).toBe('monorepo')
  })

  it('reports no scan baseline when scan.json missing', () => {
    initConfig()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.stack).toBeNull()
    expect(exp.knowledge.hasScan).toBe(false)
    expect(exp.suggestedNextSteps).toContain('Run `kaddo scan` to detect the technical stack.')
  })

  it('includes detected stack when scan.json present', () => {
    initConfig()
    writeScan()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.knowledge.hasScan).toBe(true)
    expect(exp.stack?.language).toBe('TypeScript')
    expect(exp.stack?.framework).toBe('Next.js')
    expect(exp.stack?.sourceDirectories).toContain('src')
    expect(exp.stack?.infrastructureFiles).toContain('amplify.yml')
  })

  it('reports knowledge status for roadmap presence', () => {
    initConfig()
    write('knowledge/delivery/roadmap.md', '# Roadmap\n')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.knowledge.hasRoadmap).toBe(true)
    expect(exp.suggestedNextSteps).not.toContain(
      'Use roadmap-agent to generate knowledge/delivery/roadmap.md.'
    )
  })

  it('counts work items by status', () => {
    initConfig()
    writeWorkItem('WI-001', 'in-progress')
    writeWorkItem('WI-002', 'done')
    writeWorkItem('WI-003', 'in-progress')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.total).toBe(3)
    expect(exp.workItems.inProgress).toBe(2)
    expect(exp.workItems.done).toBe(1)
  })

  it('reports ownership coverage', () => {
    initConfig()
    writeWorkItem('WI-001', 'in-progress', ['src/payments/**'])
    writeWorkItem('WI-002', 'in-progress')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.ownership.workItemsTotal).toBe(2)
    expect(exp.ownership.workItemsWithOwnership).toBe(1)
    expect(exp.ownership.workItemsMissingOwnership).toBe(1)
    expect(exp.suggestedNextSteps).toContain(
      'Run `kaddo owners suggest` for Work Items without code ownership.'
    )
  })

  it('lists missing knowledge and next steps for a fresh init', () => {
    initConfig()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.missingKnowledge.length).toBeGreaterThan(0)
    expect(exp.missingKnowledge.some((m) => m.includes('Work items'))).toBe(true)
    expect(exp.suggestedNextSteps).toContain('Create your first Work Item with `kaddo create`.')
  })

  it('recommends context after scan but before context pack', () => {
    initConfig()
    writeScan()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.suggestedNextSteps).toContain('Run `kaddo context` to prepare an LLM context pack.')
  })
})

describe('renderExplanationHuman', () => {
  it('produces a readable markdown explanation', () => {
    initConfig()
    writeScan()
    writeWorkItem('WI-001', 'in-progress', ['src/payments/**'])
    const out = renderExplanationHuman(buildProjectExplanation(tmpDir))
    expect(out).toContain('# Project Explanation')
    expect(out).toContain('## Project')
    expect(out).toContain('## Knowledge Layers')
    expect(out).toContain('### Business')
    expect(out).toContain('### Delivery')
    expect(out).toContain('## Detected Stack')
    expect(out).toContain('## Knowledge Status')
    expect(out).toContain('Ownership coverage: 1/1')
    expect(out).toContain('## Suggested Next Steps')
  })

  it('groups knowledge by layer and reflects present artifacts', () => {
    initConfig()
    write('knowledge/product/capabilities.md', '# Capabilities\n')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.layers.map((l) => l.layer)).toEqual(['Business', 'Product', 'Tech', 'Delivery'])
    const out = renderExplanationHuman(exp)
    expect(out).toContain('✓ capabilities')
    expect(out).toContain('✗ roadmap')
  })
})

describe('renderExplanationAgent', () => {
  it('produces valid JSON with the explanation shape', () => {
    initConfig()
    writeScan()
    const parsed = JSON.parse(renderExplanationAgent(buildProjectExplanation(tmpDir)))
    expect(parsed.project.name).toBe('dotear-web')
    expect(parsed.knowledge).toHaveProperty('hasScan')
    expect(parsed.workItems).toHaveProperty('total')
    expect(parsed.ownership).toHaveProperty('workItemsTotal')
    expect(Array.isArray(parsed.suggestedNextSteps)).toBe(true)
  })

  it('does not load source code (only metadata)', () => {
    initConfig()
    writeScan()
    writeWorkItem('WI-001', 'in-progress')
    // Create a source file that should never be read into the explanation.
    write('src/payments/charge.ts', 'export const SECRET = "do-not-read";')
    const out = renderExplanationAgent(buildProjectExplanation(tmpDir))
    expect(out).not.toContain('do-not-read')
  })
})

describe('project explain — mapped modules (module-aware)', () => {
  function writeModules() {
    write(
      '.kaddo/modules.yml',
      [
        'version: 1',
        'modules:',
        '  - id: storefront-web',
        '    name: Storefront Web',
        '    repoPath: ../frontend',
        '    type: frontend',
        '    owner: web-team',
        '    capabilities:',
        '      - checkout',
        '    code:',
        '      - ../frontend/**',
      ].join('\n')
    )
  }

  it('reports zero mapped modules when none are registered', () => {
    initConfig()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.mappedModules).toEqual([])
    expect(renderExplanationHuman(exp)).toContain('Mapped modules: 0')
  })

  it('includes mapped modules and artifact coverage in human output', () => {
    initConfig()
    writeModules()
    write('knowledge/tech/modules/storefront-web/module-design.md', '---\ntype: module-design\n---\n')
    write('knowledge/tech/modules/storefront-web/stack.md', '---\ntype: module-stack\n---\n')
    const md = renderExplanationHuman(buildProjectExplanation(tmpDir))
    expect(md).toContain('## Mapped Modules')
    expect(md).toContain('storefront-web — frontend — ../frontend — owner: web-team')
    expect(md).toContain('## Module Artifact Coverage')
    expect(md).toContain('storefront-web: module-design, stack')
  })

  it('exposes mapped_modules in agent JSON, separate from add-ons', () => {
    initConfig()
    writeModules()
    const json = JSON.parse(renderExplanationAgent(buildProjectExplanation(tmpDir)))
    expect(Array.isArray(json.mapped_modules)).toBe(true)
    expect(json.mapped_modules[0].id).toBe('storefront-web')
    expect(json.mapped_modules[0].artifacts).toHaveProperty('security')
    expect(json).not.toHaveProperty('mappedModules')
  })
})
