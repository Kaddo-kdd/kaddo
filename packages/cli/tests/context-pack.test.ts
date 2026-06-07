import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import {
  buildContextPack,
  serializeContextPackJson,
  recommendedAgentsForState,
  CONTEXT_PACK_VERSION,
} from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function writeConfig(state = 'pre-ai', extra = '') {
  write(
    '.kaddo/config.yml',
    [
      'version: 1',
      'project:',
      '  name: "demo"',
      `  state: ${state}`,
      '  structure: monorepo',
      'team:',
      '  size: indie',
      extra,
    ].join('\n')
  )
}

function writeScan() {
  write(
    '.kaddo/scan.json',
    JSON.stringify({
      version: '1',
      detected: {
        languages: ['typescript'],
        frameworks: ['next'],
        packageManagers: ['npm'],
        sourceDirectories: ['src'],
        migrationDirectories: ['supabase/migrations'],
        contractFiles: [],
        infrastructureFiles: ['amplify.yml'],
      },
    })
  )
}

function build(now = new Date('2026-01-01T00:00:00.000Z')) {
  const config = loadConfig(tmpDir)!
  return buildContextPack(tmpDir, config, now)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-context-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('context-pack — roadmap candidates (VS-039)', () => {
  it('exposes candidates and materialized counts and renders them', () => {
    writeConfig('pre-ai')
    write(
      'knowledge/delivery/roadmap.md',
      ['# Roadmap', '', '- WI-001 Cart', '- WI-002 Payment', '- WI-003 Receipt', ''].join('\n')
    )
    write(
      'knowledge/delivery/work-items/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Cart\nstatus: done\n---\n\nBody\n'
    )
    const pack = build()
    expect(pack.roadmap.present).toBe(true)
    expect(pack.roadmap.candidates).toBe(3)
    expect(pack.roadmap.materialized).toBe(1)
    expect(pack.roadmap.remaining).toBe(2)
    const md = renderContextPack(pack)
    expect(md).toContain('Roadmap candidates: 3')
    expect(md).toContain('Materialized work items: 1')
    expect(md).toContain('Remaining candidates: 2')
  })

  it('reports roadmap not present when no roadmap file exists', () => {
    writeConfig('pre-ai')
    expect(build().roadmap.present).toBe(false)
  })
})

describe('context-pack — active workspace (VS-041)', () => {
  it('ships only active Work Items, excluding completed and archived', () => {
    writeConfig('pre-ai')
    write(
      'knowledge/delivery/work-items/in-progress/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Active one\nstatus: in-progress\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/ready/WI-002.md',
      '---\nid: WI-002\ntype: feature\ntitle: Ready one\nstatus: ready\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/completed/WI-003.md',
      '---\nid: WI-003\ntype: feature\ntitle: Done one\nstatus: completed\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/archived/WI-004.md',
      '---\nid: WI-004\ntype: feature\ntitle: Old one\nstatus: archived\n---\n\nx\n'
    )
    const ids = build().knowledge.workItems.map((w) => w.id).sort()
    expect(ids).toEqual(['WI-001', 'WI-002'])
  })
})

describe('context-pack — delivery mix by type (VS-045)', () => {
  it('AC6: includes active Work Items distribution by type and renders it', () => {
    writeConfig('pre-ai')
    write(
      'knowledge/delivery/work-items/in-progress/WI-001.md',
      '---\nid: WI-001\ntype: feature\ntitle: Create task\nstatus: in-progress\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/ready/WI-002.md',
      '---\nid: WI-002\ntype: chore\ntitle: Configure CI\nstatus: ready\n---\n\nx\n'
    )
    write(
      'knowledge/delivery/work-items/completed/WI-003.md',
      '---\nid: WI-003\ntype: chore\ntitle: Old chore\nstatus: completed\n---\n\nx\n'
    )
    const pack = build()
    // completed item excluded from the active mix
    expect(pack.deliveryMix).toMatchObject({ feature: 1, chore: 1 })
    const md = renderContextPack(pack)
    expect(md).toContain('## Delivery Mix')
    expect(md).toContain('Features: 1')
    expect(md).toContain('Chores: 1')
  })
})

describe('context-pack — buildContextPack', () => {
  it('assembles a full pack from config + scan + artifacts', () => {
    writeConfig('pre-ai')
    writeScan()
    write('knowledge/inventory.md', '# Project Inventory\n\nstuff')
    write('knowledge/knowledge.md', '# Knowledge\n\nThe product does X for users.')
    write('knowledge/delivery/roadmap.md', '# Roadmap\n\nNext we ship Y.')
    write(
      'knowledge/delivery/work-items/WI-001-add-auth.md',
      ['---', 'type: feature', 'id: WI-001', 'title: "Add auth"', 'knowledge_level: K2', 'status: in-progress', 'domains: [auth]', 'code:', '  - src/auth/**', 'summary: "Adds auth"', '---', '', '# Add auth'].join('\n')
    )

    const pack = build()
    expect(pack.version).toBe(CONTEXT_PACK_VERSION)
    expect(pack.generatedAt).toBe('2026-01-01T00:00:00.000Z')
    expect(pack.project).toEqual({ name: 'demo', state: 'pre-ai', teamSize: 'indie', structure: 'monorepo' })
    expect(pack.scan.available).toBe(true)
    expect(pack.scan.frameworks).toEqual(['next'])
    expect(pack.knowledge.summary).toContain('product does X')
    expect(pack.knowledge.roadmapSummary).toContain('ship Y')
    expect(pack.knowledge.inventoryAvailable).toBe(true)
    expect(pack.knowledge.workItems).toHaveLength(1)
    expect(pack.knowledge.workItems[0].id).toBe('WI-001')
    expect(pack.knowledge.workItems[0].lifecycle).toBe('in-progress')
    expect(pack.knowledge.artifacts[0].codeGlobs).toEqual(['src/auth/**'])
    expect(pack.missing).toHaveLength(0)
  })

  it('marks scan baseline missing when scan.json is absent', () => {
    writeConfig('pre-ai')
    const pack = build()
    expect(pack.scan.available).toBe(false)
    expect(pack.missing.some((m) => m.toLowerCase().includes('scan baseline'))).toBe(true)
  })

  it('marks inventory missing when inventory.md is absent', () => {
    writeConfig('pre-ai')
    writeScan()
    const pack = build()
    expect(pack.knowledge.inventoryAvailable).toBe(false)
    expect(pack.missing.some((m) => m.toLowerCase().includes('inventory'))).toBe(true)
  })

  it('reports no work items when none exist', () => {
    writeConfig('pre-ai')
    const pack = build()
    expect(pack.knowledge.workItems).toHaveLength(0)
    expect(pack.missing.some((m) => m.toLowerCase().includes('work items'))).toBe(true)
  })
})

describe('context-pack — state-aware recommendations', () => {
  it('recommends roadmap/architecture for new', () => {
    expect(recommendedAgentsForState('new')).toEqual(['roadmap-agent', 'architecture-agent'])
  })
  it('recommends capability-first for pre-ai', () => {
    expect(recommendedAgentsForState('pre-ai')[0]).toBe('capability-agent')
  })
  it('recommends legacy-agent first for legacy', () => {
    expect(recommendedAgentsForState('legacy')[0]).toBe('legacy-agent')
  })
  it('wires recommendations into the built pack per state', () => {
    writeConfig('legacy')
    const pack = build()
    expect(pack.handoff.recommendedAgents[0]).toBe('legacy-agent')
  })
})

describe('context-pack — serialization', () => {
  it('produces valid JSON ending in a newline', () => {
    writeConfig('pre-ai')
    const pack = build()
    const json = serializeContextPackJson(pack)
    expect(json.endsWith('\n')).toBe(true)
    expect(JSON.parse(json)).toEqual(pack)
  })
})

describe('context-pack — renderContextPack', () => {
  it('renders all sections in markdown', () => {
    writeConfig('pre-ai')
    writeScan()
    const md = renderContextPack(build())
    expect(md).toContain('# Kaddo Context Pack')
    expect(md).toContain('## Project Metadata')
    expect(md).toContain('## Knowledge Layers')
    expect(md).toContain('### Business')
    expect(md).toContain('## Technical Inventory')
    expect(md).toContain('## Current Knowledge')
    expect(md).toContain('## Roadmap')
    expect(md).toContain('## Active Work Items')
    expect(md).toContain('## Missing Context')
    expect(md).toContain('## Recommended Agent Handoff')
    expect(md).toContain('## Instructions for the LLM')
    expect(md).toContain('Name: demo')
    expect(md).toContain('1. capability-agent')
  })

  it('includes Operating Rules that forbid committing without confirmation', () => {
    writeConfig('new')
    const md = renderContextPack(build())
    expect(md).toContain('## Operating Rules (read first)')
    expect(md.toLowerCase()).toContain('without explicit human confirmation')
    expect(md.toLowerCase()).toContain('never push or merge')
    expect(md.toLowerCase()).toContain('create a branch first')
  })

  it('states missing context when scan is absent', () => {
    writeConfig('new')
    const md = renderContextPack(build())
    expect(md).toContain('Scan baseline missing')
    expect(md).toContain('No active work items found.')
  })
})

describe('context pack — mapped modules (module-aware)', () => {
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
        '  - id: orders-api',
        '    repoPath: ../backend',
        '    type: backend',
        '    code:',
        '      - ../backend/**',
      ].join('\n')
    )
  }

  it('omits the section when there are no mapped modules', () => {
    writeConfig()
    const pack = build()
    expect(pack.mappedModules).toEqual([])
    expect(renderContextPack(pack)).not.toContain('## Mapped Modules')
  })

  it('includes mapped modules in the pack object and markdown', () => {
    writeConfig()
    writeModules()
    // one module has its design artifact present
    write('knowledge/tech/modules/storefront-web/module-design.md', '---\ntype: module-design\n---\n')
    const pack = build()
    expect(pack.mappedModules.map((m) => m.id)).toEqual(['storefront-web', 'orders-api'])
    const md = renderContextPack(pack)
    expect(md).toContain('## Mapped Modules')
    expect(md).toContain('storefront-web')
    expect(md).toContain('../frontend')
    expect(md).toContain('does not scan secondary repositories')
    expect(pack.mappedModules[0].artifacts.moduleDesign).toBe(true)
    expect(pack.mappedModules[1].artifacts.moduleDesign).toBe(false)
  })

  it('serializes mappedModules into context-pack.json', () => {
    writeConfig()
    writeModules()
    const json = JSON.parse(serializeContextPackJson(build()))
    expect(Array.isArray(json.mappedModules)).toBe(true)
    expect(json.mappedModules[0].repoPath).toBe('../frontend')
    expect(json.mappedModules[0].artifacts).toHaveProperty('stack')
  })
})
