import { type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPlanningInsights } from '../lib/api'
import type { InsightArtifactKind } from '../lib/api'
import { prioritizeActions, DEFAULT_ACTION_CAP, type NextAction, type ActionTier } from '../lib/next-actions'

// WI-088 — the action-first "What's next" block. Shows up to three canonical actions (never invented),
// each with verb · artifact · verifiable reason · contextual CTA, derived deterministically from the SAME
// /planning/insights projection the Diagnostics view uses. Legit pending dependencies are shown as blocking
// CONTEXT, not incidents. When a signal has no navigable destination the CTA inspects, never promising a fix.

// Colour follows canonical severity, so the card never contradicts the indicators: only a real block (tier
// 1) is red; "needs review / decision" is amber; active work is accent; a data-quality note is muted — never
// red, never shown as a critical block (WI-088 feedback #1/#3).
const TIER_META: Record<ActionTier, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'blocking', color: 'var(--danger)', bg: 'var(--danger-bg, rgba(197,48,48,0.08))', border: 'var(--danger)' },
  2: { label: 'needs review', color: 'var(--warning, #b7791f)', bg: 'var(--surface)', border: 'var(--warning, #b7791f)' },
  3: { label: 'active', color: 'var(--primary)', bg: 'var(--surface)', border: 'var(--border)' },
  4: { label: 'data quality', color: 'var(--foreground-muted)', bg: 'var(--surface)', border: 'var(--border)' },
}
const KIND_LABEL: Record<InsightArtifactKind, string> = { plan: 'Plan', epic: 'Epic', initiative: 'Initiative', 'work-item': 'Work Item' }

export function NextActions({ onOpen, onOpenDiagnostics }: {
  onOpen: (kind: InsightArtifactKind, id: string, section?: string) => void
  onOpenDiagnostics: () => void
}) {
  const q = useQuery({ queryKey: ['planning', 'insights'], queryFn: getPlanningInsights, retry: false })

  if (q.isLoading) return <section style={card}><Head /><p style={muted}>Finding the next actions…</p></section>
  if (q.error) return <section style={card}><Head /><p style={{ ...muted, color: 'var(--danger)' }}>{(q.error as Error).message}</p></section>
  const ins = q.data
  if (!ins) return null

  const { actions, blocking, dataQuality, totalFindings } = prioritizeActions(ins)
  const shown = actions.slice(0, DEFAULT_ACTION_CAP)
  // Data-quality notes not already shown as a card — surfaced quietly, never as a critical block.
  const shownIds = new Set(shown.map((a) => a.artifactId))
  const dqRest = dataQuality.filter((a) => !shownIds.has(a.artifactId)).length

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Head />
        {totalFindings > 0 && <span style={{ ...muted, fontSize: 12 }}>{shown.length} of {totalFindings} signal{totalFindings === 1 ? '' : 's'} · deterministic</span>}
      </div>

      {shown.length === 0 ? (
        <div style={{ marginTop: 8 }}>
          <p style={muted}>Nothing needs an action right now. Everything with a canonical signal is resolved or waiting on a dependency.</p>
          <button style={linkBtn} onClick={onOpenDiagnostics}>Open Diagnostics</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {shown.map((a) => <ActionRow key={`${a.artifactId}:${a.verb}`} a={a} onOpen={onOpen} />)}
        </div>
      )}

      {dqRest > 0 && (
        <div style={note}>
          <span aria-hidden="true">◦</span>
          <span>
            {dqRest} provenance / data-quality note{dqRest === 1 ? '' : 's'} — historical references and coverage, not operational blocks.{' '}
            <button style={linkBtnInline} onClick={onOpenDiagnostics}>Review in Diagnostics</button>
          </span>
        </div>
      )}

      {blocking.length > 0 && (
        <div style={note}>
          <span aria-hidden="true">🔗</span>
          <span>
            {blocking.length} item{blocking.length === 1 ? '' : 's'} blocked by pending dependencies — normal sequencing, not errors.{' '}
            <button style={linkBtnInline} onClick={onOpenDiagnostics}>View blocking context</button>
          </span>
        </div>
      )}
    </section>
  )
}

function Head() {
  return <h3 style={{ margin: 0, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ color: 'var(--primary)' }}>→</span> What's next</h3>
}

function ActionRow({ a, onOpen }: { a: NextAction; onOpen: (kind: InsightArtifactKind, id: string, section?: string) => void }) {
  const t = TIER_META[a.tier]
  return (
    <div style={{ ...row, borderColor: t.border, background: t.bg }}>
      <span style={{ ...tierTag, color: t.color }}>{a.tier} · {t.label}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14 }}><strong style={{ fontWeight: 600 }}>{a.verb}</strong> · <span style={mono}>{a.artifactId}</span> <span style={muted}>{a.artifactTitle}</span></div>
        <div style={{ ...muted, marginTop: 2 }}>{a.reason}</div>
      </div>
      {a.hasDestination
        ? <button style={cta} onClick={() => onOpen(a.artifactKind, a.artifactId, a.section)}>{a.cta} →</button>
        : <span style={{ ...muted, fontSize: 12, alignSelf: 'center' }}>Inspect in {KIND_LABEL[a.artifactKind]} — no linked destination</span>}
    </div>
  )
}

const card: CSSProperties = { border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', padding: 16, marginTop: 16 }
const muted: CSSProperties = { color: 'var(--foreground-muted)', fontSize: 13 }
const mono: CSSProperties = { fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }
const row: CSSProperties = { display: 'flex', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', alignItems: 'flex-start' }
const tierTag: CSSProperties = { fontSize: 11, fontWeight: 600, background: 'var(--surface)', borderRadius: 999, padding: '1px 8px', height: 'fit-content', whiteSpace: 'nowrap' }
const cta: CSSProperties = { padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', color: 'var(--primary)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', alignSelf: 'center', whiteSpace: 'nowrap', flex: '0 0 auto' }
const note: CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, padding: '8px 12px', borderLeft: '3px solid var(--border-strong, var(--border))', background: 'var(--background)', fontSize: 12, color: 'var(--foreground-muted)' }
const linkBtn: CSSProperties = { marginTop: 8, padding: '6px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--background)', color: 'var(--foreground)', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }
const linkBtnInline: CSSProperties = { background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }
