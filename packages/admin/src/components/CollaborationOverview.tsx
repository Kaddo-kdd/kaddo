import { useState } from 'react'
import type { CollaborationAggregate } from '../lib/api'

// WI-085 — Collaboration overview: summary first, then progressive disclosure of the full activity. The
// declared responsibility, Git availability and observed counts always show up front; the commit list and
// traceability render a bounded number of rows (never ~100 on open) with a "Show more" to reach the rest.
// Declared responsibility and observed Git activity stay separate; "0 linked commits" never implies no work.

const PAGE = 10

export function CollaborationOverview({ data, loading, error, onOpenWorkItem }: { data?: CollaborationAggregate; loading: boolean; error: boolean; onOpenWorkItem: (id: string) => void }) {
  const [commitsShown, setCommitsShown] = useState(PAGE)
  const [traceShown, setTraceShown] = useState(PAGE)
  return <section style={{ marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Collaboration overview</h3>
    <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--foreground-muted)' }}>Declared responsibility is planning metadata. Git activity is read-only evidence, not a productivity measure or an ownership change.</p>
    {loading && <p style={{ color: 'var(--foreground-muted)', fontSize: 13 }}>Reading bounded local Git activity…</p>}
    {error && <p style={{ color: 'var(--foreground-muted)', fontSize: 13 }}>Git activity is unavailable. Declared responsibility remains available.</p>}
    {data && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div><strong style={{ fontSize: 12 }}>DECLARED RESPONSIBILITY</strong><p style={{ fontSize: 13 }}>Owners: {data.responsibility.owners.join(', ') || 'Unassigned'}<br />Contributors: {data.responsibility.contributors.join(', ') || 'None declared'}</p></div>
        <div><strong style={{ fontSize: 12 }}>OBSERVED GIT ACTIVITY</strong><p style={{ fontSize: 13 }}>Authors: {data.observedAuthors.join(', ') || 'No linked activity'}<br />Git: {data.git.availability} · {data.git.inspectedAt ?? 'Not inspected'}</p></div>
        <div><strong style={{ fontSize: 12 }}>COVERAGE</strong><p style={{ fontSize: 13 }}>{data.git.repositories.join(', ') || 'No repository'}<br />{data.git.coverage.inspectedCommits} commits inspected · {data.linkedCommits.length} linked · {data.workItems.length} traceable Work Item(s)</p></div>
      </div>
      {data.git.availability === 'partial' && <p style={{ fontSize: 13, color: 'var(--warning)' }}>Partial observation: results are limited to repositories and history that could be read.</p>}
      {data.linkedCommits.length > 0 && <div style={{ fontSize: 13 }}>
        <strong>Linked commits</strong> <span style={{ color: 'var(--foreground-muted)' }}>({data.linkedCommits.length})</span>
        {data.linkedCommits.slice(0, commitsShown).map((commit) => <div key={`${commit.repository}:${commit.sha}`} style={{ marginTop: 8 }}><code>{commit.sha.slice(0, 8)}</code> · {commit.author} · {commit.subject}<br />{commit.workItemIds.map((id, index) => <span key={id}>{index > 0 && ', '}<button onClick={() => onOpenWorkItem(id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }}>{id}</button></span>)} · <span style={{ color: 'var(--foreground-muted)' }}>{commit.evidence}</span></div>)}
        {commitsShown < data.linkedCommits.length && <button onClick={() => setCommitsShown((n) => n + 20)} style={moreBtn}>Show more commits ({data.linkedCommits.length - commitsShown} more)</button>}
      </div>}
      {data.workItems.length > 0 && <div style={{ marginTop: 14, fontSize: 13 }}>
        <strong>Traceability</strong> <span style={{ color: 'var(--foreground-muted)' }}>({data.workItems.length})</span>
        {data.workItems.slice(0, traceShown).map((item) => <div key={item.id} style={{ marginTop: 5 }}><button onClick={() => onOpenWorkItem(item.id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }}>{item.id}</button> · {item.linkedCommitCount} linked commit(s){item.owners.length === 0 && ' · unassigned'}</div>)}
        {traceShown < data.workItems.length && <button onClick={() => setTraceShown((n) => n + 20)} style={moreBtn}>Show more Work Items ({data.workItems.length - traceShown} more)</button>}
      </div>}
    </>}
  </section>
}

const moreBtn = { marginTop: 10, padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 } as const
