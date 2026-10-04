import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getKnowledgeArtifactDetail } from '../src/core-adapter.js'

// WI-024 AC-14: the Knowledge read path (which feeds the Admin renderer) preserves ```mermaid```
// blocks verbatim — no destructive parsing.

let dir: string
afterEach(() => dir && fs.rmSync(dir, { recursive: true, force: true }))

function makeProject(businessMd: string): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-mermaid-'))
  fs.mkdirSync(path.join(d, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(d, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: t\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n',
  )
  fs.mkdirSync(path.join(d, 'knowledge', 'business'), { recursive: true })
  fs.writeFileSync(path.join(d, 'knowledge', 'business', 'business.md'), businessMd)
  return d
}

describe('knowledge artifact mermaid preservation (AC-14)', () => {
  it('preserves a mermaid block verbatim in the returned content', () => {
    const md = [
      '---',
      'type: business-context',
      '---',
      '',
      '# Business Context',
      '',
      '## Business Flow',
      '',
      '```mermaid',
      'flowchart LR',
      '    Team --> Kaddo',
      '    Kaddo --> ProjectKnowledge',
      '```',
      '',
      'Trailing text.',
      '',
    ].join('\n')
    dir = makeProject(md)
    const detail = getKnowledgeArtifactDetail(dir, 'knowledge-business-business')
    expect(detail.content).toContain('```mermaid')
    expect(detail.content).toContain('flowchart LR')
    expect(detail.content).toContain('Team --> Kaddo')
    expect(detail.content).toContain('Kaddo --> ProjectKnowledge')
    expect(detail.content).toContain('Trailing text.')
  })

  it('preserves multiple mermaid blocks', () => {
    const md = [
      '---',
      'type: business-context',
      '---',
      '',
      '## A',
      '```mermaid',
      'flowchart LR',
      '    A --> B',
      '```',
      '## C',
      '```mermaid',
      'flowchart LR',
      '    C --> D',
      '```',
      '',
    ].join('\n')
    dir = makeProject(md)
    const detail = getKnowledgeArtifactDetail(dir, 'knowledge-business-business')
    expect((detail.content.match(/```mermaid/g) ?? []).length).toBe(2)
    expect(detail.content).toContain('A --> B')
    expect(detail.content).toContain('C --> D')
  })
})
