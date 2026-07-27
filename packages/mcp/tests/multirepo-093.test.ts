import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { write, cleanup } from './helpers.js'
import { modulesListTool, modulesDiscoverTool, exportCapsuleTool } from '../src/multirepo.js'
import { assertMcpDerivedWritePath } from '../src/project.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let container: string
let root: string

beforeEach(() => {
  container = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mcp093-'))
  root = path.join(container, 'core')
  fs.mkdirSync(root, { recursive: true })
})

afterEach(() => {
  fs.rmSync(container, { recursive: true, force: true })
})

function coreConfig(wsRoot = '..') {
  return `version: 1
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
    - '${wsRoot}'
`
}

const MODULE_CONFIG = `version: 1
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

const MODULE_CONTEXT_USEFUL = `---
type: module-context
scope: module
module_id: billing
parent_system: acme-platform
---

# Module Context

## Module identity

The billing module handles all subscription management and payment processing.

## Responsibility

Owns the full lifecycle of subscriptions.
`

const MODULES_YML_CONTENT = `version: 1
system: acme-platform
workspace_roots:
  - '..'
modules:
  - id: billing
    name: Billing
    path: ../acme-billing
    parent_system: acme-platform
    status: configured
`

function setupCore() {
  write(root, '.kaddo/config.yml', coreConfig())
}

function setupModuleRepo(name: string, config: string, mcPath: 'new' | 'legacy' | 'none' = 'none') {
  const modDir = path.join(container, name)
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
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'current-state.md'), '---\ntype: x\n---\n\n## CS\n\nFastify + PostgreSQL.\n')
  fs.writeFileSync(path.join(modDir, 'knowledge', 'tech', 'codebase.md'), '---\ntype: x\n---\n\n## CB\n\nTypeScript monolith.\n')
  return modDir
}


// --- VS-093: kaddo_modules_discover MCP tool ---

describe('VS-093 — kaddo_modules_discover', () => {
  it('AC1: discovers configured modules', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG, 'new')

    const result = modulesDiscoverTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    const discovered = data.discovered as Array<Record<string, unknown>>
    const billing = discovered.find((d) => d.id === 'billing')
    expect(billing).toBeTruthy()
    expect(billing!.status).toBe('configured')
    expect(billing!.eligibleForMapping).toBe(true)
    expect(data.applied).toBe(false)
  })

  it('AC2: discovers not_configured repos', () => {
    setupCore()
    const noKaddo = path.join(container, 'no-kaddo-repo')
    fs.mkdirSync(noKaddo, { recursive: true })

    const result = modulesDiscoverTool(root, {})
    const data = result.data as Record<string, unknown>
    const discovered = data.discovered as Array<Record<string, unknown>>
    const found = discovered.find((d) => d.id === 'no-kaddo-repo')
    expect(found).toBeTruthy()
    expect(found!.status).toBe('not_configured')
  })

  it('AC3: discovers foreign_system modules', () => {
    setupCore()
    setupModuleRepo('other-svc', FOREIGN_CONFIG, 'new')

    const result = modulesDiscoverTool(root, {})
    const data = result.data as Record<string, unknown>
    const discovered = data.discovered as Array<Record<string, unknown>>
    const found = discovered.find((d) => d.id === 'other-svc')
    expect(found).toBeTruthy()
    expect(found!.status).toBe('foreign_system')
  })

  it('AC4: apply without confirm returns message', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG, 'new')

    const result = modulesDiscoverTool(root, { apply: true })
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.applied).toBe(false)
    expect(data.message).toContain('confirm')
  })

  it('AC5: apply with confirm persists modules.yml', () => {
    setupCore()
    setupModuleRepo('acme-billing', MODULE_CONFIG, 'new')

    const result = modulesDiscoverTool(root, { apply: true, confirm: true })
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.applied).toBe(true)

    const ymlPath = path.join(root, '.kaddo', 'modules.yml')
    expect(fs.existsSync(ymlPath)).toBe(true)
    const content = fs.readFileSync(ymlPath, 'utf-8')
    expect(content).toContain('billing')
  })

  it('AC6: fails from non-core repo', () => {
    root = path.join(container, 'module-proj')
    fs.mkdirSync(root, { recursive: true })
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    const result = modulesDiscoverTool(root, {})
    expect(result.ok).toBe(false)
  })

  it('AC7: fails without kaddo config', () => {
    root = path.join(container, 'module-proj')
    fs.mkdirSync(root, { recursive: true })
    const result = modulesDiscoverTool(root, {})
    expect(result.ok).toBe(false)
  })
})

// --- VS-093: modulesListTool with path field ---

describe('VS-093 — modulesListTool with path field', () => {
  it('AC8: reads modules with path field from modules.yml', () => {
    setupCore()
    write(root, '.kaddo/modules.yml', MODULES_YML_CONTENT)
    setupModuleRepo('acme-billing', MODULE_CONFIG, 'new')

    const result = modulesListTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    const modules = data.modules as Array<Record<string, unknown>>
    const billing = modules.find((m) => m.id === 'billing')
    expect(billing).toBeTruthy()
    expect(billing!.status).toBe('configured')
  })
})

// --- VS-093: exportCapsuleTool with new paths ---

describe('VS-093 — exportCapsuleTool reads new module-context path', () => {
  it('AC9: exports capsule reading from new path', () => {
    root = path.join(container, 'module-proj')
    fs.mkdirSync(root, { recursive: true })
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    write(root, 'knowledge/tech/module/module-context.md', MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.type).toBe('module')
    expect(data.exported).toBe(true)
  })

  it('AC10: exports capsule reading from legacy path', () => {
    root = path.join(container, 'module-proj')
    fs.mkdirSync(root, { recursive: true })
    write(root, '.kaddo/config.yml', MODULE_CONFIG)
    write(root, 'knowledge/module/module-context.md', MODULE_CONTEXT_USEFUL)

    const result = exportCapsuleTool(root, {})
    expect(result.ok).toBe(true)
    const data = result.data as Record<string, unknown>
    expect(data.type).toBe('module')
  })
})

// --- VS-093: .kaddo/modules.yml in DERIVED_WRITE_FILES ---

describe('VS-093 — modules.yml write safety', () => {
  it('AC11: .kaddo/modules.yml is an allowed derived write path', () => {
    expect(() => assertMcpDerivedWritePath('.kaddo/modules.yml')).not.toThrow()
  })

  it('AC12: other .kaddo paths remain blocked', () => {
    expect(() => assertMcpDerivedWritePath('.kaddo/config.yml')).toThrow()
  })
})

// --- VS-093: safety ---

describe('VS-093 — MCP safety', () => {
  it('multirepo.ts does not call LLM, git, or deploy', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/multirepo.ts'), 'utf-8')
    expect(src).not.toContain('execSync')
    expect(src).not.toContain('child_process')
    expect(src).not.toContain('openai')
    expect(src).not.toContain('anthropic')
    expect(src).not.toContain('git commit')
    expect(src).not.toContain('git push')
    expect(src).not.toContain('deploy')
  })
})
