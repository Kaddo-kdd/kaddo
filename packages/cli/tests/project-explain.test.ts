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

describe('buildProjectExplanation — Work Item parser (VS-031)', () => {
  it('does not count ADRs (tech/decisions) as Work Items', () => {
    initConfig()
    writeWorkItem('WI-001', 'in-progress', ['src/**'])
    write(
      'knowledge/tech/decisions/ADR-0001-initial.md',
      '---\ntype: adr\nid: ADR-0001\nstatus: accepted\n---\n\n# ADR-0001\n'
    )
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.total).toBe(1)
    expect(exp.workItems.items.map((i) => i.id)).toEqual(['WI-001'])
  })

  it('ignores untyped / non-work-item files', () => {
    initConfig()
    writeWorkItem('WI-001', 'in-progress')
    // an untyped markdown file inside work-items is not a Work Item
    write('knowledge/delivery/work-items/notes.md', '# just notes, no front matter\n')
    // a layer doc is not a Work Item
    write('knowledge/business/business.md', '---\ntype: business\n---\n# Business\n')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.total).toBe(1)
  })
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

  it('groups knowledge by layer maturity (frontmatter discovery)', () => {
    initConfig()
    // recognized by type, not filename
    write('knowledge/product/anything.md', '---\ntype: capabilities\n---\n# Capabilities\n')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.layers.map((l) => l.layer)).toEqual(['Business', 'Product', 'Tech', 'Delivery'])
    expect(exp.layers.find((l) => l.layer === 'Product')!.status).toBe('Structured')
    const out = renderExplanationHuman(exp)
    expect(out).toContain('### Product — Structured')
    expect(out).toContain('### Delivery — Missing')
  })
})

describe('buildProjectExplanation — roadmap candidates vs materialized (VS-039)', () => {
  const roadmap = `# Roadmap

## RM-001: Checkout

| ID | Work Item | Depends on |
|----|-----------|------------|
| WI-001 | Cart | |
| WI-002 | Payment | WI-001 |
| WI-003 | Receipt | WI-002 |
`

  it('counts candidates and computes remaining when nothing is materialized', () => {
    initConfig()
    write('knowledge/delivery/roadmap.md', roadmap)
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.roadmap.present).toBe(true)
    expect(exp.roadmap.candidates).toBe(3)
    expect(exp.roadmap.materialized).toBe(0)
    expect(exp.roadmap.remaining).toBe(3)
    expect(exp.suggestedNextSteps).toContain(
      'Materialize 3 roadmap candidate(s) with `kaddo create --from roadmap`.'
    )
  })

  it('subtracts materialized work items from remaining candidates', () => {
    initConfig()
    write('knowledge/delivery/roadmap.md', roadmap)
    writeWorkItem('WI-001', 'done', ['src/**'])
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.roadmap.candidates).toBe(3)
    expect(exp.roadmap.materialized).toBe(1)
    expect(exp.roadmap.remaining).toBe(2)
  })

  it('reports not present when there is no roadmap', () => {
    initConfig()
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.roadmap.present).toBe(false)
    expect(exp.roadmap.candidates).toBe(0)
  })

  it('renders roadmap candidate stats in human output', () => {
    initConfig()
    write('knowledge/delivery/roadmap.md', roadmap)
    const out = renderExplanationHuman(buildProjectExplanation(tmpDir))
    expect(out).toContain('Work Item candidates: 3')
    expect(out).toContain('Materialized Work Items: 0')
    expect(out).toContain('Remaining Work Item candidates: 3')
  })
})

