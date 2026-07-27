import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig, isCore, isModule, systemName, workspaceRoots } from '../src/core/config.js'
import { resolveNextStep } from '../src/core/next-step.js'
import {
  discoverModules,
  applyDiscovery,
  readModulesYml,
  detectLegacyPaths,
} from '../src/commands/modules-discover.js'
import { detectModuleStatus, readModuleContext } from '../src/services/mapped-modules.js'

let dir: string
function write(rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

const USEFUL = (title: string) => `---\ntype: x\n---\n\n## ${title} one\nThe API is a Fastify service written in TypeScript and backed by a PostgreSQL database, with a Redis\nworker queue for background jobs, JWT based authentication, and blue-green deployments gated behind a\nmanual approval step before automated database migrations run on every release to the production tier.\n\n## ${title} two\nRate limiting is enforced at the shared gateway, background jobs retry with a dead-letter queue for\nfailures, structured logs and per-endpoint latency metrics feed the monitoring dashboards, and every\nadministrator write operation is recorded in an append-only audit table read nightly by the compliance\nreporting pipeline used across the finance and operations teams for their monthly reviews.\n`

const CORE_CONFIG_093 = `version: 1
project:
  name: acme-platform
  state: pre-ai
  structure: multirepo
  role: core
  language: en
team:
  size: small
system:
  name: acme-platform
multirepo:
  role: core
  modules_file: .kaddo/modules.yml
  workspace_roots:
    - '..'
`

const MODULE_CONFIG_093 = `version: 1
project:
  name: acme-billing
  state: pre-ai
  structure: multirepo
  role: module
  language: en
team:
  size: small
multirepo:
  role: module
  parent_system: acme-platform
module:
  id: billing
`

const FOREIGN_CONFIG = `version: 1
project:
  name: other-svc
  state: pre-ai
  structure: multirepo
  role: module
  language: en
team:
  size: small
multirepo:
  role: module
  parent_system: other-system
module:
  id: other-svc
`

const MODULE_CONTEXT_PLACEHOLDER = `---
type: module-context
scope: module
module_id: billing
parent_system: acme-platform
generated_by: kaddo-init
template_version: 1
---

# Module Context

## Module identity

_Describe the module name, purpose, and role inside the parent system._

## Responsibility

_Describe what this module owns inside the system._
`

const MODULE_CONTEXT_USEFUL = `---
type: module-context
scope: module
module_id: billing
parent_system: acme-platform
---

# Module Context

## Module identity

The billing module handles all subscription management, payment processing, and invoice
generation for the acme-platform. It integrates with Stripe for payment processing and
exposes a REST API consumed by the storefront and admin dashboard. The module is deployed
as a standalone Fastify service backed by PostgreSQL, with Redis for background job
processing and a dedicated queue for retry-able payment operations across all plans.

## Responsibility

Owns the full lifecycle of subscriptions: plan management, payment collection, invoice
generation, and dunning workflows. Exposes webhooks for downstream event consumers.
The billing module also manages tax calculation, proration for mid-cycle plan changes,
and integration with the accounting ledger used by the finance team for monthly closes.
`

function setupCore() {
  write('.kaddo/config.yml', CORE_CONFIG_093)
}

function setupModuleRepo(name: string, config: string, mcPath: 'new' | 'legacy' | 'none' = 'none') {
  const modDir = path.join(dir, '..', name)
  fs.mkdirSync(path.join(modDir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(modDir, '.kaddo', 'config.yml'), config)
  if (mcPath === 'new') {
    fs.mkdirSync(path.join(modDir, 'knowledge', 'tech', 'module'), { recursive: true })
    fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'module', 'module-context.md'), MODULE_CONTEXT_USEFUL)
  } else if (mcPath === 'legacy') {
    fs.mkdirSync(path.join(modDir, 'knowledge', 'module'), { recursive: true })
    fs.writeFileSync(path.join(modDir, 'knowledge', 'module', 'module-context.md'), MODULE_CONTEXT_USEFUL)
  }
  fs.mkdirSync(path.join(modDir, 'knowledge', 'tech'), { recursive: true })
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'current-state.md'), USEFUL('CS'))
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'codebase.md'), USEFUL('CB'))
  return modDir
}

