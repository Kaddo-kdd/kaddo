import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { analyzeMetadataHealth } from '../src/core/metadata-health.js'
import { renderFrontmatterRules } from '../src/agents/responsibility.js'
import { withResponsibilityTrace } from '../src/agents/responsibility.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { loadConfig } from '../src/core/config.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function writeConfig(state = 'pre-ai') {
  write('.kaddo/config.yml', [
    'version: 1',
    'project:',
    '  name: "demo"',
    `  state: ${state}`,
    '  structure: monorepo',
    'team:',
    '  size: indie',
  ].join('\n'))
}

const FULL_FRONTMATTER = [
  '---',
  'type: business',
  'project_state: pre-ai',
  'generated_by: kaddo-bootstrap',
  'template_version: 1',
  '---',
  '',
].join('\n')

const USEFUL_BODY = [
  '## Overview',
  '',
  'This project provides a comprehensive toolkit for managing knowledge-driven development workflows. ' +
  'It includes scanning, context generation, agent handoff, and deterministic delivery tracking. ' +
  'The CLI never calls an LLM and never mutates git state. All agents are prompt packs that guide ' +
  'external LLMs through structured knowledge generation tasks without executing any code themselves. ' +
  'The system enforces strict responsibility boundaries so that no agent can overstep its role.',
  '',
  '## Details',
  '',
  'The architecture follows a monorepo structure with packages for the CLI and MCP server. ' +
  'Each command is deterministic and produces reproducible output from the same input state. ' +
  'The knowledge directory contains all project understanding artifacts organized by domain ' +
  'into business, product, tech, and delivery layers. Each layer has a distinct lifecycle and ' +
  'quality classification that ranges from missing through placeholder and weak to useful.',
  '',
].join('\n')

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mh-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('metadata-health — analyzeMetadataHealth', () => {
  it('AC1: returns no findings when no knowledge files exist', () => {
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(0)
    expect(mh.healthy).toBe(0)
    expect(mh.drifted).toBe(0)
  })

  it('AC2: returns healthy when frontmatter has all required fields', () => {
    write('knowledge/business/business.md', FULL_FRONTMATTER + USEFUL_BODY)
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(0)
    expect(mh.healthy).toBe(1)
    expect(mh.drifted).toBe(0)
  })

  it('AC3: detects missing generated_by', () => {
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'project_state: pre-ai',
      'template_version: 1',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(1)
    expect(mh.findings[0].field).toBe('generated_by')
    expect(mh.findings[0].issue).toBe('missing')
    expect(mh.drifted).toBe(1)
  })

  it('AC4: detects missing template_version', () => {
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'project_state: pre-ai',
      'generated_by: kaddo-bootstrap',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(1)
    expect(mh.findings[0].field).toBe('template_version')
  })

  it('AC5: detects missing type field', () => {
    write('knowledge/business/business.md', [
      '---',
      'project_state: pre-ai',
      'generated_by: kaddo-bootstrap',
      'template_version: 1',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(1)
    expect(mh.findings[0].field).toBe('type')
  })

  it('AC6: detects project_state inconsistency when refined_by is set', () => {
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'project_state: pre-ai',
      'generated_by: kaddo-bootstrap',
      'template_version: 1',
      'refined_by: business-agent',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(1)
    expect(mh.findings[0].field).toBe('project_state')
    expect(mh.findings[0].issue).toBe('inconsistent')
    expect(mh.findings[0].detail).toContain('ai-assisted')
  })

  it('AC7: no inconsistency when refined_by is set and project_state is ai-assisted', () => {
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'project_state: ai-assisted',
      'generated_by: kaddo-bootstrap',
      'template_version: 1',
      'refined_by: business-agent',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(0)
    expect(mh.healthy).toBe(1)
  })

  it('AC8: checks multiple knowledge files independently', () => {
    // business has missing type, product is healthy
    write('knowledge/business/business.md', [
      '---',
      'generated_by: kaddo-bootstrap',
      'template_version: 1',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    write('knowledge/product/product.md', FULL_FRONTMATTER.replace('business', 'product') + USEFUL_BODY)
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(1)
    expect(mh.findings[0].file).toBe('knowledge/business/business.md')
    expect(mh.healthy).toBe(1)
    expect(mh.drifted).toBe(1)
  })

  it('AC9: skips files with no frontmatter at all', () => {
    write('knowledge/business/business.md', '# Business\n\nSome content.\n')
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings).toHaveLength(0)
    expect(mh.healthy).toBe(0)
    expect(mh.drifted).toBe(0)
  })

  it('AC10: reports multiple missing fields in same file', () => {
    write('knowledge/business/business.md', [
      '---',
      'project_state: pre-ai',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const mh = analyzeMetadataHealth(tmpDir)
    expect(mh.findings.length).toBeGreaterThanOrEqual(3)
    const fields = mh.findings.map(f => f.field)
    expect(fields).toContain('type')
    expect(fields).toContain('generated_by')
    expect(fields).toContain('template_version')
  })
})

describe('metadata-health — renderFrontmatterRules', () => {
  it('AC11: returns frontmatter rules for knowledge-refining agents', () => {
    const rules = renderFrontmatterRules('business-agent')
    expect(rules).toContain('## Frontmatter Rules')
    expect(rules).toContain('generated_by')
    expect(rules).toContain('template_version')
    expect(rules).toContain('project_state: ai-assisted')
    expect(rules).toContain('refined_by: business-agent')
  })

  it('AC12: returns empty string for non-refining agents', () => {
    expect(renderFrontmatterRules('product-agent')).toBe('')
    expect(renderFrontmatterRules('guard-agent')).toBe('')
  })

  it('AC13: all listed knowledge-refining agents get rules', () => {
    const agents = [
      'business-agent', 'capability-agent', 'bootstrap-agent',
      'codebase-agent', 'architecture-agent', 'roadmap-agent',
      'legacy-agent', 'work-item-agent', 'backlog-agent',
      'adr-agent', 'implementation-agent',
    ]
    for (const agent of agents) {
      expect(renderFrontmatterRules(agent)).toContain('## Frontmatter Rules')
    }
  })

  it('AC14: withResponsibilityTrace includes frontmatter rules for business-agent', () => {
    const result = withResponsibilityTrace('business-agent.md', '# Business Agent\n\nContent.')
    expect(result).toContain('## Frontmatter Rules')
    expect(result).toContain('refined_by: business-agent')
  })

  it('AC15: withResponsibilityTrace does not include frontmatter rules for product-agent', () => {
    const result = withResponsibilityTrace('product-agent.md', '# Product Agent\n\nContent.')
    expect(result).not.toContain('## Frontmatter Rules')
  })
})

describe('metadata-health — context-pack integration', () => {
  it('AC16: context-pack JSON includes metadataHealth', () => {
    writeConfig()
    write('.kaddo/scan.json', '{"version":1,"detected":{}}')
    write('knowledge/business/business.md', FULL_FRONTMATTER + USEFUL_BODY)
    write('knowledge/product/product.md', FULL_FRONTMATTER.replace('business', 'product') + USEFUL_BODY)
    const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
    expect(pack.metadataHealth).toBeDefined()
    expect(pack.metadataHealth.findings).toHaveLength(0)
    expect(pack.metadataHealth.healthy).toBe(2)
  })

  it('AC17: context-pack JSON reports drifted metadata', () => {
    writeConfig()
    write('.kaddo/scan.json', '{"version":1,"detected":{}}')
    // Missing generated_by
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'template_version: 1',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
    expect(pack.metadataHealth.drifted).toBe(1)
    expect(pack.metadataHealth.findings.length).toBeGreaterThan(0)
  })
})

describe('metadata-health — content quality independence', () => {
  it('AC18: content quality is independent of metadata health', () => {
    writeConfig()
    write('.kaddo/scan.json', '{"version":1,"detected":{}}')
    // Useful content but drifted metadata (missing generated_by)
    write('knowledge/business/business.md', [
      '---',
      'type: business',
      'template_version: 1',
      '---',
      '',
      USEFUL_BODY,
    ].join('\n'))
    const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
    // Content quality should still be 'useful'
    expect(pack.knowledgeQuality.business.artifacts['knowledge/business/business.md']).toBe('useful')
    // But metadata health should report drift
    expect(pack.metadataHealth.drifted).toBe(1)
  })
})
