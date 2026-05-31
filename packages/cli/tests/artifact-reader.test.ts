import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { readArtifacts, artifactsWithOwnership } from '../src/services/artifact-reader.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-artifacts-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('artifact-reader', () => {
  it('reads a single artifact with front matter', () => {
    write('architecture/work-items/WI-001-test.md', `---
type: feature
id: WI-001
title: "Test feature"
knowledge_level: K2
status: in-progress
code:
  - src/payments/**
summary: "Test summary"
---

# Test feature
`)
    const artifacts = readArtifacts(path.join(tmpDir, 'architecture'))
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].id).toBe('WI-001')
    expect(artifacts[0].codeGlobs).toEqual(['src/payments/**'])
    expect(artifacts[0].knowledgeLevel).toBe('K2')
  })

  it('returns empty array for empty directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'architecture'))
    const artifacts = readArtifacts(path.join(tmpDir, 'architecture'))
    expect(artifacts).toHaveLength(0)
  })

  it('reads multiple artifacts from subdirectories', () => {
    write('architecture/work-items/WI-001.md', `---\ntype: feature\nid: WI-001\ncode:\n  - src/a/**\n---\n`)
    write('architecture/work-items/WI-002.md', `---\ntype: bugfix\nid: WI-002\ncode:\n  - src/b/**\n---\n`)
    const artifacts = readArtifacts(path.join(tmpDir, 'architecture'))
    expect(artifacts).toHaveLength(2)
  })

  it('skips artifacts without front matter gracefully', () => {
    write('architecture/work-items/plain.md', '# No front matter here\n')
    const artifacts = readArtifacts(path.join(tmpDir, 'architecture'))
    // gray-matter returns empty data object, artifact is parsed with empty fields
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].codeGlobs).toEqual([])
  })

  it('filters artifacts with ownership', () => {
    write('architecture/work-items/WI-001.md', `---\nid: WI-001\ncode:\n  - src/**\n---\n`)
    write('architecture/work-items/WI-002.md', `---\nid: WI-002\ncode: []\n---\n`)
    write('architecture/knowledge.md', `---\ntype: current-state\n---\n# Knowledge\n`)
    const artifacts = readArtifacts(path.join(tmpDir, 'architecture'))
    const withOwnership = artifactsWithOwnership(artifacts)
    expect(withOwnership).toHaveLength(1)
    expect(withOwnership[0].id).toBe('WI-001')
  })
})
