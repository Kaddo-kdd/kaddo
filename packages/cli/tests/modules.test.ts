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
  it('lists all 5 modules', () => {
    const mods = listModules()
    const names = mods.map((m) => m.name)
    expect(names).toContain('adr')
    expect(names).toContain('incident')
    expect(names).toContain('rfc')
    expect(names).toContain('migration')
    expect(names).toContain('legacy')
    expect(mods.length).toBe(5)
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
})

describe('module structure', () => {
  it('each module has required fields', () => {
    for (const mod of listModules()) {
      expect(mod.name).toBeTruthy()
      expect(mod.configKey).toBeTruthy()
      expect(mod.dirs.length).toBeGreaterThan(0)
      expect(mod.workItemTypes.length).toBeGreaterThan(0)
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

  it('adr module dirs include architecture/decisions', () => {
    const mod = getModule('adr')!
    expect(mod.dirs).toContain('architecture/decisions')
  })

  it('incident module dirs include architecture/incidents', () => {
    const mod = getModule('incident')!
    expect(mod.dirs).toContain('architecture/incidents')
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
    expect(existsSync(join(dir, 'architecture', 'decisions'))).toBe(true)
  })

  it('config key naming convention is module_<name>', () => {
    for (const mod of listModules()) {
      expect(mod.configKey).toBe(`module_${mod.name}`)
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
