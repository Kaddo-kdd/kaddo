import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import matter from 'gray-matter'

function tmpDir(): string { return fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-okf-')) }
function write(dir: string, rel: string, content: string) {
  const full = path.join(dir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}
function seed(dir: string) {
  write(dir, '.kaddo/config.yml', ['project:', '  name: okf', '  state: new', '  structure: monorepo', 'team:', '  size: small'].join('\n'))
  write(dir, 'knowledge/business/overview.md', ['---', 'id: BK-001', 'type: business-knowledge', 'title: Business overview', 'summary: Why the project exists.', 'domains: [Business]', '---', '', '# Business overview', '', 'Body.'].join('\n'))
  write(dir, 'knowledge/tech/resources/main-db.md', ['---', 'id: RES-main-db', 'type: project-resource', 'title: Main DB', 'resource_type: database', 'summary: Primary database.', '---', '', '# Purpose', '', 'Primary DB.'].join('\n'))
  write(dir, 'knowledge/delivery/work-items/completed/WI-001.md', ['---', 'id: WI-001', 'type: feature', 'title: First feature', 'status: completed', 'summary: Ship the first feature.', 'domains: [Delivery]', 'resources:', '  - id: RES-main-db', '    role: affected', '---', '', '# WI-001', '', 'Body.'].join('\n'))
}

describe('WI-065 — OKF v0.2 export + validate', () => {
  let dir: string
  beforeEach(() => { dir = tmpDir(); seed(dir) })
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }) })

  it('exports a conformant OKF v0.2 bundle with typed concepts and a root index (AC-01, AC-05, AC-06)', async () => {
    const core = await import('../src/core.js')
    const res = core.exportOkf(dir)
    expect(res.conceptCount).toBe(3)
    // Root index declares the OKF version.
    const rootIdx = matter(fs.readFileSync(path.join(res.outputDir, 'index.md'), 'utf-8')).data
    expect(rootIdx.okf_version).toBe('0.2')
    // Each concept has a non-empty type and real provenance (source path, not invented).
    const wi = matter(fs.readFileSync(path.join(res.outputDir, 'delivery/work-items/WI-001.md'), 'utf-8')).data as any
    expect(wi.type).toBe('Work Item')
    expect(wi.sources[0].resource).toBe('knowledge/delivery/work-items/completed/WI-001.md')
    expect(wi.kaddo_id).toBe('WI-001')

    const valid = core.validateOkf(dir)
    expect(valid.conformant).toBe(true)
    expect(valid.counts.conformance).toBe(0)
  })

  it('preserves relationships as resolvable internal links (AC-07)', async () => {
    const core = await import('../src/core.js')
    const res = core.exportOkf(dir)
    const wiBody = matter(fs.readFileSync(path.join(res.outputDir, 'delivery/work-items/WI-001.md'), 'utf-8')).content
    expect(wiBody).toContain('## Related')
    expect(wiBody).toMatch(/\]\(\.\.\/\.\.\/tech\/RES-main-db\.md\)/) // link resolves within the bundle
  })

  it('does not modify source artifacts and is deterministic across repeated exports (AC-02, AC-14)', async () => {
    const core = await import('../src/core.js')
    const before = fs.readFileSync(path.join(dir, 'knowledge/delivery/work-items/completed/WI-001.md'), 'utf-8')
    const a = core.exportOkf(dir)
    const first = a.files.map((f) => fs.readFileSync(path.join(a.outputDir, f), 'utf-8')).join('\n')
    const b = core.exportOkf(dir)
    const second = b.files.map((f) => fs.readFileSync(path.join(b.outputDir, f), 'utf-8')).join('\n')
    expect(b.files).toEqual(a.files)      // stable paths
    expect(second).toBe(first)            // stable content
    expect(fs.readFileSync(path.join(dir, 'knowledge/delivery/work-items/completed/WI-001.md'), 'utf-8')).toBe(before)
  })

  it('maps unknown types to readable generic concepts, never dropping them (permissive)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/tech/weird.md', ['---', 'id: X-1', 'type: some-unknown-type', 'title: Weird', '---', '', '# Weird'].join('\n'))
    const res = core.exportOkf(dir)
    const x = matter(fs.readFileSync(path.join(res.outputDir, 'tech/X-1.md'), 'utf-8')).data as any
    expect(x.type).toBe('Technical Knowledge') // falls back by layer, not dropped
    expect(core.validateOkf(dir).conformant).toBe(true) // unknown types are not conformance errors
  })

  it('validate: concept without type is a Conformance Error; a broken link is only Informational (AC-09, AC-10)', async () => {
    const core = await import('../src/core.js')
    core.exportOkf(dir)
    const out = path.join(dir, '.kaddo/okf')
    // Concept missing `type` → conformance error.
    write(out, 'tech/NO-TYPE.md', ['---', 'title: No type', 'kaddo_id: NT-1', '---', '', '# No type', '', 'See [missing](./does-not-exist.md).'].join('\n'))
    const res = core.validateOkf(dir)
    expect(res.conformant).toBe(false)
    expect(res.findings.some((f) => f.level === 'conformance' && /no non-empty `type`/.test(f.message))).toBe(true)
    // The broken internal link is informational, not a conformance error.
    expect(res.findings.some((f) => f.level === 'info' && /not resolvable/.test(f.message))).toBe(true)
  })
})
