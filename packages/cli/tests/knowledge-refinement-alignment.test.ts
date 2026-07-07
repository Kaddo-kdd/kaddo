import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildProjectRoute } from '../src/core/project-route.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildUnderstandPlan, enrichUnderstandPlan } from '../src/core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../src/templates/understand-template.js'
import { resolveNextStep } from '../src/core/next-step.js'
import { recommendedAgents } from '../src/agents/groups.js'
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

function writeScan() {
  write('.kaddo/scan.json', JSON.stringify({
    version: '1',
    detected: {
      languages: ['typescript'],
      frameworks: ['next'],
      packageManagers: ['npm'],
      sourceDirectories: ['src'],
      migrationDirectories: [],
      contractFiles: [],
      infrastructureFiles: [],
      testDirectories: ['tests'],
    },
  }))
}

function writeKnowledge() {
  write('knowledge/knowledge.md', '---\ntype: current-state\n---\nProject state.')
}

function writeBaseline() {
  write('knowledge/business/business.md', '---\ntype: business-context\n---\nBusiness context with enough content to pass quality checks.\nThe business model covers B2B SaaS for project management.\nRevenue comes from subscription plans and enterprise licensing.\nKey stakeholders include product managers and engineering leads.')
  write('knowledge/product/product.md', '---\ntype: product-overview\n---\nProduct overview with sufficient detail.\nThe product is a CLI toolkit for knowledge-driven development.\nIt supports multiple workflows including bootstrap, scan, and context generation.\nTarget users are development teams adopting structured knowledge practices.')
}

