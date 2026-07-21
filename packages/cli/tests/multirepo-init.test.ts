import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig, isModule, isCore, moduleId, parentSystem, projectRole } from '../src/core/config.js'
import { resolveNextStep, buildDeliveryState } from '../src/core/next-step.js'
import { SKILLS } from '../src/skills/skills.js'
import { AGENT_GROUPS } from '../src/agents/groups.js'
import { detectModuleStatus, readModuleContext } from '../src/services/mapped-modules.js'

let dir: string
function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

const CORE_CONFIG = `version: 1
project:
  name: dotear-platform
  state: pre-ai
  structure: multirepo
  role: core
  language: es
team:
  size: small
multirepo:
  role: core
  modules_file: knowledge/modules/modules.md
`

const MODULE_CONFIG = `version: 1
project:
  name: dotear-loyalty
  state: pre-ai
  structure: multirepo
  role: module
  language: es
team:
  size: small
multirepo:
  role: module
  parent_system: dotear-platform
module:
  id: loyalty
`

const MODULE_CONTEXT_PLACEHOLDER = `---
type: module-context
scope: module
module_id: loyalty
parent_system: dotear-platform
generated_by: kaddo-init
template_version: 1
---

# Module Context

## Module identity

_Describe the module name, purpose, and role inside the parent system._

## Responsibility

_Describe what this module owns inside the system._

## Boundaries

_Describe what belongs to this module and what should not be handled here._

## Exposed interfaces

_List APIs, routes, events, tables, packages, contracts, or other integration points exposed by this module._

## Dependencies

_List modules, services, databases, queues, providers, or infrastructure this module depends on._

## Consumers

_List modules, apps, teams, or external systems that consume this module._

## Local rules

_Document module-specific rules that agents and developers must respect._

## Risks

_Document known risks when changing this module._

## Open questions

- [open] _What still needs confirmation about this module?_
`

const MODULE_CONTEXT_USEFUL = `---
type: module-context
scope: module
module_id: loyalty
parent_system: dotear-platform
generated_by: kaddo-init
template_version: 1
---

# Module Context

## Module identity

The loyalty module manages the points program for the dotear-platform. It handles point
accrual, redemption, and tier calculations for all active subscribers across the three
subscription plans (basic, pro, enterprise). Points are earned per transaction and redeemed
through the loyalty portal, which integrates with the billing module for plan-level limits
and the admin module for reporting dashboards.

## Responsibility

This module owns the full lifecycle of loyalty points: calculation rules, balance tracking,
tier progression, and redemption workflows. It exposes a REST API consumed by the storefront
and an event stream consumed by the analytics pipeline.
`

const USEFUL = (title: string) => `---\ntype: x\n---\n\n## ${title} one\nThe API is a Fastify service written in TypeScript and backed by a PostgreSQL database, with a Redis\nworker queue for background jobs, JWT based authentication, and blue-green deployments gated behind a\nmanual approval step before automated database migrations run on every release to the production tier.\n\n## ${title} two\nRate limiting is enforced at the shared gateway, background jobs retry with a dead-letter queue for\nfailures, structured logs and per-endpoint latency metrics feed the monitoring dashboards, and every\nadministrator write operation is recorded in an append-only audit table read nightly by the compliance\nreporting pipeline used across the finance and operations teams for their monthly reviews.\n`

function setupCore() {
  write('.kaddo/config.yml', CORE_CONFIG)
}

function setupModule() {
  write('.kaddo/config.yml', MODULE_CONFIG)
}

function pastUsefulKnowledge() {
  setupCore()
  write('.kaddo/scan.json', '{}')
  write('.kaddo/context-pack.md', '# ctx\n')
  write('.kaddo/understand.md', '# und\n')
  write('knowledge/agents/delivery/roadmap-agent.md', '# Roadmap Agent\n')
  write('knowledge/skills/adr-writing/skill.md', '---\ntype: skill\nid: adr-writing\ntitle: ADR\ngroup: tech\n---\n# x\n')
  write('knowledge/business/business.md', USEFUL('Business'))
  write('knowledge/product/product.md', USEFUL('Product'))
  write('knowledge/product/capabilities.md', USEFUL('Capabilities'))
  write('knowledge/tech/codebase.md', USEFUL('Codebase'))
  write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
}

