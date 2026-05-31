import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import matter from 'gray-matter'
import {
  findWorkItemArtifacts,
  artifactsMissingOwnership,
  loadScanSignals,
  suggestGlobs,
  applyOwnership,
  parseOwnershipArtifact,
  type OwnershipArtifact,
} from '../src/core/ownership-suggest.js'
import { analyzeGuard } from '../src/core/diff-analysis.js'
import { readArtifacts } from '../src/services/artifact-reader.js'

let tmpDir: string

function writeWI(name: string, frontMatter: string, body = '\n# Work Item\n\nKeep this body.\n') {
  const full = path.join(tmpDir, 'architecture', 'work-items', name)
  fs.writeFileSync(full, `---\n${frontMatter}\n---\n${body}`)
}

function writeScan(detected: Record<string, unknown>) {
  fs.writeFileSync(
    path.join(tmpDir, '.kaddo', 'scan.json'),
    JSON.stringify({ version: '1', detected }, null, 2)
  )
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-ownership-'))
  fs.mkdirSync(path.join(tmpDir, 'architecture', 'work-items'), { recursive: true })
  fs.mkdirSync(path.join(tmpDir, '.kaddo'), { recursive: true })
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('findWorkItemArtifacts / missing ownership', () => {
  it('finds work item artifacts and flags missing ownership', () => {
    writeWI('WI-001.md', 'type: feature\nid: WI-001\ntitle: A\ncode: []')
    writeWI('WI-002.md', 'type: feature\nid: WI-002\ntitle: B\ncode:\n  - src/x/**')
    writeWI('WI-003.md', 'type: spike\nid: WI-003\ntitle: C')

    const all = findWorkItemArtifacts(tmpDir)
    expect(all.map((a) => a.id).sort()).toEqual(['WI-001', 'WI-002', 'WI-003'])

    const missing = artifactsMissingOwnership(all)
    expect(missing.map((a) => a.id).sort()).toEqual(['WI-001', 'WI-003'])
  })

  it('treats code: [] as missing ownership', () => {
    writeWI('WI-001.md', 'type: feature\nid: WI-001\ntitle: A\ncode: []')
    const [a] = findWorkItemArtifacts(tmpDir)
    expect(a.hasOwnership).toBe(false)
  })

  it('skips an artifact with existing globs (not missing)', () => {
    writeWI('WI-002.md', 'type: feature\nid: WI-002\ntitle: B\ncode:\n  - src/x/**')
    const missing = artifactsMissingOwnership(findWorkItemArtifacts(tmpDir))
    expect(missing).toHaveLength(0)
  })

  it('returns empty when no work-items dir exists', () => {
    fs.rmSync(path.join(tmpDir, 'architecture', 'work-items'), { recursive: true, force: true })
    expect(findWorkItemArtifacts(tmpDir)).toEqual([])
  })

  it('skips files with invalid front matter safely', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'architecture', 'work-items', 'broken.md'),
      '---\ntype: [unclosed\n---\nbody'
    )
    writeWI('WI-001.md', 'type: feature\nid: WI-001\ntitle: A')
    const all = findWorkItemArtifacts(tmpDir)
    expect(all.map((a) => a.id)).toEqual(['WI-001'])
  })

  it('captures source and metadata', () => {
    writeWI(
      'WI-001.md',
      'type: feature\nid: WI-001\ntitle: A\nsource: roadmap\ndomains:\n  - payments\ncapabilities:\n  - payment-processing'
    )
    const [a] = findWorkItemArtifacts(tmpDir)
    expect(a.source).toBe('roadmap')
    expect(a.domains).toEqual(['payments'])
    expect(a.capabilities).toEqual(['payment-processing'])
  })
})

describe('loadScanSignals', () => {
  it('reads detected signals from scan.json', () => {
    writeScan({
      sourceDirectories: ['src'],
      migrationDirectories: ['supabase/migrations'],
      contractFiles: ['openapi.yaml'],
      infrastructureFiles: ['amplify.yml'],
    })
    const s = loadScanSignals(tmpDir)!
    expect(s.sourceDirectories).toEqual(['src'])
    expect(s.migrationDirectories).toEqual(['supabase/migrations'])
    expect(s.contractFiles).toEqual(['openapi.yaml'])
    expect(s.infrastructureFiles).toEqual(['amplify.yml'])
  })

  it('returns null when scan.json is missing', () => {
    expect(loadScanSignals(tmpDir)).toBeNull()
  })
})