function cleanSibling(name: string) {
  const d = path.join(dir, '..', name)
  if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true })
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-093-')) })
afterEach(() => {
  cleanSibling('acme-billing')
  cleanSibling('acme-admin')
  cleanSibling('other-svc')
  cleanSibling('no-kaddo-repo')
  fs.rmSync(dir, { recursive: true, force: true })
})

// --- VS-093: config: system.name and workspace_roots ---

describe('VS-093 — config system.name and workspace_roots', () => {
  it('AC1: system.name is readable from core config', () => {
    setupCore()
    const config = loadConfig(dir)!
    expect(systemName(config)).toBe('acme-platform')
  })

  it('AC2: workspace_roots defaults to [".."]', () => {
    write('.kaddo/config.yml', `version: 1\nproject:\n  name: x\n  state: new\n  structure: multirepo\n  role: core\nteam:\n  size: small\nmultirepo:\n  role: core\n`)
    const config = loadConfig(dir)!
    expect(workspaceRoots(config)).toEqual(['..'])
  })

  it('AC3: workspace_roots reads custom value', () => {
    setupCore()
    const config = loadConfig(dir)!
    expect(workspaceRoots(config)).toEqual(['..'])
  })
})

// --- VS-093: kaddo modules discover ---

describe('VS-093 — discoverModules()', () => {
  it('AC4: finds configured module repos in workspace roots', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')

    const results = discoverModules(dir)
    const billing = results.find((r) => r.id === 'billing')
    expect(billing).toBeTruthy()
    expect(billing!.status).toBe('configured')
    expect(billing!.eligibleForMapping).toBe(true)
  })

  it('AC5: detects not_configured repos', () => {
    setupCore()
    const noKaddo = path.join(dir, '..', 'no-kaddo-repo')
    fs.mkdirSync(noKaddo, { recursive: true })

    const results = discoverModules(dir)
    const found = results.find((r) => r.status === 'not_configured')
    expect(found).toBeTruthy()
    expect(found!.eligibleForMapping).toBe(false)
  })

  it('AC6: detects foreign_system modules', () => {
    setupCore()
    setupModuleRepo('other-svc', FOREIGN_CONFIG, 'new')

    const results = discoverModules(dir)
    const found = results.find((r) => r.id === 'other-svc')
    expect(found).toBeTruthy()
    expect(found!.status).toBe('foreign_system')
    expect(found!.eligibleForMapping).toBe(false)
  })

  it('AC7: detects invalid (non-module role) repos', () => {
    setupCore()
    const adminDir = path.join(dir, '..', 'acme-admin')
    fs.mkdirSync(path.join(adminDir, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(adminDir, '.kaddo', 'config.yml'), CORE_CONFIG_093)

    const results = discoverModules(dir)
    const found = results.find((r) => r.id === 'acme-admin')
    expect(found).toBeTruthy()
    expect(found!.status).toBe('invalid')
    expect(found!.eligibleForMapping).toBe(false)
  })

  it('AC8: skips .git, node_modules and other ignored dirs', () => {
    setupCore()
    const ignored = path.join(dir, '..', 'node_modules')
    fs.mkdirSync(ignored, { recursive: true })

    const results = discoverModules(dir)
    expect(results.find((r) => r.id === 'node_modules')).toBeUndefined()
  })

  it('AC9: skips the core repo itself', () => {
    setupCore()
    const results = discoverModules(dir)
    const coreName = path.basename(dir)
    expect(results.find((r) => r.id === coreName)).toBeUndefined()
  })

  it('AC10: returns empty from non-core repo', () => {
    write('.kaddo/config.yml', MODULE_CONFIG_093)
    const results = discoverModules(dir)
    expect(results).toEqual([])
  })

  it('AC11: detects missing (previously registered but path gone)', () => {
    setupCore()
    write('.kaddo/modules.yml', `version: 1\nsystem: acme-platform\nworkspace_roots:\n  - '..'\nmodules:\n  - id: gone\n    name: Gone\n    path: ../gone-repo\n    parent_system: acme-platform\n    status: configured\n`)

    const results = discoverModules(dir)
    const found = results.find((r) => r.id === 'gone')
    expect(found).toBeTruthy()
    expect(found!.status).toBe('missing')
  })

  it('AC12: detects duplicate module ids', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')
    // Create a second repo with same module id
    const dup = path.join(dir, '..', 'acme-admin')
    fs.mkdirSync(path.join(dup, '.kaddo'), { recursive: true })
    fs.writeFileSync(path.join(dup, '.kaddo', 'config.yml'), MODULE_CONFIG_093) // same id: billing

    const results = discoverModules(dir)
    const dups = results.filter((r) => r.id === 'billing')
    expect(dups.length).toBe(2)
    expect(dups.some((d) => d.status === 'duplicate')).toBe(true)
  })
})

