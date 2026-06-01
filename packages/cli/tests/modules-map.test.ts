import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parse as parseYaml } from 'yaml'
import { mapModule, readModulesDescriptor, slugify } from '../src/commands/modules-map.js'

let dir: string

function initProject() {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), 'version: 1\nproject:\n  name: demo\n')
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-modules-map-'))
  initProject()
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('slugify', () => {
  it('produces a safe id', () => {
    expect(slugify('Frontend Web')).toBe('frontend-web')
    expect(slugify('  Backend API!  ')).toBe('backend-api')
  })
})

describe('mapModule — descriptor', () => {
  it('creates .kaddo/modules.yml with the module entry', () => {
    mapModule(dir, { name: 'Frontend', repoPath: '../frontend', type: 'frontend' })
    const raw = fs.readFileSync(path.join(dir, '.kaddo', 'modules.yml'), 'utf8')
    const parsed = parseYaml(raw) as { version: number; modules: { id: string; type: string; code: string[] }[] }
    expect(parsed.version).toBe(1)
    expect(parsed.modules).toHaveLength(1)
    expect(parsed.modules[0].id).toBe('frontend')
    expect(parsed.modules[0].type).toBe('frontend')
    expect(parsed.modules[0].code).toContain('../frontend/**')
  })

  it('appends a second module and updates an existing one in place', () => {
    mapModule(dir, { name: 'Frontend', repoPath: '../frontend', type: 'frontend' })
    mapModule(dir, { name: 'Backend', repoPath: '../backend', type: 'backend' })
    let d = readModulesDescriptor(dir)
    expect(d.modules.map((m) => m.id).sort()).toEqual(['backend', 'frontend'])

    // re-map frontend with a new technology — should update, not duplicate
    const res = mapModule(dir, { name: 'Frontend', repoPath: '../frontend', type: 'frontend', mainTechnology: 'Next.js' })
    expect(res.alreadyRegistered).toBe(true)
    d = readModulesDescriptor(dir)
    expect(d.modules).toHaveLength(2)
    expect(d.modules.find((m) => m.id === 'frontend')?.mainTechnology).toBe('Next.js')
  })
})

describe('mapModule — structure generation', () => {
  it('creates module-design, stack, security, standards and diagrams/adrs dirs', () => {
    mapModule(dir, { name: 'Frontend', repoPath: '../frontend', type: 'frontend' })
    const base = path.join(dir, 'architecture', 'modules', 'frontend')
    expect(fs.existsSync(path.join(base, 'module-design.md'))).toBe(true)
    expect(fs.existsSync(path.join(base, 'stack.md'))).toBe(true)
    expect(fs.existsSync(path.join(base, 'security.md'))).toBe(true)
    expect(fs.existsSync(path.join(base, 'standards.md'))).toBe(true)
    expect(fs.existsSync(path.join(base, 'diagrams', '.gitkeep'))).toBe(true)
    expect(fs.existsSync(path.join(base, 'adrs', '.gitkeep'))).toBe(true)
  })

  it('module-design references type, repo path and technology', () => {
    mapModule(dir, { name: 'Backend', repoPath: '../backend', type: 'backend', mainTechnology: 'NestJS' })
    const design = fs.readFileSync(
      path.join(dir, 'architecture', 'modules', 'backend', 'module-design.md'),
      'utf8'
    )
    expect(design).toContain('Backend — Design')
    expect(design).toContain('../backend')
    expect(design).toContain('NestJS')
  })

  it('does not overwrite an existing module artifact', () => {
    const base = path.join(dir, 'architecture', 'modules', 'frontend')
    fs.mkdirSync(base, { recursive: true })
    fs.writeFileSync(path.join(base, 'module-design.md'), 'CUSTOM EDIT')

    const res = mapModule(dir, { name: 'Frontend', repoPath: '../frontend', type: 'frontend' })
    expect(fs.readFileSync(path.join(base, 'module-design.md'), 'utf8')).toBe('CUSTOM EDIT')
    expect(res.skipped).toContain('architecture/modules/frontend/module-design.md')
    // other files still created
    expect(res.written).toContain('architecture/modules/frontend/stack.md')
  })

  it('works with manual input even without a scan', () => {
    expect(fs.existsSync(path.join(dir, '.kaddo', 'scan.json'))).toBe(false)
    const res = mapModule(dir, { name: 'Infra', repoPath: '../infra', type: 'infrastructure' })
    expect(res.module.id).toBe('infra')
    expect(res.written.length).toBeGreaterThan(0)
  })
})
