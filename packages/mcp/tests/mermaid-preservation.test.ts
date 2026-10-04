import { describe, it, expect, afterEach } from 'vitest'
import { readText } from '../src/project.js'
import { makeProject, write, config, cleanup } from './helpers.js'

// WI-024 AC-15: MCP exposes Knowledge as Markdown and preserves ```mermaid``` source verbatim
// (readText is the primitive every knowledge/context resource uses). No diagram-specific parsing.

let root: string
afterEach(() => root && cleanup(root))

describe('MCP knowledge mermaid preservation (AC-15)', () => {
  it('readText returns the mermaid block verbatim', () => {
    root = makeProject()
    config(root)
    const md = [
      '---',
      'type: business-context',
      '---',
      '# Business Context',
      '',
      '```mermaid',
      'flowchart LR',
      '    Team --> Kaddo',
      '```',
      '',
    ].join('\n')
    write(root, 'knowledge/business/business.md', md)

    const body = readText(root, 'knowledge/business/business.md')
    expect(body).toBe(md)
    expect(body).toContain('```mermaid')
    expect(body).toContain('Team --> Kaddo')
  })
})
