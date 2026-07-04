import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig } from '../src/core/config.js'
import { buildUnderstandPlan, enrichUnderstandPlan } from '../src/core/understand.js'
import type { UnderstandWorkItem } from '../src/core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../src/templates/understand-template.js'
import { runUnderstand } from '../src/commands/understand.js'
import type { NextStepRecommendation, DeliveryState } from '../src/core/next-step.js'

let tmpDir: string
let origCwd: string

function writeConfig(state = 'pre-ai') {
  const full = path.join(tmpDir, '.kaddo', 'config.yml')
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(
    full,
    [
      'version: 1',
      'project:',
      '  name: "demo"',
      `  state: ${state}`,
      '  structure: monorepo',
      'team:',
      '  size: indie',
    ].join('\n')
  )
}

function installAgents(...names: string[]) {
  const agentsDir = path.join(tmpDir, 'knowledge', 'agents')
  fs.mkdirSync(agentsDir, { recursive: true })
  for (const n of names) fs.writeFileSync(path.join(agentsDir, n), '# agent')
}

const ALL_AGENTS = [
  'capability-agent.md',
  'architecture-agent.md',
  'roadmap-agent.md',
  'legacy-agent.md',
  'adr-agent.md',
]

function plan() {
  return buildUnderstandPlan(tmpDir, loadConfig(tmpDir)!)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-understand-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('understand — buildUnderstandPlan', () => {
  it('recommends roadmap then architecture for new projects', () => {
    writeConfig('new')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual(['roadmap-agent.md', 'architecture-agent.md'])
    expect(p.steps[0].output).toBe('knowledge/delivery/roadmap.md')
  })

  it('recommends capability-first for pre-ai projects', () => {
    writeConfig('pre-ai')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual([
      'capability-agent.md',
      'architecture-agent.md',
      'roadmap-agent.md',
    ])
    expect(p.steps[0].output).toBe('knowledge/product/capabilities.md')
  })

  it('recommends a four-step legacy-first flow for legacy projects', () => {
    writeConfig('legacy')
    const p = plan()
    expect(p.steps.map((s) => s.agent)).toEqual([
      'legacy-agent.md',
      'architecture-agent.md',
      'capability-agent.md',
      'roadmap-agent.md',
    ])
    expect(p.steps[0].output).toBe('knowledge/legacy/risks.md')
  })

  it('flags missing agents and marks agentsInstalled false', () => {
    writeConfig('pre-ai')
    const p = plan()
    expect(p.agentsInstalled).toBe(false)
    expect(p.missingAgents).toContain('capability-agent.md')
  })

  it('marks agentsInstalled true when recommended agents exist', () => {
    writeConfig('pre-ai')
    installAgents(...ALL_AGENTS)
    const p = plan()
    expect(p.agentsInstalled).toBe(true)
    expect(p.missingAgents).toEqual([])
  })

  it('reports scan availability', () => {
    writeConfig('pre-ai')
    expect(plan().scanAvailable).toBe(false)
    fs.writeFileSync(path.join(tmpDir, '.kaddo', 'scan.json'), '{}')
    expect(plan().scanAvailable).toBe(true)
  })
})

describe('understand — rendering', () => {
  it('renders the markdown handoff with all sections and CLI-vs-LLM note', () => {
    writeConfig('pre-ai')
    const md = renderUnderstand(plan())
    expect(md).toContain('# Kaddo Understand Handoff')
    expect(md).toContain('## Recommended Agent Flow')
    expect(md).toContain('## Expected Outputs')
    expect(md).toContain('## Copy/Paste Instructions')
    expect(md).toContain('Kaddo does not call an LLM')
    expect(md).toContain('knowledge/product/capabilities.md')
  })

  it('terminal output names the first agent and target output', () => {
    writeConfig('pre-ai')
    const out = renderUnderstandTerminal(plan())
    expect(out).toContain('First step: use capability-agent.')
    expect(out).toContain('Expected output: knowledge/product/capabilities.md')
  })
})

describe('understand — runUnderstand command', () => {
  it('errors when project is not initialized', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit')
    }) as never)
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => runUnderstand()).toThrow('exit')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not initialized'))
    expect(exitSpy).toHaveBeenCalled()
    cwdSpy.mockRestore()
  })

  it('generates context-pack.md and understand.md', () => {
    writeConfig('pre-ai')
    installAgents(...ALL_AGENTS)
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir)
    vi.spyOn(console, 'log').mockImplementation(() => {})

    runUnderstand()

    expect(fs.existsSync(path.join(tmpDir, '.kaddo', 'context-pack.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, '.kaddo', 'understand.md'))).toBe(true)
    const md = fs.readFileSync(path.join(tmpDir, '.kaddo', 'understand.md'), 'utf8')
    expect(md).toContain('# Kaddo Understand Handoff')
    cwdSpy.mockRestore()
  })
})

