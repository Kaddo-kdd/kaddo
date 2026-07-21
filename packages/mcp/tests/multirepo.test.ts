import { describe, it, expect, afterEach } from 'vitest'
import { makeProject, write, cleanup } from './helpers.js'
import {
  modulesListTool,
  getModuleContextTool,
  validateWorkItemModulesTool,
  getWorkItemContextTool,
  suggestBranchStrategyTool,
  exportCapsuleTool,
} from '../src/multirepo.js'
import fs from 'node:fs'
import path from 'node:path'

let root: string
afterEach(() => root && cleanup(root))

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

const MODULE_CONTEXT_USEFUL = `---
type: module-context
scope: module
module_id: loyalty
parent_system: dotear-platform
---

# Module Context

## Module identity

The loyalty module manages the points program for dotear-platform.

## Responsibility

Owns the full lifecycle of loyalty points.
`

const MODULE_CONTEXT_PLACEHOLDER = `---
type: module-context
scope: module
module_id: loyalty
---

# Module Context

## Module identity

_Describe the module name._

## Responsibility

_Describe what this module owns._
`

const MODULES_YML = `version: 1
modules:
  - id: loyalty
    name: Loyalty
    repoPath: ../dotear-loyalty
    type: backend
    owner: loyalty-team
    capabilities:
      - points
    code:
      - ../dotear-loyalty/**
  - id: admin
    name: Admin
    repoPath: ../dotear-admin
    type: frontend
    owner: admin-team
    capabilities: []
    code:
      - ../dotear-admin/**
`

function setupCore() {
  root = makeProject()
  write(root, '.kaddo/config.yml', CORE_CONFIG)
  write(root, '.kaddo/modules.yml', MODULES_YML)
}

function setupModuleRepo(modName: string, configContent: string, mcContent?: string) {
  const modDir = path.join(root, '..', modName)
  fs.mkdirSync(path.join(modDir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(modDir, '.kaddo', 'config.yml'), configContent)
  if (mcContent) {
    fs.mkdirSync(path.join(modDir, 'knowledge', 'module'), { recursive: true })
    fs.writeFileSync(path.join(modDir, 'knowledge', 'module', 'module-context.md'), mcContent)
  }
  fs.mkdirSync(path.join(modDir, 'knowledge', 'tech'), { recursive: true })
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'current-state.md'), '---\ntype: x\n---\n\n## CS\n\nFastify + PostgreSQL.\n')
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'codebase.md'), '---\ntype: x\n---\n\n## CB\n\nTypeScript monolith.\n')
  return modDir
}

function cleanupModule(modName: string) {
  const modDir = path.join(root, '..', modName)
  if (fs.existsSync(modDir)) fs.rmSync(modDir, { recursive: true, force: true })
}

function setupWI(id: string, extra: string = '') {
  write(root, `knowledge/delivery/work-items/ready/${id}.md`, [
    '---',
    `id: ${id}`,
    'type: feature',
    `title: Ajustar cálculo de puntos`,
    'status: ready',
    'knowledge_level: K2',
    extra,
    '---',
    `# ${id}`,
    '',
    '## Acceptance criteria',
    '',
    '- [ ] Points calculated correctly.',
    '',
    '## Out of scope',
    '',
    '- Tier changes.',
  ].join('\n'))
}

describe('VS-092 — kaddo_modules_list', () => {
  it('AC1-AC4: returns configured and not_configured modules', () => {
    setupCore()
    const modDir = setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)
    // admin has no kaddo init
    const adminDir = path.join(root, '..', 'dotear-admin')
    fs.mkdirSync(adminDir, { recursive: true })

    const result = modulesListTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const modules = (data?.modules as Array<Record<string, unknown>>) ?? []
    const loyalty = modules.find((m) => m.id === 'loyalty')
    const admin = modules.find((m) => m.id === 'admin')

    expect(loyalty?.status).toBe('configured')
    expect(admin?.status).toBe('not_configured')
    expect((data?.project as Record<string, unknown>)?.role).toBe('core')

    cleanupModule('dotear-loyalty')
    cleanupModule('dotear-admin')
  })

  it('AC5: does not modify files', () => {
    setupCore()
    const before = fs.readdirSync(path.join(root, '.kaddo')).sort()
    modulesListTool(root, {})
    const after = fs.readdirSync(path.join(root, '.kaddo')).sort()
    expect(after).toEqual(before)
  })

  it('fails from non-core repo', () => {
    root = makeProject()
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    const result = modulesListTool(root, {})
    expect(result.ok).toBe(false)
  })
})