describe('buildProjectExplanation — Work Item lifecycle (VS-041)', () => {
  function writeWI(folder: string, id: string, status: string, initiative?: string) {
    const init = initiative ? `initiative: ${initiative}\n` : ''
    write(
      `knowledge/delivery/work-items/${folder}/${id}.md`,
      `---\nid: ${id}\ntype: feature\ntitle: ${id} title\nstatus: ${status}\n${init}---\n\nBody.\n`
    )
  }

  it('counts work items by lifecycle state', () => {
    initConfig()
    writeWI('draft', 'WI-001', 'draft')
    writeWI('ready', 'WI-002', 'ready')
    writeWI('ready', 'WI-003', 'ready')
    writeWI('in-progress', 'WI-004', 'in-progress')
    writeWI('completed', 'WI-005', 'completed')
    writeWI('archived', 'WI-006', 'archived')
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.byState).toMatchObject({
      draft: 1,
      ready: 2,
      'in-progress': 1,
      blocked: 0,
      completed: 1,
      archived: 1,
    })
    expect(exp.workItems.total).toBe(6)
  })

  it('resolves legacy flat items (status done/cancelled) into the lifecycle', () => {
    initConfig()
    write(
      'knowledge/delivery/work-items/WI-010-legacy.md',
      '---\nid: WI-010\ntype: feature\ntitle: legacy\nstatus: done\n---\n\nx\n'
    )
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.byState.completed).toBe(1)
  })

  it('groups work items by initiative virtually (front matter, not folders)', () => {
    initConfig()
    writeWI('completed', 'WI-001', 'completed', 'Project Foundation')
    writeWI('completed', 'WI-002', 'completed', 'Project Foundation')
    writeWI('in-progress', 'WI-003', 'in-progress', 'Task Core')
    const exp = buildProjectExplanation(tmpDir)
    const found = exp.workItems.initiatives.find((g) => g.name === 'Project Foundation')
    expect(found?.states.completed).toBe(2)
    expect(exp.workItems.initiatives.find((g) => g.name === 'Task Core')?.states['in-progress']).toBe(1)
  })

  it('renders the lifecycle counts in human output', () => {
    initConfig()
    writeWI('ready', 'WI-001', 'ready')
    writeWI('in-progress', 'WI-002', 'in-progress')
    const out = renderExplanationHuman(buildProjectExplanation(tmpDir))
    expect(out).toContain('## Work Items')
    expect(out).toContain('Ready: 1')
    expect(out).toContain('In Progress: 1')
  })

  it('AC5: reports distribution by Work Item type, recognizing chore', () => {
    initConfig()
    write(
      'knowledge/delivery/work-items/draft/WI-001.md',
      '---\nid: WI-001\ntype: chore\ntitle: Configure CI\nstatus: draft\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/ready/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Create task\nstatus: ready\n---\n\nx\n'
    )
    const exp = buildProjectExplanation(tmpDir)
    expect(exp.workItems.byType).toMatchObject({ chore: 1, feature: 1 })
    const out = renderExplanationHuman(exp)
    expect(out).toContain('## Work Items by Type')
    expect(out).toContain('Chores: 1')
    expect(out).toContain('Features: 1')
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

describe('explain — Project Readiness (VS-072.1)', () => {
  it('AC5/AC12: human output has a Project Readiness section + single next step (initialized → scan)', () => {
    initConfig()
    const md = renderExplanationHuman(buildProjectExplanation(tmpDir))
    expect(md).toContain('## Project Readiness')
    expect(md).toContain('overall: initialized')
    expect(md).toContain('### Recommended next step')
    expect(md).toContain('kaddo scan')
  })

  it('AC6/AC7/AC8/AC9: agent JSON includes a readiness object with overall/signals/next-step', () => {
    initConfig()
    writeScan()
    const json = JSON.parse(renderExplanationAgent(buildProjectExplanation(tmpDir)))
    expect(json.readiness).toBeTypeOf('object')
    expect(json.readiness.overall).toBe('bootstrap-incomplete')
    expect(json.readiness.signals.scan).toBe('available')
    expect(json.readiness.recommended_next_step.command).toBe('kaddo bootstrap')
  })

  it('AC14: detects incomplete bootstrap baseline after scan', () => {
    initConfig()
    writeScan()
    const r = buildProjectExplanation(tmpDir).readiness
    expect(r.signals.bootstrap_baseline).toBe('incomplete')
    expect(r.overall).toBe('bootstrap-incomplete')
  })
})

describe('explain — placeholder-aware readiness (VS-073.1)', () => {
  it('AC16/AC24/AC26: after bootstrap (placeholders), readiness is knowledge-incomplete and recommends an agent', () => {
    initConfig() // dotear-web, state pre-ai
    writeScan()
    // Past scan / bootstrap / agents / skills / context / understand, so it reaches the knowledge gate.
    write('.kaddo/context-pack.md', '# context pack\n')
    write('.kaddo/understand.md', '# understand\n')
    write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n')
    write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
    // Simulate bootstrap output: baseline files that are still placeholders.
    write('knowledge/business/business.md', '---\ntype: business\nproject_state: pre-ai\n---\n\n## What this product appears to support\n\n_Describe the business purpose._\n')
    write('knowledge/product/product.md', '---\ntype: product\n---\n\n## Existing product behavior\n\n_Describe what the product currently does._\n')
    write('knowledge/product/capabilities.md', '---\ntype: capabilities\n---\n\n## Observed capabilities\n\n- [observed] _Capability observed._\n')
    write('knowledge/tech/codebase.md', '---\ntype: codebase\n---\n\n## Repository structure\n\n_Describe the folders._\n')
    write('knowledge/tech/current-state.md', '---\ntype: current-state\n---\n\n## What exists today\n\n_Describe the state._\n')
    const r = buildProjectExplanation(tmpDir).readiness
    // business/product exist (placeholder) so it's past bootstrap, but not useful yet.
    expect(r.signals.business).toBe('placeholder')
    expect(r.overall).toBe('knowledge-incomplete')
    expect(r.recommended_next_step.label).toMatch(/-agent to complete/)
    expect(r.recommended_next_step.command).toBeUndefined()
  })
})
