import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { assetStatus, canonicalAgents, canonicalSkills, installedAssetsSummary } from '../src/core/assets.js'
import { KADDO_VERSION } from '../src/core/version.js'

let dir: string
function config() {
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo/config.yml'), 'version: 1\nproject:\n  name: d\n  state: pre-ai\n  structure: monorepo\n  language: en\nteam:\n  size: small\n')
}
function installAgent(name: string, version = KADDO_VERSION, body = '# body') {
  const p = path.join(dir, `knowledge/agents/product/${name}.md`)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, `---\ntype: agent\nname: ${name}\nversion: ${version}\ngroup: product\n---\n\n${body}\n`)
}

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-assets-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

describe('asset version status (VS-074.2)', () => {
  it('AC3: canonical agents/skills carry versioned front matter', () => {
    const a = canonicalAgents().find((x) => x.name === 'capability-agent')!
    expect(a.content).toContain('type: agent')
    expect(a.content).toContain(`version: ${KADDO_VERSION}`)
    const s = canonicalSkills().find((x) => x.name === 'adr-writing')!
    expect(s.content).toContain('type: skill')
    expect(s.content).toContain(`version: ${KADDO_VERSION}`)
  })

  it('AC11: outdated when the installed version is lower', () => {
    config()
    installAgent('capability-agent', '3.10.0')
    const item = assetStatus(dir, 'agent').items.find((i) => i.name === 'capability-agent')!
    expect(item.state).toBe('outdated')
    expect(item.installed).toBe('3.10.0')
    expect(item.available).toBe(KADDO_VERSION)
  })

  it('AC12: missing when the agent is not installed', () => {
    config()
    const item = assetStatus(dir, 'agent').items.find((i) => i.name === 'capability-agent')!
    expect(item.state).toBe('missing')
    expect(item.installed).toBeNull()
  })

  it('AC13: unknown-version when no version front matter', () => {
    config()
    const p = path.join(dir, 'knowledge/agents/product/capability-agent.md')
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, '# Capability Agent\n\nno frontmatter\n')
    const item = assetStatus(dir, 'agent').items.find((i) => i.name === 'capability-agent')!
    expect(item.state).toBe('unknown-version')
  })

  it('AC10: up-to-date when the installed file equals the canonical asset', () => {
    config()
    const canonical = canonicalAgents().find((x) => x.name === 'capability-agent')!
    fs.mkdirSync(path.join(dir, 'knowledge/agents/product'), { recursive: true })
    fs.writeFileSync(path.join(dir, canonical.path), canonical.content)
    expect(assetStatus(dir, 'agent').items.find((i) => i.name === 'capability-agent')!.state).toBe('up-to-date')
  })

  it('modified when version matches but content diverges', () => {
    config()
    installAgent('capability-agent', KADDO_VERSION, 'LOCALLY EDITED BODY')
    expect(assetStatus(dir, 'agent').items.find((i) => i.name === 'capability-agent')!.state).toBe('modified')
  })
})

describe('agents/skills update commands (VS-074.2)', () => {
  it('AC21: update refreshes an outdated agent; AC23: skips modified without --force', async () => {
    config()
    installAgent('capability-agent', '3.10.0') // outdated
    installAgent('roadmap-agent', KADDO_VERSION, 'LOCAL EDIT') // modified
    // roadmap-agent lives in delivery/, but we can place it in product/ path? classify uses canonical path.
    fs.rmSync(path.join(dir, 'knowledge/agents/product/roadmap-agent.md'))
    const rmCanonical = canonicalAgents().find((x) => x.name === 'roadmap-agent')!
    fs.mkdirSync(path.join(dir, path.dirname(rmCanonical.path)), { recursive: true })
    fs.writeFileSync(path.join(dir, rmCanonical.path), rmCanonical.content.replace(/(\n)#/, '$1# LOCAL EDIT\n#'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(process, 'cwd').mockReturnValue(dir)
    const { runAssetsUpdate } = await import('../src/commands/assets.js')
    runAssetsUpdate('agent', {})
    // outdated capability-agent updated to current version
    expect(fs.readFileSync(path.join(dir, 'knowledge/agents/product/capability-agent.md'), 'utf8')).toContain(`version: ${KADDO_VERSION}`)
    // modified roadmap-agent kept (still has LOCAL EDIT)
    expect(fs.readFileSync(path.join(dir, rmCanonical.path), 'utf8')).toContain('LOCAL EDIT')
    vi.restoreAllMocks()
  })

  it('AC29/AC27: installedAssetsSummary reports counts + version', () => {
    config()
    installAgent('capability-agent', '3.10.0')
    const s = installedAssetsSummary(dir)
    expect(s.version).toBe(KADDO_VERSION)
    expect(s.agents.outdated).toBe(1)
    expect(s.agents.total).toBeGreaterThan(1)
  })
})
