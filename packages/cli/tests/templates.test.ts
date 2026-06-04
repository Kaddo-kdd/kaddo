import { describe, it, expect } from 'vitest'
import {
  KADDO_TEMPLATES,
  listTemplates,
  getTemplate,
  templatesByCategory,
  type TemplateCategory,
} from '../src/templates/registry.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'

const REQUIRED_IDS = [
  // core
  'work-item',
  'roadmap',
  'capabilities',
  'knowledge',
  // architecture
  'current-state',
  'architecture-notes',
  'decision-candidates',
  'adr',
  // module
  'module-design',
  'module-stack',
  'module-security',
  'module-standards',
  'module-adr',
  // operations
  'security',
  'standards',
  'stack',
  'git-strategy',
  'incident',
  'runbook',
  // legacy
  'legacy-risks',
  'legacy-unknowns',
  'modernization-candidates',
]

// Templates that participate in traceability must carry YAML front matter.
const FRONT_MATTER_IDS = [
  'work-item',
  'adr',
  'module-design',
  'module-adr',
  'incident',
]

describe('template registry', () => {
  it('AC2–AC6: includes all required templates by id', () => {
    const ids = KADDO_TEMPLATES.map((t) => t.id)
    for (const id of REQUIRED_IDS) {
      expect(ids, `missing ${id}`).toContain(id)
    }
  })

  it('has unique ids', () => {
    const ids = KADDO_TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('AC7: each template has id/name/category/outputPath/description/whenToUse/content', () => {
    for (const t of KADDO_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.category).toBeTruthy()
      expect(t.outputPath, t.id).toBeTruthy()
      expect(t.description, t.id).toBeTruthy()
      expect(t.whenToUse, t.id).toBeTruthy()
      expect(t.content.length, t.id).toBeGreaterThan(0)
    }
  })

  it('AC7: every template content includes a quality checklist', () => {
    for (const t of KADDO_TEMPLATES) {
      expect(t.content, `${t.id} missing quality checklist`).toContain('## Quality checklist')
    }
  })

  it('AC8: traceability templates include front matter', () => {
    for (const id of FRONT_MATTER_IDS) {
      const t = getTemplate(id)!
      expect(t, id).toBeDefined()
      expect(t.content.startsWith('---\n'), `${id} should start with front matter`).toBe(true)
    }
  })

  it('getTemplate returns undefined for unknown id', () => {
    expect(getTemplate('nope')).toBeUndefined()
  })

  it('templatesByCategory partitions the registry', () => {
    const cats: TemplateCategory[] = ['core', 'business', 'knowledge', 'module', 'operations', 'legacy']
    const total = cats.reduce((n, c) => n + templatesByCategory(c).length, 0)
    expect(total).toBe(listTemplates().length)
    expect(templatesByCategory('core').map((t) => t.id)).toContain('work-item')
  })

  it('AC9: agent-linked templates reference their output path in the agent prompt', () => {
    const checks: { template: string; agent: string }[] = [
      { template: 'roadmap', agent: 'roadmap-agent.md' },
      { template: 'capabilities', agent: 'capability-agent.md' },
      { template: 'current-state', agent: 'architecture-agent.md' },
      { template: 'module-design', agent: 'module-design-agent.md' },
      { template: 'security', agent: 'security-agent.md' },
      { template: 'standards', agent: 'standards-agent.md' },
      { template: 'stack', agent: 'stack-agent.md' },
      { template: 'git-strategy', agent: 'git-strategy-agent.md' },
    ]
    for (const { template, agent } of checks) {
      const tpl = getTemplate(template)!
      const prompt = AGENT_PROMPTS.find((a) => a.fileName === agent)
      expect(prompt, `agent ${agent} not found`).toBeDefined()
      // The agent prompt should mention the artifact directory the template targets.
      const dir = tpl.outputPath.replace(/<id>\/?/, '').replace(/\/$/, '')
      const token = dir.split('/').slice(0, 2).join('/')
      expect(prompt!.content, `${agent} should reference ${token}`).toContain(token)
    }
  })
})