// --- VS-079.1: understand markdown rendering alignment ---

function makeDraftDeliveryState(): DeliveryState {
  return {
    phase: 'Active Delivery',
    draft_work_items: 1,
    ready_work_items: 0,
    in_progress_work_items: 0,
    blocked_work_items: 0,
    total_work_items: 1,
    ownership_coverage: '0/1',
    remaining_work_item_candidates: 6,
    decision_candidates: 2,
    accepted_adrs: 0,
    adapters_installed: 0,
  }
}

function makeDraftRec(): NextStepRecommendation {
  return {
    id: 'refine-work-item',
    phase: 'Active Delivery',
    label: 'Refine the existing draft Work Item with the work-item-agent.',
    agent: 'work-item-agent',
    skill: 'work-item-refinement',
    reason: 'There is 1 draft Work Item and no Work Item is ready.',
    secondary: [
      { id: 'suggest-ownership', label: 'Run `kaddo owners suggest` for Work Items without code ownership.', command: 'kaddo owners suggest', reason: 'Ownership coverage is 0/1.' },
      { id: 'materialize-adrs', label: 'Use the adr-writing skill (`kaddo adr`) to materialize decision candidates into ADRs.', command: 'kaddo adr', skill: 'adr-writing', reason: '2 decision candidates, 0 ADRs.' },
      { id: 'materialize-more-work-items', label: 'Later, materialize the remaining 6 Work Item candidate(s) with `kaddo create --from roadmap`.', command: 'kaddo create --from roadmap', reason: '6 remaining.' },
    ],
  }
}

function makeCreateRec(): NextStepRecommendation {
  return {
    id: 'create-work-item',
    phase: 'Delivery Preparation',
    label: 'Run `kaddo create --from roadmap` to materialize the first Work Item.',
    command: 'kaddo create --from roadmap',
    reason: 'The roadmap has candidates but no Work Item exists yet.',
  }
}

function makeInstallAdapterRec(): NextStepRecommendation {
  return {
    id: 'install-adapter',
    phase: 'Active Delivery',
    label: 'Install or configure an adapter before implementation (`kaddo adapters list`).',
    command: 'kaddo adapters list',
    reason: '1 Work Item(s) are ready but no adapter is installed.',
  }
}

function enrichedPlanWith(rec: NextStepRecommendation, ds: DeliveryState, activeWis: UnderstandWorkItem[] = []) {
  writeConfig('pre-ai')
  const basePlan = plan()
  return enrichUnderstandPlan(basePlan, {
    phase: ds.phase,
    nextStepRecommendation: rec,
    deliveryState: ds,
    activeWorkItems: activeWis,
    recommendedPaths: rec.agent ? [`knowledge/agents/delivery/${rec.agent}.md`] : [],
    recommendedSkillPaths: rec.skill ? [`knowledge/skills/${rec.skill}/skill.md`] : [],
    language: 'Spanish',
  })
}

