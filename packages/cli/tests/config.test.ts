import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  loadConfig,
  ConfigError,
  nextStepsForState,
  createGuidanceForState,
  describeProject,
} from '../src/core/config.js'

let tmpDir: string

function writeConfig(content: string) {
  const full = path.join(tmpDir, '.kaddo', 'config.yml')
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-config-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('config — loadConfig', () => {
  it('loads a valid config', () => {
    writeConfig(
      [
        'version: 1',
        'project:',
        '  name: "demo"',
        '  state: legacy',
        '  structure: multirepo',
        'team:',
        '  size: enterprise',
      ].join('\n')
    )

    const config = loadConfig(tmpDir)
    expect(config).not.toBeNull()
    expect(config!.project.name).toBe('demo')
    expect(config!.project.state).toBe('legacy')
    expect(config!.project.structure).toBe('multirepo')
    expect(config!.team.size).toBe('enterprise')
  })

  it('returns null when config is missing', () => {
    expect(loadConfig(tmpDir)).toBeNull()
  })

  it('throws a clear ConfigError on invalid YAML', () => {
    writeConfig('project: [unclosed')
    expect(() => loadConfig(tmpDir)).toThrow(ConfigError)
    expect(() => loadConfig(tmpDir)).toThrow(/parse/i)
  })

  it('throws a validation error for an invalid project state', () => {
    writeConfig(['project:', '  name: "x"', '  state: ancient', 'team:', '  size: indie'].join('\n'))
    try {
      loadConfig(tmpDir)
      throw new Error('expected ConfigError')
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError)
      expect((err as Error).message).toContain('project.state')
      expect((err as Error).message).toContain('new, pre-ai, legacy')
    }
  })

  it('applies safe defaults for a backward-compatible config with missing fields', () => {
    writeConfig(['project:', '  name: "old"'].join('\n'))
    const config = loadConfig(tmpDir)
    expect(config!.project.state).toBe('pre-ai')
    expect(config!.project.structure).toBe('monorepo')
    expect(config!.team.size).toBe('indie')
  })

  it('preserves unknown keys (passthrough)', () => {
    writeConfig(['project:', '  name: "x"', 'knowledge:', '  default_level: K2'].join('\n'))
    const config = loadConfig(tmpDir) as Record<string, unknown>
    expect(config.knowledge).toEqual({ default_level: 'K2' })
  })
})

describe('config — state-aware helpers', () => {
  it('returns different next steps per state', () => {
    const states = ['new', 'pre-ai', 'legacy'] as const
    const outputs = states.map((s) => nextStepsForState(s))
    expect(new Set(outputs).size).toBe(3)
    expect(nextStepsForState('legacy')).toMatch(/risk/i)
    expect(nextStepsForState('pre-ai')).toMatch(/context pack/i)
    expect(nextStepsForState('new')).toMatch(/roadmap/i)
  })

  it('returns different create guidance per state', () => {
    const states = ['new', 'pre-ai', 'legacy'] as const
    const outputs = states.map((s) => createGuidanceForState(s))
    expect(new Set(outputs).size).toBe(3)
    expect(createGuidanceForState('legacy')).toMatch(/low-risk/i)
  })

  it('describes the project in human-readable form', () => {
    writeConfig(['project:', '  name: "x"', '  state: pre-ai', '  structure: monorepo'].join('\n'))
    const config = loadConfig(tmpDir)!
    expect(describeProject(config)).toBe('pre-AI monorepo')
  })
})