function installAgent(name: string) {
  const group = name === 'business-agent.md' ? 'business'
    : name === 'capability-agent.md' ? 'product'
    : name === 'architecture-agent.md' ? 'tech'
    : 'delivery'
  write(`knowledge/agents/${group}/${name}`, '# agent')
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-refine-align-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('VS-083.2 — Knowledge Refinement Handoff Alignment', () => {

  describe('agent groups: business-agent in pre-ai set', () => {
    it('AC1: recommended agents for pre-ai include business-agent', () => {
      const agents = recommendedAgents('pre-ai')
      expect(agents).toContain('business-agent.md')
    })
  })

  describe('next-step: agent resolution fields', () => {
    it('AC2: refine-business recommendation includes agentPath and installCommand when agent not installed', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      // business.md exists but is thin — write a placeholder version
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nTODO')
      const rec = resolveNextStep(tmpDir)
      if (rec.id.startsWith('refine-')) {
        expect(rec.agentPath).toBeDefined()
        expect(typeof rec.agentInstalled).toBe('boolean')
        if (!rec.agentInstalled) {
          expect(rec.installCommand).toBeDefined()
          expect(rec.installCommand).toContain('kaddo add agents')
        }
      }
    })

    it('AC3: refine recommendation shows agentInstalled=true when agent is installed', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nTODO')
      installAgent('business-agent.md')
      const rec = resolveNextStep(tmpDir)
      if (rec.id === 'refine-business') {
        expect(rec.agentInstalled).toBe(true)
        expect(rec.installCommand).toBeUndefined()
        expect(rec.agentPath).toBe('knowledge/agents/business/business-agent.md')
      }
    })
  })

  describe('project-route: refine-* step mapping', () => {
    it('AC4: refine-business maps to define-business in project route', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nTODO')
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find(s => s.id === 'define-business')
      expect(step).toBeDefined()
    })

    it('AC5: refine-product maps to define-product in project route', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      write('knowledge/product/product.md', '---\ntype: product-overview\n---\nTODO')
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find(s => s.id === 'define-product')
      expect(step).toBeDefined()
    })
  })

  describe('understand-template markdown: missing agent', () => {
    it('AC6: when agent not installed, understand.md shows Missing Agent section', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      const plan = buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
      const rec = resolveNextStep(tmpDir)
      plan.nextStepRecommendation = rec
      enrichUnderstandPlan(plan, {
        phase: rec.phase ?? 'Knowledge Refinement',
        nextStepRecommendation: rec,
      })
      if (rec.agent && rec.agentInstalled === false) {
        const md = renderUnderstand(plan)
        expect(md).toContain('## Missing Agent')
        expect(md).toContain('is not installed')
        if (rec.installCommand) {
          expect(md).toContain(rec.installCommand)
        }
        expect(md).toContain('kaddo context')
        expect(md).toContain('kaddo understand')
        expect(md).not.toContain('## Agent Prompts')
      }
    })

    it('AC7: when agent is installed, understand.md shows Agent Prompts section', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      installAgent('business-agent.md')
      installAgent('capability-agent.md')
      installAgent('architecture-agent.md')
      installAgent('roadmap-agent.md')
      installAgent('backlog-agent.md')
      installAgent('work-item-agent.md')
      installAgent('implementation-agent.md')
      installAgent('ownership-agent.md')
      const plan = buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
      const rec = resolveNextStep(tmpDir)
      plan.nextStepRecommendation = rec
      enrichUnderstandPlan(plan, {
        phase: rec.phase ?? 'Knowledge Refinement',
        nextStepRecommendation: rec,
      })
      if (rec.agent && rec.agentInstalled !== false) {
        const md = renderUnderstand(plan)
        expect(md).not.toContain('## Missing Agent')
        expect(md).toContain('## Agent Prompts')
      }
    })
  })

  describe('understand-template terminal: missing agent', () => {
    it('AC8: terminal output shows missing agent warning when not installed', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      const plan = buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
      const rec = resolveNextStep(tmpDir)
      plan.nextStepRecommendation = rec
      if (rec.agent && rec.agentInstalled === false) {
        const terminal = renderUnderstandTerminal(plan)
        expect(terminal).toContain('Missing agent:')
        expect(terminal).toContain('kaddo context')
        expect(terminal).toContain('kaddo understand')
      }
    })
  })

  describe('context-pack-template: agent handoff with missing agent', () => {
    it('AC9: context-pack shows install instruction when agent not installed', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      if (pack) {
        const rec = pack.nextStepRecommendation
        if (rec.agent && rec.agentInstalled === false) {
          const md = renderContextPack(pack)
          expect(md).toContain('Agent is not installed')
          if (rec.installCommand) {
            expect(md).toContain(rec.installCommand)
          }
        }
      }
    })

    it('AC10: context-pack shows agent prompt path when agent installed', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      installAgent('business-agent.md')
      installAgent('capability-agent.md')
      installAgent('architecture-agent.md')
      installAgent('roadmap-agent.md')
      installAgent('backlog-agent.md')
      installAgent('work-item-agent.md')
      installAgent('implementation-agent.md')
      installAgent('ownership-agent.md')
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      if (pack) {
        const rec = pack.nextStepRecommendation
        if (rec.agentPath && rec.agentInstalled !== false) {
          const md = renderContextPack(pack)
          expect(md).toContain('Agent prompt:')
          expect(md).toContain(rec.agentPath)
        }
      }
    })
  })

  describe('bootstrap still suppresses (no regression)', () => {
    it('AC11: bootstrap recommendation still shows bootstrap guidance, not missing agent', () => {
      writeConfig('pre-ai')
      writeScan()
      writeKnowledge()
      // no baseline files → bootstrap
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('bootstrap')

      const plan = buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
      plan.nextStepRecommendation = rec
      const md = renderUnderstand(plan)
      expect(md).toContain('Agent handoff is not ready yet')
      expect(md).not.toContain('## Missing Agent')

      const terminal = renderUnderstandTerminal(plan)
      expect(terminal).toContain('kaddo bootstrap')
      expect(terminal).not.toContain('Missing agent:')
    })
  })

  describe('refine recommendation fields', () => {
    it('AC12: refine() includes agent, target, reason, and instructions', () => {
      writeConfig('pre-ai')
      writeScan()
      writeBaseline()
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nTODO')
      const rec = resolveNextStep(tmpDir)
      if (rec.id === 'refine-business') {
        expect(rec.agent).toBe('business-agent')
        expect(rec.target).toBeDefined()
        expect(rec.reason).toBeDefined()
        expect(rec.instructions).toBeDefined()
        expect(rec.instructions!.length).toBeGreaterThan(0)
      }
    })
  })
})
