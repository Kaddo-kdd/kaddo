import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { Components } from 'react-markdown'
import type { ReactNode } from 'react'
import { MermaidDiagram } from './MermaidDiagram'

function toText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(toText).join('')
  if (children == null || typeof children === 'boolean' || typeof children === 'number') return String(children ?? '')
  return ''
}

const components: Components = {
  a: ({ href, children, ...props }) => {
    if (href && (href.startsWith('javascript:') || href.startsWith('data:'))) {
      return <span>{children}</span>
    }
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'))
    return (
      <a
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        style={{ color: 'var(--primary)' }}
        {...props}
      >
        {children}
      </a>
    )
  },
  code: ({ className, children, ...props }) => {
    const isBlock = className?.startsWith('language-')
    if (className === 'language-mermaid') {
      return <MermaidDiagram code={toText(children)} />
    }
    if (isBlock) {
      return (
        <pre style={{
          background: 'var(--surface-muted)',
          borderRadius: 'var(--radius)',
          padding: 16,
          overflowX: 'auto',
          fontSize: 13,
        }}>
          <code className={`font-mono ${className ?? ''}`} {...props}>{children}</code>
        </pre>
      )
    }
    return (
      <code className="font-mono" style={{
        background: 'var(--surface-muted)',
        padding: '1px 4px',
        borderRadius: 3,
        fontSize: '0.9em',
      }} {...props}>
        {children}
      </code>
    )
  },
  table: ({ children, ...props }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }} {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid var(--border)', fontWeight: 600 }} {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }} {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote style={{
      borderLeft: '3px solid var(--primary)',
      paddingLeft: 16,
      margin: '16px 0',
      color: 'var(--foreground-muted)',
    }} {...props}>
      {children}
    </blockquote>
  ),
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div style={{ lineHeight: 1.7, color: 'var(--foreground)' }}>
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
