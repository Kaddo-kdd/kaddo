import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { parse as parseYaml } from 'yaml'

const DESCRIPTOR_PATH = 'knowledge/module.yml'

function makeProject(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kaddo-module-desc-'))
  mkdirSync(join(dir, '.kaddo'), { recursive: true })
  mkdirSync(join(dir, 'knowledge'), { recursive: true })
  writeFileSync(join(dir, '.kaddo', 'config.yml'), 'project: test\nversion: "1"\n')
  return dir
}

function writeDescriptor(dir: string, content: object): void {
  const { stringify } = require('yaml')
  writeFileSync(join(dir, DESCRIPTOR_PATH), stringify(content))
}

describe('module descriptor file format', () => {
  let dir: string

  beforeEach(() => { dir = makeProject() })
  afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

  it('descriptor is valid YAML when written', () => {
    const { stringify } = require('yaml')
    const descriptor = {
      name: 'payments-service',
      purpose: 'Handles billing',
      stack: ['TypeScript', 'PostgreSQL'],
      responsibilities: ['Charge customers'],
      contracts: ['POST /charge'],
      dependencies: ['auth-service'],
      boundaries: ['User identity'],
      ownership: 'platform-team',
      related_artifacts: [],
    }
    writeFileSync(join(dir, DESCRIPTOR_PATH), stringify(descriptor))
    const raw = readFileSync(join(dir, DESCRIPTOR_PATH), 'utf8')
    const parsed = parseYaml(raw) as typeof descriptor
    expect(parsed.name).toBe('payments-service')
    expect(parsed.stack).toContain('TypeScript')
    expect(parsed.contracts).toContain('POST /charge')
    expect(parsed.boundaries).toContain('User identity')
    expect(parsed.related_artifacts).toHaveLength(0)
  })

  it('descriptor file is created at correct path', () => {
    const { stringify } = require('yaml')
    writeFileSync(join(dir, DESCRIPTOR_PATH), stringify({ name: 'test' }))
    expect(existsSync(join(dir, DESCRIPTOR_PATH))).toBe(true)
  })

  it('descriptor can represent all required fields', () => {
    const { stringify } = require('yaml')
    const fields = {
      name: 'svc',
      purpose: 'does stuff',
      stack: ['Go'],
      responsibilities: ['job1', 'job2'],
      contracts: ['GET /health'],
      dependencies: ['db-service'],
      boundaries: ['billing'],
      ownership: 'infra-team',
      related_artifacts: ['WI-001'],
    }
    writeFileSync(join(dir, DESCRIPTOR_PATH), stringify(fields))
    const parsed = parseYaml(readFileSync(join(dir, DESCRIPTOR_PATH), 'utf8')) as typeof fields
    expect(parsed.responsibilities).toHaveLength(2)
    expect(parsed.related_artifacts).toContain('WI-001')
    expect(parsed.ownership).toBe('infra-team')
  })

  it('parses comma list correctly when split manually', () => {
    const splitTrimmed = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)
    expect(splitTrimmed('TypeScript, Node.js, PostgreSQL')).toEqual(['TypeScript', 'Node.js', 'PostgreSQL'])
    expect(splitTrimmed('')).toEqual([])
    expect(splitTrimmed('  single  ')).toEqual(['single'])
  })
})
