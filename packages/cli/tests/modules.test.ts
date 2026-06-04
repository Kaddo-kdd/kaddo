import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { getModule, listModules, findWorkItemType } from '../src/modules/registry.js'

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kaddo-modules-'))
  mkdirSync(join(dir, '.kaddo'), { recursive: true })
  writeFileSync(
    join(dir, '.kaddo', 'config.yml'),
    'project: test\nversion: "1"\nmodules: []\n'
  )
  return dir
}

describe('module registry', () => {
  it('lists all 14 modules', () => {
    const mods = listModules()
    const names = mods.map((m) => m.name)
    expect(names).toContain('adr')
    expect(names).toContain('incident')
    expect(names).toContain('rfc')
    expect(names).toContain('migration')
    expect(names).toContain('legacy')
    expect(names).toContain('contracts')
    expect(names).toContain('capabilities')
    expect(names).toContain('guard-advanced')
    expect(names).toContain('agents')
    expect(names).toContain('skills')
    expect(names).toContain('standards')
    expect(names).toContain('security')
    expect(names).toContain('stack')
    expect(names).toContain('git-strategy')
    expect(mods.length).toBe(14)
  })

  it('getModule returns undefined for unknown module', () => {
    expect(getModule('unknown')).toBeUndefined()
  })

  it('getModule returns the correct module', () => {
    const mod = getModule('adr')
    expect(mod).toBeDefined()
    expect(mod!.name).toBe('adr')
    expect(mod!.configKey).toBe('module_adr')
    expect(mod!.workItemTypes.length).toBeGreaterThan(0)
  })

  it('findWorkItemType finds adr type', () => {
    const t = findWorkItemType('adr')
    expect(t).toBeDefined()
    expect(t!.name).toBe('adr')
    expect(t!.knowledgeLevel).toBe('K4')
  })

  it('findWorkItemType finds incident type', () => {
    const t = findWorkItemType('incident')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
  })

  it('findWorkItemType returns undefined for built-in types', () => {
    expect(findWorkItemType('feature')).toBeUndefined()
    expect(findWorkItemType('bugfix')).toBeUndefined()
  })

  it('findWorkItemType finds legacy type', () => {
    const t = findWorkItemType('legacy')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
    expect(t!.questions.length).toBe(3)
  })

  it('findWorkItemType finds migration type', () => {
    const t = findWorkItemType('migration')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K4')
    expect(t!.questions.length).toBe(4)
  })

  it('findWorkItemType finds rfc type', () => {
    const t = findWorkItemType('rfc')
    expect(t).toBeDefined()
    expect(t!.questions.length).toBe(3)
  })

  it('findWorkItemType finds contract type', () => {
    const t = findWorkItemType('contract')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K4')
    expect(t!.questions.length).toBe(4)
  })

  it('findWorkItemType finds capability type', () => {
    const t = findWorkItemType('capability')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
    expect(t!.questions.length).toBe(3)
  })

  it('findWorkItemType finds guard-rule type', () => {
    const t = findWorkItemType('guard-rule')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
    expect(t!.questions.length).toBe(3)
  })
})

describe('module structure', () => {
  it('each module has required fields', () => {
    // Doc-only modules (VS-017 global artifacts) ship templates, not work item types.
    const docOnly = new Set(['standards', 'security', 'stack', 'git-strategy'])
    for (const mod of listModules()) {
      expect(mod.name).toBeTruthy()
      expect(mod.configKey).toBeTruthy()
      expect(mod.dirs.length).toBeGreaterThan(0)
      if (!docOnly.has(mod.name)) {
        expect(mod.workItemTypes.length, mod.name).toBeGreaterThan(0)
      }
    }
  })

  it('each work item type has required questions', () => {
    for (const mod of listModules()) {
      for (const wit of mod.workItemTypes) {
        expect(wit.questions.length).toBeGreaterThan(0)
        expect(wit.qualityGate.length).toBeGreaterThan(0)
        for (const q of wit.questions) {
          expect(q.id).toBeTruthy()
          expect(q.prompt).toBeTruthy()
          expect(q.frontMatterField).toBeTruthy()
        }
      }
    }
  })

  it('adr module dirs include knowledge/decisions', () => {
    const mod = getModule('adr')!
    expect(mod.dirs).toContain('knowledge/decisions')
  })

  it('incident module dirs include knowledge/incidents', () => {
    const mod = getModule('incident')!
    expect(mod.dirs).toContain('knowledge/incidents')
  })

  it('contracts module dirs include knowledge/contracts', () => {
    const mod = getModule('contracts')!
    expect(mod.dirs).toContain('knowledge/contracts')
  })

  it('capabilities module dirs include knowledge/capabilities', () => {
    const mod = getModule('capabilities')!
    expect(mod.dirs).toContain('knowledge/capabilities')
  })

  it('guard-advanced module creates rules.yml with content', () => {
    const mod = getModule('guard-advanced')!
    const rulesFile = mod.files.find((f) => f.path.endsWith('rules.yml'))
    expect(rulesFile).toBeDefined()
    expect(rulesFile!.content).toContain('ci_block_on_critical')
  })

  it('agents module includes README.md file', () => {
    const mod = getModule('agents')!
    const readme = mod.files.find((f) => f.path.endsWith('README.md'))
    expect(readme).toBeDefined()
    expect(readme!.content).toContain('agent')
  })

  it('skills module includes README.md file', () => {
    const mod = getModule('skills')!
    const readme = mod.files.find((f) => f.path.endsWith('README.md'))
    expect(readme).toBeDefined()
    expect(readme!.content).toContain('skill')
  })

  it('findWorkItemType finds agent type', () => {
    const t = findWorkItemType('agent')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
    expect(t!.questions.length).toBe(3)
  })

  it('findWorkItemType finds skill type', () => {
    const t = findWorkItemType('skill')
    expect(t).toBeDefined()
    expect(t!.knowledgeLevel).toBe('K3')
    expect(t!.questions.length).toBe(3)
  })
})

describe('module installation logic', () => {
  let dir: string

  beforeEach(() => {
    dir = makeProject()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('module dirs are created when installed manually', () => {
    const mod = getModule('adr')!
    for (const d of mod.dirs) {
      mkdirSync(join(dir, d), { recursive: true })
    }
    expect(existsSync(join(dir, 'knowledge', 'decisions'))).toBe(true)
  })

  it('config key naming convention starts with module_', () => {
    for (const mod of listModules()) {
      expect(mod.configKey).toMatch(/^module_/)
    }
  })

  it('config can be parsed and module marked installed', () => {
    const configPath = join(dir, '.kaddo', 'config.yml')
    const raw = readFileSync(configPath, 'utf8')
    const config = parseYaml(raw) as Record<string, unknown>
    config['module_rfc'] = { installed: true, installed_at: '2026-05-31' }
    const modules = (config.modules as string[] | undefined) ?? []
    if (!modules.includes('rfc')) modules.push('rfc')
    config.modules = modules

    writeFileSync(configPath, stringifyYaml(config))
    const updated = parseYaml(readFileSync(configPath, 'utf8')) as Record<string, unknown>
    const rfcConfig = updated['module_rfc'] as { installed?: boolean }
    expect(rfcConfig?.installed).toBe(true)
    expect((updated.modules as string[])).toContain('rfc')
  })
})