describe('suggestGlobs', () => {
  const base: OwnershipArtifact = {
    filePath: '', relPath: 'architecture/work-items/WI-001.md',
    id: 'WI-001', title: 'A', type: 'feature', domains: [], capabilities: [],
    codeGlobs: [], hasOwnership: false,
  }

  it('returns [] when there are no scan signals (manual entry path)', () => {
    expect(suggestGlobs(base, null)).toEqual([])
  })

  it('suggests generic source/migration/contract globs from scan', () => {
    const s = {
      sourceDirectories: ['src'],
      migrationDirectories: ['db/migrations'],
      contractFiles: ['openapi.yaml'],
      infrastructureFiles: [],
    }
    expect(suggestGlobs(base, s)).toEqual(['src/**', 'db/migrations/**', 'openapi.yaml'])
  })

  it('offers domain-specific candidates first when metadata exists', () => {
    const artifact = { ...base, domains: ['payments'], capabilities: ['Payment Processing'] }
    const s = {
      sourceDirectories: ['src'],
      migrationDirectories: [],
      contractFiles: [],
      infrastructureFiles: [],
    }
    const globs = suggestGlobs(artifact, s)
    expect(globs[0]).toBe('src/payments/**')
    expect(globs).toContain('src/payment-processing/**')
    expect(globs).toContain('src/**')
    // domain-specific comes before the generic one
    expect(globs.indexOf('src/payments/**')).toBeLessThan(globs.indexOf('src/**'))
  })
})

describe('applyOwnership', () => {
  const raw = `---
type: feature
id: WI-001
knowledge_level: K2
source: roadmap
domains:
  - payments
code: []
---

# Improve payment processing

This body must be preserved exactly.
`

  it('sets code globs while preserving other keys and the body', () => {
    const out = applyOwnership(raw, ['src/payments/**'])
    const { data, content } = matter(out)
    expect(data.code).toEqual(['src/payments/**'])
    expect(data.type).toBe('feature')
    expect(data.id).toBe('WI-001')
    expect(data.knowledge_level).toBe('K2')
    expect(data.source).toBe('roadmap')
    expect(data.domains).toEqual(['payments'])
    expect(content).toContain('# Improve payment processing')
    expect(content).toContain('This body must be preserved exactly.')
  })

  it('replaces existing globs by default', () => {
    const withGlobs = applyOwnership(raw, ['src/a/**'])
    const replaced = applyOwnership(withGlobs, ['src/b/**'], 'replace')
    expect(matter(replaced).data.code).toEqual(['src/b/**'])
  })

  it('appends to existing globs in append mode (deduped)', () => {
    const withGlobs = applyOwnership(raw, ['src/a/**'])
    const appended = applyOwnership(withGlobs, ['src/a/**', 'src/b/**'], 'append')
    expect(matter(appended).data.code).toEqual(['src/a/**', 'src/b/**'])
  })
})

describe('end-to-end: Guard detects drift after ownership is added', () => {
  it('produces a Guard match once code globs are declared', () => {
    writeWI('WI-001.md', 'type: feature\nid: WI-001\ntitle: A\nknowledge_level: K2\ncode: []')
    const archDir = path.join(tmpDir, 'architecture')

    // Before: no ownership → no matches.
    const before = analyzeGuard(['src/payments/charge.ts'], readArtifacts(archDir), true)
    expect(before.matches).toHaveLength(0)
    expect(before.silenced).toBe(true)

    // Declare ownership via the assistant's writer.
    const wiPath = path.join(archDir, 'work-items', 'WI-001.md')
    fs.writeFileSync(wiPath, applyOwnership(fs.readFileSync(wiPath, 'utf8'), ['src/payments/**']))

    // After: Guard detects drift on a matching changed file.
    const after = analyzeGuard(['src/payments/charge.ts'], readArtifacts(archDir), true)
    expect(after.matches).toHaveLength(1)
    expect(after.matches[0].artifact.id).toBe('WI-001')
    expect(after.matches[0].artifactWasModified).toBe(false)
  })
})
