import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  getInitiative,
  suggestInitiativesForExternalItem,
} from '../src/core/initiative.js'
import {
  createInitiative,
  addExternalLink,
  transitionInitiative,
  materializeCandidate,
  InitiativeWriteError,
} from '../src/core/initiative-write.js'
import { buildGraph } from '../src/core/graph.js'
import { loadConfig } from '../src/core/config.js'

function makeProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ini-ext-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n',
  )
  fs.mkdirSync(path.join(dir, 'knowledge', 'delivery', 'work-items', 'draft'), { recursive: true })
  return dir
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

describe('external links (AC-22)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('adds a provider-neutral external link', () => {
    createInitiative(dir, { title: 'Auth' })
    const ini = addExternalLink(dir, 'INI-001', {
      integration: 'jira-company',
      externalId: 'AUTH-20',
      externalType: 'epic',
      url: 'https://jira.example/AUTH-20',
    })
    expect(ini.externalLinks).toHaveLength(1)
    expect(ini.externalLinks[0]).toMatchObject({ integration: 'jira-company', externalId: 'AUTH-20', externalType: 'epic' })
  })

  it('rejects a duplicate external link', () => {
    createInitiative(dir, { title: 'Auth' })
    addExternalLink(dir, 'INI-001', { integration: 'jira', externalId: 'AUTH-20' })
    expect(() => addExternalLink(dir, 'INI-001', { integration: 'jira', externalId: 'AUTH-20' })).toThrow(InitiativeWriteError)
  })
})

describe('external status isolation (AC-23)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('an external status is stored but never changes the Initiative lifecycle', () => {
    createInitiative(dir, { title: 'Auth' })
    transitionInitiative(dir, 'INI-001', 'in-progress')
    const ini = addExternalLink(dir, 'INI-001', {
      integration: 'jira',
      externalId: 'AUTH-20',
      externalStatus: 'Done', // external says done…
    })
    // …but the Initiative keeps its own lifecycle.
    expect(ini.status).toBe('in-progress')
    expect(ini.externalLinks[0].externalStatus).toBe('Done')
    expect(getInitiative(dir, 'INI-001')!.status).toBe('in-progress')
  })
})

describe('imported WI association suggestion (AC-24)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('suggests the initiative whose external link matches the external parent', () => {
    createInitiative(dir, { title: 'Auth' })
    addExternalLink(dir, 'INI-001', { integration: 'jira-company', externalId: 'AUTH-20', externalType: 'epic' })
    createInitiative(dir, { title: 'Billing' }) // INI-002, no link

    const matches = suggestInitiativesForExternalItem(dir, 'jira-company', 'AUTH-20')
    expect(matches.map((i) => i.id)).toEqual(['INI-001'])

    expect(suggestInitiativesForExternalItem(dir, 'jira-company', 'NOPE-1')).toHaveLength(0)
  })

  it('matching is case-insensitive on integration and id', () => {
    createInitiative(dir, { title: 'Auth' })
    addExternalLink(dir, 'INI-001', { integration: 'Jira', externalId: 'AUTH-20' })
    expect(suggestInitiativesForExternalItem(dir, 'jira', 'auth-20').map((i) => i.id)).toEqual(['INI-001'])
  })
})

describe('knowledge graph with initiatives (AC-25)', () => {
  let dir: string
  beforeEach(() => { dir = makeProject() })
  afterEach(() => cleanup(dir))

  it('adds initiative nodes and capability/external/candidate edges without breaking existing types', () => {
    createInitiative(dir, {
      title: 'Auth',
      relatedCapabilities: ['User Authentication'],
      candidates: [{ title: 'Login' }],
    })
    addExternalLink(dir, 'INI-001', { integration: 'jira', externalId: 'AUTH-20', externalType: 'epic' })
    materializeCandidate(dir, 'INI-001', 'WI-CANDIDATE-001')

    const graph = buildGraph(dir, loadConfig(dir)!, { scope: 'all' })

    const iniNode = graph.nodes.find((n) => n.type === 'initiative' && n.id === 'initiative:ini-001')
    expect(iniNode).toBeTruthy()
    expect(iniNode!.label).toContain('INI-001')

    const extNode = graph.nodes.find((n) => n.type === 'external-item')
    expect(extNode?.label).toBe('jira:AUTH-20')

    const edgeTypes = graph.edges.map((e) => e.type)
    expect(edgeTypes).toContain('targets') // initiative → capability
    expect(edgeTypes).toContain('references_external') // initiative → external-item
    expect(edgeTypes).toContain('belongs_to') // candidate → initiative (and WI → initiative)

    // The materialized WI links back to the real initiative node.
    const wiBelongs = graph.edges.find((e) => e.type === 'belongs_to' && e.from === 'wi:WI-001')
    expect(wiBelongs?.to).toBe('initiative:ini-001')
  })
})