describe('VS-092 — kaddo_get_module_context', () => {
  it('AC6-AC10: returns module context for configured module', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)

    const result = getModuleContextTool(root, { module: 'loyalty', includeTech: true, includeWarnings: true })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect((data?.module as Record<string, unknown>)?.status).toBe('configured')
    const ctx = data?.context as Record<string, unknown>
    expect(ctx?.moduleContext).toContain('loyalty module manages')
    expect(ctx?.currentStateSummary).toBeTruthy()
    expect(ctx?.codebaseSummary).toBeTruthy()

    cleanupModule('dotear-loyalty')
  })

  it('AC11: warns for not configured module', () => {
    setupCore()
    const adminDir = path.join(root, '..', 'dotear-admin')
    fs.mkdirSync(adminDir, { recursive: true })

    const result = getModuleContextTool(root, { module: 'admin', includeWarnings: true })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect(data?.context).toBeNull()
    expect((data?.warnings as string[])?.length).toBeGreaterThan(0)

    cleanupModule('dotear-admin')
  })

  it('AC12: detects placeholder context', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_PLACEHOLDER)

    const result = getModuleContextTool(root, { module: 'loyalty', includeWarnings: true })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect((data?.warnings as string[])).toContain('module-context.md still contains placeholder sections.')

    cleanupModule('dotear-loyalty')
  })
})