function moduleUseful() {
  setupModule()
  write('.kaddo/scan.json', '{}')
  write('.kaddo/context-pack.md', '# ctx\n')
  write('.kaddo/understand.md', '# und\n')
  write('knowledge/module/module-context.md', MODULE_CONTEXT_USEFUL)
  write('knowledge/tech/codebase.md', USEFUL('Codebase'))
  write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-multirepo-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('VS-091 — config role', () => {
  it('AC3: core config has role: core', () => {
    setupCore()
    const config = loadConfig(dir)!
    expect(projectRole(config)).toBe('core')
    expect(isCore(config)).toBe(true)
    expect(isModule(config)).toBe(false)
  })

  it('AC4: module config has role: module', () => {
    setupModule()
    const config = loadConfig(dir)!
    expect(projectRole(config)).toBe('module')
    expect(isModule(config)).toBe(true)
    expect(isCore(config)).toBe(false)
  })

  it('module config has module id and parent system', () => {
    setupModule()
    const config = loadConfig(dir)!
    expect(moduleId(config)).toBe('loyalty')
    expect(parentSystem(config)).toBe('dotear-platform')
  })
})

describe('VS-091 — module init structure', () => {
  it('AC5: module-context.md created for module init', () => {
    setupModule()
    write('knowledge/module/module-context.md', MODULE_CONTEXT_PLACEHOLDER)
    expect(fs.existsSync(path.join(dir, 'knowledge/module/module-context.md'))).toBe(true)
  })

  it('AC14: module-context.md has valid frontmatter', () => {
    const content = MODULE_CONTEXT_PLACEHOLDER
    expect(content).toContain('type: module-context')
    expect(content).toContain('module_id: loyalty')
    expect(content).toContain('parent_system: dotear-platform')
  })

  it('AC15: module-context.md has required sections', () => {
    const content = MODULE_CONTEXT_PLACEHOLDER
    expect(content).toContain('## Module identity')
    expect(content).toContain('## Responsibility')
    expect(content).toContain('## Boundaries')
    expect(content).toContain('## Exposed interfaces')
    expect(content).toContain('## Dependencies')
    expect(content).toContain('## Consumers')
    expect(content).toContain('## Local rules')
    expect(content).toContain('## Risks')
    expect(content).toContain('## Open questions')
  })

  it('AC8: module does not generate business.md', () => {
    setupModule()
    write('knowledge/module/module-context.md', MODULE_CONTEXT_PLACEHOLDER)
    expect(fs.existsSync(path.join(dir, 'knowledge/business/business.md'))).toBe(false)
  })

  it('AC9: module does not generate product.md', () => {
    setupModule()
    write('knowledge/module/module-context.md', MODULE_CONTEXT_PLACEHOLDER)
    expect(fs.existsSync(path.join(dir, 'knowledge/product/product.md'))).toBe(false)
  })

  it('AC10: module does not install agents by default', () => {
    setupModule()
    expect(fs.existsSync(path.join(dir, 'knowledge/agents'))).toBe(false)
  })

  it('AC11: module does not install skills by default', () => {
    setupModule()
    expect(fs.existsSync(path.join(dir, 'knowledge/skills'))).toBe(false)
  })
})

describe('VS-091 — agent and skill additions', () => {
  it('AC16: module-context-agent exists in agent groups', () => {
    expect(AGENT_GROUPS.tech).toContain('module-context-agent.md')
  })

  it('AC17: module-context-refinement skill exists', () => {
    expect(SKILLS.find((s) => s.id === 'module-context-refinement')).toBeTruthy()
  })
})

describe('VS-091 — module next-step', () => {
  it('AC28: module repo does not recommend creating Work Items', () => {
    moduleUseful()
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('module-ready')
    expect(rec.id).not.toBe('create-work-item')
    expect(rec.id).not.toBe('roadmap')
  })

  it('AC30: recommends refine-module-context for placeholder module-context', () => {
    setupModule()
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# ctx\n')
    write('knowledge/module/module-context.md', MODULE_CONTEXT_PLACEHOLDER)
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('refine-module-context')
    expect(rec.agent).toBe('module-context-agent')
    expect(rec.skill).toBe('module-context-refinement')
  })

  it('module missing module-context recommends init', () => {
    setupModule()
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('init-module-context')
  })

  it('module skips business/product/agents/skills checks', () => {
    setupModule()
    write('knowledge/module/module-context.md', MODULE_CONTEXT_USEFUL)
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# ctx\n')
    write('.kaddo/understand.md', '# und\n')
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('bootstrap')
    expect(rec.id).not.toBe('add-agents')
    expect(rec.id).not.toBe('add-skills')
  })
})

describe('VS-091 — modules map status detection', () => {
  it('AC18: detects configured module', () => {
    setupCore()
    const moduleDir = path.join(dir, '../dotear-loyalty')
    fs.mkdirSync(path.join(moduleDir, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, '.kaddo/config.yml'), MODULE_CONFIG)
    fs.mkdirSync(path.join(moduleDir, 'knowledge/module'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'knowledge/module/module-context.md'), MODULE_CONTEXT_USEFUL)
    fs.mkdirSync(path.join(moduleDir, 'knowledge/tech'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'knowledge/tech/current-state.md'), USEFUL('CS'))
    fs.writeFileSync(path.join(moduleDir, 'knowledge/tech/codebase.md'), USEFUL('CB'))

    const status = detectModuleStatus(dir, '../dotear-loyalty')
    expect(status.status).toBe('configured')
    expect(status.configured).toBe(true)
    expect(status.role).toBe('module')
    expect(status.moduleContext).toBe(true)
    expect(status.currentState).toBe(true)
    expect(status.codebase).toBe(true)

    fs.rmSync(moduleDir, { recursive: true, force: true })
  })

  it('AC19: detects not configured module', () => {
    setupCore()
    const moduleDir = path.join(dir, '../dotear-admin')
    fs.mkdirSync(moduleDir, { recursive: true })

    const status = detectModuleStatus(dir, '../dotear-admin')
    expect(status.status).toBe('not_configured')
    expect(status.configured).toBe(false)
    expect(status.warning).toContain('kaddo init')

    fs.rmSync(moduleDir, { recursive: true, force: true })
  })

  it('AC20: detects invalid module role', () => {
    setupCore()
    const moduleDir = path.join(dir, '../dotear-billing')
    fs.mkdirSync(path.join(moduleDir, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, '.kaddo/config.yml'), CORE_CONFIG)

    const status = detectModuleStatus(dir, '../dotear-billing')
    expect(status.status).toBe('invalid')
    expect(status.warning).toContain('project.role is not module')

    fs.rmSync(moduleDir, { recursive: true, force: true })
  })
})

describe('VS-091 — module context reading', () => {
  it('readModuleContext returns content for configured module', () => {
    const moduleDir = path.join(dir, '../dotear-loyalty')
    fs.mkdirSync(path.join(moduleDir, 'knowledge/module'), { recursive: true })
    fs.writeFileSync(path.join(moduleDir, 'knowledge/module/module-context.md'), MODULE_CONTEXT_USEFUL)

    const content = readModuleContext(dir, '../dotear-loyalty')
    expect(content).toContain('loyalty module manages the points program')

    fs.rmSync(moduleDir, { recursive: true, force: true })
  })

  it('readModuleContext returns null for missing module', () => {
    const content = readModuleContext(dir, '../dotear-nonexistent')
    expect(content).toBeNull()
  })
})

describe('VS-091 — Work Item affected_modules', () => {
  it('AC25: WI frontmatter with affected_modules parsed in rawFrontmatter', () => {
    const wiContent = `---
type: bugfix
id: WI-014
title: "Ajustar cálculo de puntos"
status: draft
affected_modules:
  - loyalty
  - billing
code:
  - repo: dotear-loyalty
    paths:
      - src/points/calculatePoints.ts
---

## Problem

Points calculation is incorrect.
`
    pastUsefulKnowledge()
    write('knowledge/delivery/work-items/draft/WI-014.md', wiContent)
    const st = buildDeliveryState(dir)
    expect(st.draft_work_items).toBe(1)
  })
})

describe('VS-091 — safety', () => {
  it('AC50: CLI next-step does not call LLM', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../src/core/next-step.ts'),
      'utf-8'
    )
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
  })

  it('CLI next-step does not execute git', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../src/core/next-step.ts'),
      'utf-8'
    )
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
  })
})
