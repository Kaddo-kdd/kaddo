import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { loadConfig, projectLanguage, languageLabel } from '../src/core/config.js'
import { bootstrap } from '../src/commands/bootstrap.js'
import { AGENT_PROMPTS } from '../src/agents/prompts.js'

let tmp: string

function writeConfig(extra: string) {
  const full = path.join(tmp, '.kaddo', 'config.yml')
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(
    full,
    `version: 1\nproject:\n  name: demo\n  state: new\n  structure: monorepo\n${extra}team:\n  size: small\n`
  )
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-lang-'))
})
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
})

describe('project language config (VS-051)', () => {
  it('AC2/default: missing language defaults to en', () => {
    writeConfig('')
    const cfg = loadConfig(tmp)!
    expect(projectLanguage(cfg)).toBe('en')
    expect(languageLabel(projectLanguage(cfg))).toBe('English')
  })

  it('AC2: stores and reads project.language: es', () => {
    writeConfig('  language: es\n')
    const cfg = loadConfig(tmp)!
    expect(projectLanguage(cfg)).toBe('es')
    expect(languageLabel('es')).toBe('Spanish')
  })

  it('rejects an invalid language', () => {
    writeConfig('  language: fr\n')
    expect(() => loadConfig(tmp)).toThrow(/project.language must be one of/)
  })

  it('AC3/AC8: bootstrap writes es directive but keeps stable file names', () => {
    writeConfig('  language: es\n')
    const res = bootstrap(tmp)
    expect(res.written).toEqual([
      'knowledge/business/business.md',
      'knowledge/product/product.md',
      'knowledge/tech/codebase.md',
    ])
    const business = fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf8')
    expect(business).toContain('Idioma del proyecto')
    // front matter stays first (directive inserted after it)
    expect(business.startsWith('---')).toBe(true)
  })

  it('bootstrap leaves English projects untouched (no directive)', () => {
    writeConfig('  language: en\n')
    bootstrap(tmp)
    const business = fs.readFileSync(path.join(tmp, 'knowledge/business/business.md'), 'utf8')
    expect(business).not.toContain('Idioma del proyecto')
  })

  it('AC7: every agent prompt carries the project-language rule', () => {
    for (const p of AGENT_PROMPTS) {
      expect(p.content, p.fileName).toContain('## Project Language')
      expect(p.content, p.fileName).toMatch(/Do not translate: code, file names/)
    }
  })
})
