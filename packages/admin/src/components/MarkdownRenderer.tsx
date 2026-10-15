import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { Components } from 'react-markdown'
import type { ReactNode } from 'react'
import { MermaidDiagram } from './MermaidDiagram'
import './markdown.css'

function toText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(toText).join('')
  if (children == null || typeof children === 'boolean' || typeof children === 'number') return String(children ?? '')
  return ''
}

const components: Components = {
  // Link security: strip dangerous schemes, open external links safely, keep internal links intact.
  a: ({ href, children, ...props }) => {
    if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
      return <span>{children}</span>
    }
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'))
    return (
      <a href={href} {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...props}>
        {children}
      </a>
    )
  },
  // react-markdown wraps block code in <pre><code>. We unwrap <pre> here so the `code` renderer owns
  // the single <pre>, avoiding nested <pre> while still detecting blocks without a language.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    if (className === 'language-mermaid') {
      return <MermaidDiagram code={toText(children)} />
    }
    // A fenced block either declares a language or spans multiple lines; anything else is inline code.
    const isBlock = /\blanguage-/.test(className ?? '') || toText(children).includes('\n')
    if (isBlock) {
      return (
        <pre className="kaddo-code-block">
          <code className={(className ?? '').trim() || undefined} {...props}>{children}</code>
        </pre>
      )
    }
    return <code className="kaddo-inline-code" {...props}>{children}</code>
  },
  // Localized horizontal scroll for wide tables, so the page layout never overflows.
  table: ({ children, ...props }) => (
    <div className="kaddo-table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="kaddo-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
