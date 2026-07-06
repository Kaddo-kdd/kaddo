import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { buildProjectRoute } from '../src/core/project-route.js'
import { buildProjectExplanation, renderExplanationHuman } from '../src/core/project-explain.js'
import { buildContextPack } from '../src/core/context-pack.js'
import { renderContextPack } from '../src/templates/context-pack-template.js'
import { buildUnderstandPlan, enrichUnderstandPlan } from '../src/core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../src/templates/understand-template.js'
import { resolveNextStep } from '../src/core/next-step.js'
import type { NextStepRecommendation, DeliveryState } from '../src/core/next-step.js'

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

function installAgents(...names: string[]) {
  for (const n of names) {
    write(`knowledge/agents/${n}`, '# agent')
  }
}

function installSkills(...names: string[]) {
  for (const n of names) {
    write(`knowledge/skills/${n}`, '# skill')
  }
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-bootstrap-align-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('VS-083 — Bootstrap Recommendation Alignment', () => {

  describe('project-route: bootstrap step', () => {
    it('AC1: route includes bootstrap step in pre-ai state', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find((s) => s.id === 'bootstrap')
      expect(step).toBeDefined()
      expect(step!.label).toBe('Bootstrap knowledge baseline')
    })

    it('AC2: bootstrap step is current when business.md missing', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/product/product.md', '---\ntype: product-overview\n---\nProduct.')
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find((s) => s.id === 'bootstrap')
      expect(step!.status).toBe('current')
      expect(step!.command).toBe('kaddo bootstrap')
    })

    it('AC3: bootstrap step is current when product.md missing', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nBusiness.')
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find((s) => s.id === 'bootstrap')
      expect(step!.status).toBe('current')
    })

    it('AC4: bootstrap step is done when both files exist', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeBaseline()
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find((s) => s.id === 'bootstrap')
      expect(step!.status).toBe('done')
      expect(step!.evidence).toContain('knowledge/business/business.md')
      expect(step!.evidence).toContain('knowledge/product/product.md')
    })

    it('AC5: currentStep is bootstrap when baseline incomplete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeScan()
      const route = buildProjectRoute(tmpDir)
      expect(route.currentStep).toBe('bootstrap')
    })

    it('AC6: bootstrap step appears before define-business in route', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const route = buildProjectRoute(tmpDir)
      const bootstrapIdx = route.steps.findIndex((s) => s.id === 'bootstrap')
      const businessIdx = route.steps.findIndex((s) => s.id === 'define-business')
      expect(bootstrapIdx).toBeLessThan(businessIdx)
    })

    it('route includes bootstrap step in legacy state', () => {
      writeConfig('legacy')
      writeKnowledge()
      const route = buildProjectRoute(tmpDir)
      const step = route.steps.find((s) => s.id === 'bootstrap')
      expect(step).toBeDefined()
    })
  })

  describe('project-explain: bootstrap-first suggestions', () => {
    it('AC7: suggests kaddo bootstrap first when baseline incomplete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const explanation = buildProjectExplanation(tmpDir)
      const human = renderExplanationHuman(explanation)
      expect(human).toContain('kaddo bootstrap')
    })

    it('AC8: suggests agents and skills after bootstrap', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const explanation = buildProjectExplanation(tmpDir)
      const human = renderExplanationHuman(explanation)
      const bootstrapIdx = human.indexOf('kaddo bootstrap')
      const agentsIdx = human.indexOf('kaddo add agents')
      expect(bootstrapIdx).toBeLessThan(agentsIdx)
    })

    it('does not suggest bootstrap when baseline is complete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeBaseline()
      installAgents('business-agent.md')
      const explanation = buildProjectExplanation(tmpDir)
      const human = renderExplanationHuman(explanation)
      expect(human).not.toContain('Run `kaddo bootstrap`')
    })

    it('reports hasBusiness and hasProduct correctly', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nBusiness.')
      const explanation = buildProjectExplanation(tmpDir)
      expect(explanation.knowledge.hasBusiness).toBe(true)
      expect(explanation.knowledge.hasProduct).toBe(false)
    })

    it('reports hasSkills correctly', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      installSkills('testing-skill.md')
      const explanation = buildProjectExplanation(tmpDir)
      expect(explanation.knowledge.hasSkills).toBe(true)
    })
  })

  describe('context-pack: bootstrap-aware rendering', () => {
    it('AC10: suppresses agent handoff when bootstrap incomplete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeScan()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).toContain('No agent handoff yet.')
      expect(md).toContain('Run `kaddo bootstrap` first')
      expect(md).not.toContain('1. business-agent')
    })

    it('AC11: shows bootstrap baseline missing in Missing Context', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeScan()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).toContain('Bootstrap baseline is incomplete.')
    })

    it('AC12: shows missing business knowledge', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/product/product.md', '---\ntype: product-overview\n---\nProduct overview content enough to pass checks.')
      writeScan()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).toContain('Missing business knowledge.')
    })

    it('AC13: shows missing product knowledge', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nBusiness context with enough content.')
      writeScan()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).toContain('Missing product knowledge.')
    })

    it('shows agents when bootstrap is complete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeBaseline()
      writeScan()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).not.toContain('No agent handoff yet.')
      expect(md).toContain('Recommended next for the')
    })
  })

  describe('understand: bootstrap-aware rendering', () => {
    function makePlan() {
      return buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
    }

    function makeBootstrapRec(): NextStepRecommendation {
      return {
        id: 'bootstrap',
        phase: 'Setup',
        label: 'Run `kaddo bootstrap` to create the project knowledge baseline.',
        reason: 'The knowledge baseline is incomplete.',
        command: 'kaddo bootstrap',
        secondary: [],
      }
    }

    function makeDeliveryState(): DeliveryState {
      return {
        phase: 'Setup',
        total_work_items: 0,
        draft_work_items: 0,
        ready_work_items: 0,
        in_progress_work_items: 0,
        blocked_work_items: 0,
        ownership_coverage: 'none',
        remaining_work_item_candidates: 0,
        decision_candidates: 0,
        accepted_adrs: 0,
        adapters_installed: 0,
      }
    }

    function enrich(p: ReturnType<typeof makePlan>) {
      return enrichUnderstandPlan(p, {
        phase: 'Setup',
        nextStepRecommendation: makeBootstrapRec(),
        deliveryState: makeDeliveryState(),
        activeWorkItems: [],
        recommendedPaths: [],
        recommendedSkillPaths: [],
        language: 'typescript',
      })
    }

    it('AC14: terminal output shows Setup phase when bootstrap incomplete', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const terminal = renderUnderstandTerminal(enrich(makePlan()))
      expect(terminal).toContain('Current phase: Setup')
    })

    it('AC15: terminal output shows bootstrap next step', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const terminal = renderUnderstandTerminal(enrich(makePlan()))
      expect(terminal).toContain('kaddo bootstrap')
      expect(terminal).toContain('knowledge baseline is incomplete')
    })

    it('AC16: terminal output shows agent handoff not ready', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const terminal = renderUnderstandTerminal(enrich(makePlan()))
      expect(terminal).toContain('Agent handoff is not ready yet.')
      expect(terminal).toContain('Run `kaddo bootstrap` first.')
    })

    it('AC17: markdown output shows agent handoff not ready', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const md = renderUnderstand(enrich(makePlan()))
      expect(md).toContain('Agent handoff is not ready yet.')
      expect(md).toContain('Run `kaddo bootstrap` first.')
      expect(md).not.toContain('## Recommended Agent Flow')
    })

    it('AC18: markdown uses Agent Handoff heading (not Recommended Agent Flow)', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      const md = renderUnderstand(enrich(makePlan()))
      expect(md).toContain('## Agent Handoff')
    })
  })

  describe('next-step: bootstrap resolves correctly', () => {
    it('returns bootstrap when business.md missing', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/product/product.md', '---\ntype: product-overview\n---\nProduct.')
      const step = resolveNextStep(tmpDir)
      expect(step.id).toBe('bootstrap')
      expect(step.phase).toBe('Setup')
    })

    it('returns bootstrap when product.md missing', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      write('knowledge/business/business.md', '---\ntype: business-context\n---\nBusiness.')
      const step = resolveNextStep(tmpDir)
      expect(step.id).toBe('bootstrap')
    })

    it('does not return bootstrap when both files exist', () => {
      writeConfig('pre-ai')
      writeKnowledge()
      writeBaseline()
      const step = resolveNextStep(tmpDir)
      expect(step.id).not.toBe('bootstrap')
    })
  })
})
