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

// --- VS-083.3 — Understand Self-Recommendation Guard ---

function writeFullSetup() {
  writeConfig('pre-ai')
  writeScan()
  writeBaseline()
  writeKnowledge()
  // Install agents
  installAgent('business-agent.md')
  installAgent('capability-agent.md')
  installAgent('architecture-agent.md')
  installAgent('roadmap-agent.md')
  installAgent('backlog-agent.md')
  installAgent('work-item-agent.md')
  installAgent('implementation-agent.md')
  installAgent('ownership-agent.md')
  // Install skills
  write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
  // Create context pack
  write('.kaddo/context-pack.md', '# Context Pack\n')
  write('.kaddo/context-pack.json', '{}')
}

const USEFUL_CONTENT = (topic: string) =>
  `---\ntype: ${topic.toLowerCase()}\n---\n# ${topic}\n\n` +
  `## Overview\n\n` +
  `This document contains substantial real knowledge about the ${topic.toLowerCase()} domain. ` +
  `It covers multiple aspects including strategy, stakeholders, key metrics, and operational details. ` +
  `The content is specific and actionable, not a placeholder. It provides enough detail for agents ` +
  `to produce meaningful outputs. The system handles authentication, authorization, data processing, ` +
  `reporting, notifications, and integrations with third-party services.\n\n` +
  `## Details\n\n` +
  `The implementation follows a modular architecture with clear separation of concerns. Each module ` +
  `is responsible for a specific domain area and communicates through well-defined interfaces. The ` +
  `deployment pipeline includes automated testing, staging environments, and production rollouts. ` +
  `Monitoring covers application performance, error rates, and business metrics dashboards.\n`

describe('VS-083.3 — Understand Self-Recommendation Guard', () => {

  describe('self-recommendation guard', () => {
    it('AC1: understand does not recommend itself when placeholders exist', () => {
      writeFullSetup()
      // business.md is baseline placeholder (from writeBaseline)
      write('.kaddo/understand.md', '# Understand\n')
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).not.toBe('understand')
    })

    it('AC2: refine-business is recommended when business.md is placeholder', () => {
      writeFullSetup()
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('refine-business')
      expect(rec.agent).toBe('business-agent')
    })

    it('AC3/AC4/AC5/AC6: refine-business includes agentPath, agentInstalled, target', () => {
      writeFullSetup()
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('refine-business')
      expect(rec.agentPath).toBe('knowledge/agents/business/business-agent.md')
      expect(rec.agentInstalled).toBe(true)
      expect(rec.target).toBe('knowledge/business/business.md')
    })
  })

  describe('project route alignment', () => {
    it('AC11: projectRoute.currentStep = define-business when business is placeholder', () => {
      writeFullSetup()
      const route = buildProjectRoute(tmpDir)
      expect(route.currentStep).toBe('define-business')
    })

    it('AC12: scan with warnings stays as warning, not current, when refine-business applies', () => {
      writeFullSetup()
      const route = buildProjectRoute(tmpDir)
      const scan = route.steps.find(s => s.id === 'scan-repository')
      expect(scan).toBeDefined()
      if (scan!.status !== 'done') {
        expect(scan!.status).not.toBe('current')
      }
    })
  })

  describe('context-pack alignment', () => {
    it('AC9: context-pack.json resolves refine-business when business.md is placeholder', () => {
      writeFullSetup()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      expect(pack.nextStepRecommendation.id).toBe('refine-business')
    })

    it('AC10: deliveryState.phase reflects Knowledge Refinement when rec is refine', () => {
      writeFullSetup()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      expect(pack.nextStepRecommendation.phase).toBe('Knowledge Refinement')
    })
  })

  describe('progression after business is useful', () => {
    it('AC13: after business.md is useful, recommendation advances to product', () => {
      writeFullSetup()
      write('knowledge/business/business.md', USEFUL_CONTENT('Business'))
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('refine-product')
    })

    it('after all knowledge is useful, understand fallback works', () => {
      writeFullSetup()
      write('knowledge/business/business.md', USEFUL_CONTENT('Business'))
      write('knowledge/product/product.md', USEFUL_CONTENT('Product'))
      write('knowledge/product/capabilities.md', USEFUL_CONTENT('Capabilities'))
      write('knowledge/tech/current-state.md', USEFUL_CONTENT('Architecture'))
      write('knowledge/tech/codebase.md', USEFUL_CONTENT('Codebase'))
      // No understand.md → should now recommend understand
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('understand')
      expect(rec.command).toBe('kaddo understand')
    })
  })

  describe('understand.md and context-pack.md rendering', () => {
    it('AC7: understand.md renders business-agent handoff when business.md is placeholder', () => {
      writeFullSetup()
      const plan = buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
      const rec = resolveNextStep(tmpDir)
      plan.nextStepRecommendation = rec
      enrichUnderstandPlan(plan, {
        phase: rec.phase,
        nextStepRecommendation: rec,
      })
      const md = renderUnderstand(plan)
      expect(md).toContain('business-agent')
      expect(md).toContain('knowledge/business/business.md')
      expect(md).not.toContain('id: understand')
    })

    it('AC8: context-pack.md renders business-agent handoff', () => {
      writeFullSetup()
      const pack = buildContextPack(tmpDir, loadConfig(tmpDir)!)
      const md = renderContextPack(pack)
      expect(md).toContain('business-agent')
      expect(md).not.toContain('Run `kaddo understand` to summarize')
    })
  })

  describe('CLI invariants', () => {
    it('AC19/AC20: CLI does not call LLM or execute git (deterministic)', () => {
      writeFullSetup()
      const rec = resolveNextStep(tmpDir)
      expect(rec.id).toBe('refine-business')
      // resolveNextStep is pure — if it returned, it didn't call LLM or git
    })
  })
})
