import { describe, it, expect, afterEach } from 'vitest'
import { RESOURCES } from '../src/resources.js'
import { makeProject, write, config, workItem, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

function res(uri: string) {
  return RESOURCES.find((r) => r.uri === uri)!
}

describe('MCP resources (VS-057 AC6/AC14)', () => {
  it('exposes the expected resource URIs', () => {
    const uris = RESOURCES.map((r) => r.uri).sort()
    expect(uris).toEqual(
      [
        'kaddo://agents',
        'kaddo://capsules',
        'kaddo://context-pack',
        'kaddo://explain',
        'kaddo://graph',
        'kaddo://graph-hints',
        'kaddo://impact-report',
        'kaddo://savings-report',
        'kaddo://roadmap',
        'kaddo://skills',
        'kaddo://understand',
        'kaddo://work-items',
      ].sort()
    )
  })

  it('returns a clear instruction when a derived file is missing', () => {
    root = makeProject()
    config(root)
    expect(res('kaddo://context-pack').read(root)[0].text).toMatch(/Run `kaddo context`/)
    expect(res('kaddo://graph').read(root)[0].text).toMatch(/Run `kaddo graph export`/)
    expect(res('kaddo://graph-hints').read(root)[0].text).toMatch(/Run `kaddo graph export`/)
  })

  it('reads context-pack and explain when present', () => {
    root = makeProject()
    config(root)
    write(root, '.kaddo/context-pack.md', '# Pack\nbody')
    write(root, '.kaddo/explain.md', '# Explain')
    expect(res('kaddo://context-pack').read(root)[0].text).toContain('# Pack')
    expect(res('kaddo://explain').read(root)[0].text).toContain('# Explain')
  })

  it('graph resource returns both json and mermaid parts', () => {
    root = makeProject()
    config(root)
    write(root, '.kaddo/graph.json', '{"nodes":[]}')
    write(root, '.kaddo/graph.mmd', 'flowchart LR')
    const parts = res('kaddo://graph').read(root)
    expect(parts.map((p) => p.mimeType)).toEqual(['application/json', 'text/vnd.mermaid'])
  })

  it('work-items resource summarizes work items and needs knowledge/', () => {
    root = makeProject()
    config(root)
    expect(res('kaddo://work-items').read(root)[0].text).toMatch(/Run `kaddo bootstrap`/)
    workItem(root, 'WI-001')
    const json = JSON.parse(res('kaddo://work-items').read(root)[0].text)
    expect(json[0].id).toBe('WI-001')
    expect(json[0]).toHaveProperty('code')
  })

  it('skills resource returns an empty list when none installed', () => {
    root = makeProject()
    config(root)
    expect(JSON.parse(res('kaddo://skills').read(root)[0].text)).toEqual({ skills: [] })
  })
})
