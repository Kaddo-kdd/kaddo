import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownRenderer } from '../src/components/MarkdownRenderer'

const render = (content: string) => renderToStaticMarkup(createElement(MarkdownRenderer, { content }))

// A representative fixture exercising the Markdown this renderer must present well (WI-067).
const FIXTURE = [
  '# Title',
  '## Section',
  '### Subsection',
  '#### H4', '##### H5', '###### H6',
  '',
  'A paragraph with `inline code` and a [internal](/knowledge/x) and an [external](https://example.com) link.',
  '',
  '- [x] done task',
  '- [ ] pending task',
  '  - nested item',
  '1. first',
  '2. second',
  '',
  '> A blockquote.',
  '',
  '| Name | Role |',
  '| --- | --- |',
  '| API | entry |',
  '',
  '```ts',
  'const x: number = 1',
  '```',
  '',
  '```',
  'no-language',
  'block line two',
  '```',
  '',
  '---',
  '',
  '[bad](javascript:alert(1))',
  '',
  '<script>alert(2)</script>',
].join('\n')

describe('MarkdownRenderer (WI-067)', () => {
  const html = render(FIXTURE)

  it('renders a semantic heading hierarchy H1–H6 under the scoped root', () => {
    expect(html).toContain('class="kaddo-markdown"')
    for (const tag of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) expect(html).toContain(`<${tag}`)
  })

  it('styles inline code and renders fenced blocks (incl. without a language) as code blocks, no nested <pre>', () => {
    expect(html).toContain('class="kaddo-inline-code"')
    // A fenced block with no language is still a block, not inline.
    expect(html).toContain('class="kaddo-code-block"')
    expect(html).toContain('no-language')
    expect(html).toMatch(/<pre class="kaddo-code-block"><code/)
    expect(html).not.toMatch(/<pre[^>]*>\s*<pre/) // no nested <pre>
  })

  it('renders GFM task lists, tables (wrapped for localized scroll), blockquotes and rules', () => {
    expect(html).toContain('task-list-item')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('class="kaddo-table-wrap"')
    expect(html).toMatch(/<table[^>]*>[\s\S]*<th/)
    expect(html).toContain('<blockquote')
    expect(html).toContain('<hr')
  })

  it('keeps Markdown sanitized: no javascript: links and no embedded scripts', () => {
    expect(html).not.toContain('href="javascript:')
    expect(html).not.toContain('<script')
    expect(html).toContain('const x: number = 1') // content is not lost
  })

  it('preserves external-link safety and Mermaid support', () => {
    expect(html).toContain('rel="noopener noreferrer"')
    const mermaid = render('```mermaid\ngraph TD; A-->B\n```')
    expect(typeof mermaid).toBe('string') // MermaidDiagram renders without throwing in static markup
  })
})