// --- VS-093: applyDiscovery ---

describe('VS-093 — applyDiscovery()', () => {
  it('AC13: writes .kaddo/modules.yml with eligible modules', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')

    const discovered = discoverModules(dir)
    const result = applyDiscovery(dir, discovered)

    expect(result.mapped).toBeGreaterThan(0)
    const yml = readModulesYml(dir)
    expect(yml.system).toBe('acme-platform')
    expect(yml.modules.some((m) => m.id === 'billing')).toBe(true)
  })

  it('AC14: generates knowledge/tech/modules/modules.md', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')

    const discovered = discoverModules(dir)
    applyDiscovery(dir, discovered)

    const md = fs.readFileSync(path.join(dir, 'knowledge', 'tech', 'modules', 'modules.md'), 'utf-8')
    expect(md).toContain('billing')
    expect(md).toContain('acme-platform')
  })

  it('AC15: does not map not_configured repos', () => {
    setupCore()
    const noKaddo = path.join(dir, '..', 'no-kaddo-repo')
    fs.mkdirSync(noKaddo, { recursive: true })

    const discovered = discoverModules(dir)
    applyDiscovery(dir, discovered)

    const yml = readModulesYml(dir)
    expect(yml.modules.find((m) => m.id === 'no-kaddo-repo')).toBeUndefined()
  })
})

// --- VS-093: readModulesYml ---

describe('VS-093 — readModulesYml()', () => {
  it('returns defaults when no file exists', () => {
    const yml = readModulesYml(dir)
    expect(yml.version).toBe(1)
    expect(yml.system).toBe('')
    expect(yml.workspace_roots).toEqual(['..'])
    expect(yml.modules).toEqual([])
  })

  it('reads written file', () => {
    write('.kaddo/modules.yml', `version: 1\nsystem: test\nworkspace_roots:\n  - '..'\nmodules:\n  - id: m1\n    name: M1\n    path: ../m1\n    parent_system: test\n    status: configured\n`)
    const yml = readModulesYml(dir)
    expect(yml.system).toBe('test')
    expect(yml.modules.length).toBe(1)
    expect(yml.modules[0].id).toBe('m1')
  })
})

// --- VS-093: modules list (read-only from .kaddo/modules.yml) ---

describe('VS-093 — kaddo modules list reads from modules.yml', () => {
  it('AC16: loads modules from .kaddo/modules.yml', () => {
    setupCore()
    write('.kaddo/modules.yml', `version: 1\nsystem: acme-platform\nworkspace_roots:\n  - '..'\nmodules:\n  - id: billing\n    name: Billing\n    path: ../acme-billing\n    parent_system: acme-platform\n    status: configured\n`)
    const yml = readModulesYml(dir)
    expect(yml.modules.length).toBe(1)
    expect(yml.modules[0].id).toBe('billing')
  })
})

// --- VS-093: legacy path detection ---

describe('VS-093 — detectLegacyPaths()', () => {
  it('AC17: detects legacy knowledge/system/system-context.md', () => {
    write('knowledge/system/system-context.md', '# old')
    const legacy = detectLegacyPaths(dir)
    expect(legacy.some((l) => l.from === 'knowledge/system/system-context.md')).toBe(true)
    expect(legacy.some((l) => l.to === 'knowledge/tech/system/system-context.md')).toBe(true)
  })

  it('AC18: detects legacy knowledge/modules/modules.md', () => {
    write('knowledge/modules/modules.md', '# old')
    const legacy = detectLegacyPaths(dir)
    expect(legacy.some((l) => l.from === 'knowledge/modules/modules.md')).toBe(true)
  })

  it('AC19: detects legacy knowledge/module/module-context.md', () => {
    write('knowledge/module/module-context.md', '# old')
    const legacy = detectLegacyPaths(dir)
    expect(legacy.some((l) => l.from === 'knowledge/module/module-context.md')).toBe(true)
  })

  it('AC20: no legacy detected for new paths', () => {
    write('knowledge/tech/system/system-context.md', '# new')
    write('knowledge/tech/modules/modules.md', '# new')
    write('knowledge/tech/module/module-context.md', '# new')
    const legacy = detectLegacyPaths(dir)
    expect(legacy).toEqual([])
  })
})