describe('VS-092 — kaddo_validate_work_item_modules', () => {
  it('AC13-AC18: validates affected_modules', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)
    setupWI('WI-014', [
      'affected_modules:',
      '  - loyalty',
      '  - billing',
      'code:',
      '  - repo: dotear-loyalty',
      '    paths:',
      '      - src/points/calculatePoints.ts',
    ].join('\n'))

    const result = validateWorkItemModulesTool(root, { workItemId: 'WI-014' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const validation = data?.validation as Record<string, unknown>
    expect(validation?.valid).toBe(false) // billing not in modules.yml
    expect((validation?.errors as string[])?.some((e) => e.includes('billing'))).toBe(true)

    cleanupModule('dotear-loyalty')
  })

  it('AC15: warns for empty affected_modules', () => {
    setupCore()
    setupWI('WI-015')

    const result = validateWorkItemModulesTool(root, { workItemId: 'WI-015' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const validation = data?.validation as Record<string, unknown>
    expect((validation?.warnings as string[])).toContain('Work Item has no affected_modules declared.')
  })

  it('AC20: warns when code.repo not in affected_modules', () => {
    setupCore()
    setupWI('WI-016', [
      'affected_modules:',
      '  - loyalty',
      'code:',
      '  - repo: dotear-admin',
      '    paths:',
      '      - src/dashboard.ts',
    ].join('\n'))

    const result = validateWorkItemModulesTool(root, { workItemId: 'WI-016' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const validation = data?.validation as Record<string, unknown>
    expect((validation?.warnings as string[])?.some((w) => w.includes('dotear-admin'))).toBe(true)
  })
})

describe('VS-092 — kaddo_get_work_item_context', () => {
  it('AC21-AC27: includes affected module contexts and branch strategy', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)
    setupWI('WI-014', [
      'affected_modules:',
      '  - loyalty',
      'code:',
      '  - repo: dotear-loyalty',
      '    paths:',
      '      - src/points/calculatePoints.ts',
    ].join('\n'))

    const result = getWorkItemContextTool(root, { workItemId: 'WI-014', includeBranchStrategy: true, includeGuardExpectations: true })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const modules = data?.modules as Array<Record<string, unknown>>
    expect(modules?.length).toBe(1)
    expect(modules?.[0]?.id).toBe('loyalty')
    expect(modules?.[0]?.moduleContext).toContain('loyalty module manages')
    expect(data?.branchStrategy).toBeTruthy()
    expect(data?.guardExpectations).toBeTruthy()

    cleanupModule('dotear-loyalty')
  })

  it('AC24: excludes unrelated modules', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)
    setupWI('WI-017', [
      'affected_modules:',
      '  - loyalty',
    ].join('\n'))

    const result = getWorkItemContextTool(root, { workItemId: 'WI-017' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const modules = data?.modules as Array<Record<string, unknown>>
    expect(modules?.length).toBe(1)
    expect(modules?.every((m) => m.id === 'loyalty')).toBe(true)

    cleanupModule('dotear-loyalty')
  })
})

describe('VS-092 — kaddo_suggest_branch_strategy', () => {
  it('AC29-AC34: returns multi-repo branch strategy', () => {
    setupCore()
    setupWI('WI-014', [
      'affected_modules:',
      '  - loyalty',
      '  - admin',
    ].join('\n'))

    const result = suggestBranchStrategyTool(root, { workItemId: 'WI-014' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const strategy = data?.strategy as Record<string, unknown>
    expect(strategy?.type).toBe('multi-repo')
    const branches = strategy?.branches as Record<string, unknown>
    expect(branches?.core).toContain('wi-014')
    expect(Object.keys(branches?.modules as Record<string, unknown>).length).toBe(2)
    expect(strategy?.commitMessages).toBeTruthy()
    expect((strategy?.checklist as string[])?.length).toBeGreaterThan(0)
    expect((data?.safety as Record<string, unknown>)?.gitCommandsExecuted).toBe(false)
  })

  it('AC41: does not execute git', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/multirepo.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('git commit')
    expect(src).not.toContain('git push')
    expect(src).not.toContain('git branch')
  })
})

describe('VS-092 — kaddo_export_capsule', () => {
  it('AC36: exports system capsule from core', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, { scope: 'system' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect(data?.exported).toBe(true)
    expect(data?.type).toBe('system')
    const paths = data?.paths as Record<string, string>
    expect(fs.existsSync(path.join(root, paths?.json))).toBe(true)
    expect(fs.existsSync(path.join(root, paths?.md))).toBe(true)

    cleanupModule('dotear-loyalty')
  })

  it('AC37: exports module capsule from core with module id', () => {
    setupCore()
    setupModuleRepo('dotear-loyalty', MODULE_CONFIG, MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, { module: 'loyalty' })
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect(data?.type).toBe('module')

    cleanupModule('dotear-loyalty')
  })

  it('AC38: exports module capsule from module repo', () => {
    root = makeProject()
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    write(root, 'knowledge/module/module-context.md', MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect(data?.type).toBe('module')
    expect(data?.exported).toBe(true)
  })

  it('AC39: returns path of generated capsule', () => {
    root = makeProject()
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    write(root, 'knowledge/module/module-context.md', MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    const paths = data?.paths as Record<string, string>
    expect(paths?.json).toContain('.capsule.json')
    expect(paths?.md).toContain('.capsule.md')
  })

  it('AC40: warns for incomplete module context', () => {
    root = makeProject()
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    write(root, 'knowledge/module/module-context.md', MODULE_CONTEXT_PLACEHOLDER)

    const result = exportCapsuleTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.ok ? result.data as Record<string, unknown> : null
    expect((data?.warnings as string[])?.some((w) => w.includes('placeholder'))).toBe(true)
  })

  it('errors for missing module', () => {
    setupCore()
    const result = exportCapsuleTool(root, { module: 'nonexistent' })
    expect(result.ok).toBe(false)
  })
})

describe('VS-092 — safety', () => {
  it('AC41-AC44: no git, no deploy, no LLM in multirepo.ts', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/multirepo.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
    expect(src).not.toContain('fetch(')
    expect(src).not.toContain('git commit')
    expect(src).not.toContain('git push')
    expect(src).not.toContain('deploy')
    expect(src).not.toContain('npm install')
  })
})
