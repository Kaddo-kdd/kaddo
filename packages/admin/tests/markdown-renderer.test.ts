import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

const rendererPath = path.resolve(__dirname, '../src/components/MarkdownRenderer.tsx')

describe('MarkdownRenderer report compatibility', () => {
  it('keeps the shared GFM table and Mermaid support used by POC reports', () => {
    const source = fs.readFileSync(rendererPath, 'utf-8')
    expect(source).toContain('remarkGfm')
    expect(source).toContain("className === 'language-mermaid'")
    expect(source).toContain('<MermaidDiagram')
    expect(source).toContain('table:')
  })
})