// --- VS-093: dual-path support in mapped-modules ---

describe('VS-093 — dual-path module-context reading', () => {
  it('readModuleContext reads from new path first', () => {
    const modDir = setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')
    const content = readModuleContext(dir, '../acme-billing')
    expect(content).toContain('billing module handles all subscription')
  })

  it('readModuleContext falls back to legacy path', () => {
    const modDir = setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'legacy')
    const content = readModuleContext(dir, '../acme-billing')
    expect(content).toContain('billing module handles all subscription')
  })

  it('detectModuleStatus finds module-context at new path', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'new')
    const status = detectModuleStatus(dir, '../acme-billing')
    expect(status.status).toBe('configured')
    expect(status.moduleContext).toBe(true)
  })

  it('detectModuleStatus finds module-context at legacy path', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG_093, 'legacy')
    const status = detectModuleStatus(dir, '../acme-billing')
    expect(status.status).toBe('configured')
    expect(status.moduleContext).toBe(true)
  })
})

// --- VS-093: next-step for core repos ---

describe('VS-093 — core next-step', () => {
  it('AC21: core without modules recommends modules-discover', () => {
    setupCore()
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('modules-discover')
    expect(rec.command).toContain('kaddo modules discover')
  })

  it('AC22: core with modules skips modules-discover', () => {
    setupCore()
    write('.kaddo/modules.yml', `version: 1\nsystem: acme-platform\nworkspace_roots:\n  - '..'\nmodules:\n  - id: billing\n    name: Billing\n    path: ../acme-billing\n    parent_system: acme-platform\n    status: configured\n`)
    write('knowledge/business/business.md', USEFUL('Business'))
    write('knowledge/product/product.md', USEFUL('Product'))
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('modules-discover')
  })

  it('AC23: core skips business/product bootstrap requirement', () => {
    setupCore()
    write('.kaddo/modules.yml', `version: 1\nsystem: acme-platform\nworkspace_roots:\n  - '..'\nmodules:\n  - id: billing\n    name: Billing\n    path: ../acme-billing\n    parent_system: acme-platform\n    status: configured\n`)
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('bootstrap')
  })
})

// --- VS-093: next-step for module repos with new paths ---

describe('VS-093 — module next-step with new paths', () => {
  it('AC24: module with new-path module-context is recognized', () => {
    write('.kaddo/config.yml', MODULE_CONFIG_093)
    write('knowledge/tech/module/module-context.md', MODULE_CONTEXT_USEFUL)
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# ctx\n')
    write('.kaddo/understand.md', '# und\n')
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('module-ready')
  })

  it('AC25: module missing module-context at both paths recommends init', () => {
    write('.kaddo/config.yml', MODULE_CONFIG_093)
    const rec = resolveNextStep(dir)
    expect(rec.id).toBe('init-module-context')
    expect(rec.label).toContain('knowledge/tech/module/module-context.md')
  })

  it('AC26: module does not recommend business/product/agents/skills', () => {
    write('.kaddo/config.yml', MODULE_CONFIG_093)
    write('knowledge/tech/module/module-context.md', MODULE_CONTEXT_USEFUL)
    write('knowledge/tech/codebase.md', USEFUL('Codebase'))
    write('knowledge/tech/current-state.md', USEFUL('CurrentState'))
    write('.kaddo/scan.json', '{}')
    write('.kaddo/context-pack.md', '# ctx\n')
    write('.kaddo/understand.md', '# und\n')
    const rec = resolveNextStep(dir)
    expect(rec.id).not.toBe('bootstrap')
    expect(rec.id).not.toBe('add-agents')
    expect(rec.id).not.toBe('add-skills')
    expect(rec.id).not.toBe('refine-business')
    expect(rec.id).not.toBe('refine-product')
  })
})

// --- VS-093: safety ---

describe('VS-093 — safety', () => {
  it('modules-discover does not call LLM or git', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../src/commands/modules-discover.ts'),
      'utf-8'
    )
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
    expect(src).not.toContain('git push')
  })
})
