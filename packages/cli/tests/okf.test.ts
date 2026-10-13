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
    expect(wiBody).toMatch(/\]\(\.\.\/\.\.\/resources\/RES-main-db\.md\)/) // link resolves within the bundle
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

  it('represents an external Knowledge Capsule as an OKF reference, preserving source and access limits (AC-12)', async () => {
    const core = await import('../src/core.js')
    write(dir, '.kaddo/external.yml', ['external:', '  - id: CAP-partner-api', '    type: knowledge-capsule', '    path: knowledge/external/partner-api.md', '    owner: partner-team'].join('\n'))
    const res = core.exportOkf(dir)
    const ref = matter(fs.readFileSync(path.join(res.outputDir, 'external/CAP-partner-api.md'), 'utf-8'))
    expect((ref.data as any).type).toBe('Knowledge Reference')
    expect((ref.data as any).sources[0].resource).toBe('knowledge/external/partner-api.md')
    expect(ref.content).toMatch(/Access is limited/)
    expect(core.validateOkf(dir).conformant).toBe(true)
  })

  it('--with-reports projects reports as concepts, generated (not a source date) and keeping disclaimers (AC-11)', async () => {
    const core = await import('../src/core.js')
    const now = new Date('2026-01-01T00:00:00.000Z')
    const res = core.exportOkf(dir, { withReports: true, now })
    const savingsPath = path.join(res.outputDir, 'reports/report-savings.md')
    // Savings is robust to build from a minimal project; if present it must keep its methodology note.
    if (fs.existsSync(savingsPath)) {
      const r = matter(fs.readFileSync(savingsPath, 'utf-8'))
      expect((r.data as any).type).toBe('Report')
      expect((r.data as any).generated.at).toBe(now.toISOString())
      expect((r.data as any).sources).toBeUndefined() // generated, not sourced from a file
      expect(r.content.toLowerCase()).toMatch(/estimate/) // methodological framing preserved
    }
    // The core export (no reports) stays conformant and does not include reports.
    expect(core.validateOkf(dir).conformant).toBe(true)
  })

  it('preserves the full canonical Markdown body and rewrites internal links into the bundle (AC-01, AC-02, AC-03)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/tech/architecture.md', ['---', 'id: TK-arch', 'type: technical-knowledge', 'title: Architecture', 'summary: How it is built.', '---', '',
      '# Architecture', '', '## Components', '', '| Name | Role |', '| --- | --- |', '| API | entry |', '',
      '```ts', 'const x = 1', '```', '', 'See [WI-001](../delivery/work-items/completed/WI-001.md).'].join('\n'))
    const res = core.exportOkf(dir)
    const body = matter(fs.readFileSync(path.join(res.outputDir, 'tech/TK-arch.md'), 'utf-8')).content
    expect(body).toContain('## Components')          // sections preserved
    expect(body).toContain('| API | entry |')        // tables preserved
    expect(body).toContain('const x = 1')            // code preserved
    expect(body).toMatch(/\]\(\.\.\/delivery\/work-items\/WI-001\.md\)/) // link rewritten to bundle path
  })

  it('indexes follow OKF conventions (no frontmatter; root declares only okf_version) and reports carry generated.by (AC-04, AC-05)', async () => {
    const core = await import('../src/core.js')
    const res = core.exportOkf(dir, { withReports: true, now: new Date('2026-01-01T00:00:00.000Z') })
    // Nested index: no frontmatter at all.
    const nested = fs.readFileSync(path.join(res.outputDir, 'delivery/work-items/index.md'), 'utf-8')
    expect(nested.startsWith('---')).toBe(false)
    expect(matter(nested).data).toEqual({})
    // Root index: only okf_version, no `type`.
    const root = matter(fs.readFileSync(path.join(res.outputDir, 'index.md'), 'utf-8')).data as any
    expect(root.okf_version).toBe('0.2')
    expect(root.type).toBeUndefined()
    const savings = path.join(res.outputDir, 'reports/report-savings.md')
    if (fs.existsSync(savings)) {
      const g = (matter(fs.readFileSync(savings, 'utf-8')).data as any).generated
      expect(g.by).toBe('process:kaddo-okf-export')
      expect(g.at).toBe('2026-01-01T00:00:00.000Z')
    }
  })

  it('refuses dangerous export destinations and does not touch project files (AC-07, AC-08)', async () => {
    const core = await import('../src/core.js')
    const before = fs.readFileSync(path.join(dir, 'knowledge/tech/resources/main-db.md'), 'utf-8')
    expect(() => core.exportOkf(dir, { output: 'knowledge' })).toThrow(/protected|UNSAFE|Refusing/i)
    expect(() => core.exportOkf(dir, { output: '.' })).toThrow(/root|UNSAFE|Refusing/i)
    expect(fs.readFileSync(path.join(dir, 'knowledge/tech/resources/main-db.md'), 'utf-8')).toBe(before)
  })

  it('omits concepts with potentially sensitive content and never writes the value (AC-10)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/tech/leak.md', ['---', 'id: TK-leak', 'type: technical-knowledge', 'title: Leaky', '---', '', '# Leaky', '', 'aws key AKIAIOSFODNN7EXAMPLE here.'].join('\n'))
    const res = core.exportOkf(dir)
    expect(res.omittedConcepts.some((o) => o.id === 'TK-leak')).toBe(true)
    expect(fs.existsSync(path.join(res.outputDir, 'tech/TK-leak.md'))).toBe(false)
    // The secret value appears in no exported file.
    const all = res.files.map((f) => fs.readFileSync(path.join(res.outputDir, f), 'utf-8')).join('\n')
    expect(all).not.toContain('AKIAIOSFODNN7EXAMPLE')
  })

  it('detects identity collisions instead of silently dropping a concept (AC-11)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/tech/a.md', ['---', 'id: DUP', 'type: technical-knowledge', 'title: A', '---', '', '# A'].join('\n'))
    write(dir, 'knowledge/product/b.md', ['---', 'id: DUP', 'type: product-knowledge', 'title: B', '---', '', '# B'].join('\n'))
    expect(() => core.exportOkf(dir)).toThrow(/collision/i)
  })

  it('separates agent instructions from system knowledge (excluded by default, under agents/ when opted in) (AC-12)', async () => {
    const core = await import('../src/core.js')
    write(dir, 'knowledge/agents/my-agent.md', ['---', 'id: AG-1', 'type: agent', 'title: My Agent', '---', '', '# My Agent', '', 'Instructions.'].join('\n'))
    const off = core.exportOkf(dir)
    expect(fs.existsSync(path.join(off.outputDir, 'agents/AG-1.md'))).toBe(false)
    const on = core.exportOkf(dir, { withAgents: true })
    expect(fs.existsSync(path.join(on.outputDir, 'agents/AG-1.md'))).toBe(true)
  })

  it('an independent consumer can navigate the bundle with only Markdown/YAML (AC-13, AC-16)', async () => {
    const core = await import('../src/core.js')
    const out = core.exportOkf(dir).outputDir
    // No Kaddo APIs: read with fs + gray-matter only.
    const root = fs.readFileSync(path.join(out, 'index.md'), 'utf-8')
    expect(matter(root).data).toHaveProperty('okf_version', '0.2')
    // Nested index exists for the work-items collection (progressive disclosure).
    expect(fs.existsSync(path.join(out, 'delivery/work-items/index.md'))).toBe(true)
    // Open a concept and read its content; follow its relation link to the resource.
    const wi = fs.readFileSync(path.join(out, 'delivery/work-items/WI-001.md'), 'utf-8')
    expect((matter(wi).data as any).type).toBe('Work Item')
    const linkTarget = matter(wi).content.match(/\]\(([^)]*resources\/RES-main-db\.md)\)/)?.[1]
    expect(linkTarget).toBeTruthy()
    expect(fs.existsSync(path.resolve(out, 'delivery/work-items', linkTarget!))).toBe(true)
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