describe('understand markdown — state-aware rendering (VS-079.1)', () => {
  it('AC1: includes Current Phase', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('## Current Phase')
    expect(md).toContain('- Phase: Active Delivery')
  })

  it('AC2: includes nextStepRecommendation', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('- Next step: Refine the existing draft Work Item with the work-item-agent.')
  })

  it('AC3: includes recommended agent', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('- Recommended agent: work-item-agent')
  })

  it('AC4: includes recommended skill', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('- Recommended skill: work-item-refinement')
  })

  it('AC5: includes Delivery State', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('## Delivery State')
    expect(md).toContain('- Draft Work Items: 1')
    expect(md).toContain('- Ownership coverage: 0/1')
    expect(md).toContain('- Remaining Work Item candidates: 6')
  })

  it('AC6: includes secondary recommendations', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('## Secondary Recommendations')
    expect(md).toContain('kaddo owners suggest')
    expect(md).toContain('adr-writing')
    expect(md).toContain('kaddo create --from roadmap')
  })

  it('AC7: includes context-pack path', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('.kaddo/context-pack.md')
  })

  it('AC8: includes recommended agent path', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('knowledge/agents/delivery/work-item-agent.md')
  })

  it('AC9: includes recommended skill path', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('knowledge/skills/work-item-refinement/skill.md')
  })

  it('AC10: includes active Work Items', () => {
    const wis: UnderstandWorkItem[] = [{
      id: 'WI-001', title: 'Deploy edge functions', type: 'chore',
      lifecycle: 'draft', knowledgeLevel: 'K2', hasOwnership: false,
    }]
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState(), wis))
    expect(md).toContain('## Active Work Items')
    expect(md).toContain('WI-001')
    expect(md).toContain('Deploy edge functions')
  })

  it('AC11+12: does not render empty Agent Prompts or Expected Outputs', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    const agentPromptsSection = md.split('## Agent Prompts')[1]?.split('##')[0] ?? ''
    expect(agentPromptsSection.trim()).not.toBe('')
    const expectedOutputsSection = md.split('## Expected Outputs')[1]?.split('##')[0] ?? ''
    expect(expectedOutputsSection.trim()).not.toBe('')
  })

  it('AC13: draft Work Item recommends work-item-agent', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('- agent: work-item-agent')
    expect(md).toContain('- id: refine-work-item')
  })

  it('AC14: no Work Items recommends create from roadmap', () => {
    const noWiDs: DeliveryState = {
      ...makeDraftDeliveryState(),
      phase: 'Delivery Preparation',
      draft_work_items: 0,
      total_work_items: 0,
      ownership_coverage: '0/0',
    }
    const md = renderUnderstand(enrichedPlanWith(makeCreateRec(), noWiDs))
    expect(md).toContain('kaddo create --from roadmap')
    expect(md).toContain('- id: create-work-item')
  })

  it('AC15+16: markdown matches console recommendation semantically', () => {
    const rec = makeDraftRec()
    const md = renderUnderstand(enrichedPlanWith(rec, makeDraftDeliveryState()))
    expect(md).toContain(rec.label)
    expect(md).toContain(rec.reason)
    if (rec.agent) expect(md).toContain(rec.agent)
    if (rec.skill) expect(md).toContain(rec.skill)
  })

  it('ready Work Item + no adapter recommends adapter setup', () => {
    const readyDs: DeliveryState = {
      ...makeDraftDeliveryState(),
      draft_work_items: 0,
      ready_work_items: 1,
    }
    const md = renderUnderstand(enrichedPlanWith(makeInstallAdapterRec(), readyDs))
    expect(md).toContain('- id: install-adapter')
    expect(md).toContain('kaddo adapters list')
  })

  it('includes project language', () => {
    const md = renderUnderstand(enrichedPlanWith(makeDraftRec(), makeDraftDeliveryState()))
    expect(md).toContain('- Language: Spanish')
  })
})
