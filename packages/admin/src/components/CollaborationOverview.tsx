import type { CollaborationAggregate } from '../lib/api'

export function CollaborationOverview({ data, loading, error, onOpenWorkItem }: { data?: CollaborationAggregate; loading: boolean; error: boolean; onOpenWorkItem: (id: string) => void }) {
  return <section style={{ marginTop: 20, padding: 18, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Collaboration overview</h3>
    <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--foreground-muted)' }}>Declared responsibility is planning metadata. Git activity is read-only evidence, not a productivity measure or an ownership change.</p>
    {loading && <p style={{ color: 'var(--foreground-muted)', fontSize: 13 }}>Reading bounded local Git activity…</p>}
    {error && <p style={{ color: 'var(--foreground-muted)', fontSize: 13 }}>Git activity is unavailable. Declared responsibility remains available.</p>}
    {data && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <div><strong style={{ fontSize: 12 }}>DECLARED RESPONSIBILITY</strong><p style={{ fontSize: 13 }}>Owners: {data.responsibility.owners.join(', ') || 'Unassigned'}<br />Contributors: {data.responsibility.contributors.join(', ') || 'None declared'}</p></div>
        <div><strong style={{ fontSize: 12 }}>OBSERVED GIT ACTIVITY</strong><p style={{ fontSize: 13 }}>Authors: {data.observedAuthors.join(', ') || 'No linked activity'}<br />Git: {data.git.availability} · {data.git.inspectedAt ?? 'Not inspected'}</p></div>
        <div><strong style={{ fontSize: 12 }}>COVERAGE</strong><p style={{ fontSize: 13 }}>{data.git.repositories.join(', ') || 'No repository'}<br />{data.git.coverage.inspectedCommits} commits inspected</p></div>
      </div>
      {data.git.availability === 'partial' && <p style={{ fontSize: 13, color: 'var(--warning)' }}>Partial observation: results are limited to repositories and history that could be read.</p>}
      {data.linkedCommits.length > 0 && <div style={{ fontSize: 13 }}><strong>Linked commits</strong>{data.linkedCommits.map((commit) => <div key={`${commit.repository}:${commit.sha}`} style={{ marginTop: 8 }}><code>{commit.sha.slice(0, 8)}</code> · {commit.author} · {commit.subject}<br />{commit.workItemIds.map((id, index) => <span key={id}>{index > 0 && ', '}<button onClick={() => onOpenWorkItem(id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }}>{id}</button></span>)} · <span style={{ color: 'var(--foreground-muted)' }}>{commit.evidence}</span></div>)}</div>}
      {data.workItems.length > 0 && <div style={{ marginTop: 14, fontSize: 13 }}><strong>Traceability</strong>{data.workItems.map((item) => <div key={item.id} style={{ marginTop: 5 }}><button onClick={() => onOpenWorkItem(item.id)} style={{ background: 'none', border: 0, padding: 0, color: 'var(--primary)', cursor: 'pointer', font: 'inherit' }}>{item.id}</button> · {item.linkedCommitCount} linked commit(s){item.owners.length === 0 && ' · unassigned'}</div>)}</div>}
    </>}
  </section>
}
