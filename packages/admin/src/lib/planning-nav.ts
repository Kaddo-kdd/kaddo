import type { InsightArtifactKind } from './api'

// WI-088 — contextual navigation. Opening an Initiative or Work Item from Planning keeps a return path in a
// URL search param (`from` = the origin path incl. hash, `fromLabel` = a human label). Because it lives in
// the URL, deep links, reload and browser back/forward all work, and the existing GLOBAL routes still
// resolve with no context. No new routes, no Core change.

export type FromContext = { from?: string; fromLabel?: string }

/** Route `validateSearch`: accept only a safe internal return path + short label. */
export function validateFromSearch(search: Record<string, unknown>): FromContext {
  const from = typeof search.from === 'string' && search.from.startsWith('/') ? search.from : undefined
  const fromLabel = typeof search.fromLabel === 'string' ? search.fromLabel.slice(0, 80) : undefined
  return { ...(from ? { from } : {}), ...(fromLabel ? { fromLabel } : {}) }
}

type NavTarget =
  | { to: '/planning/plans/$id'; params: { id: string } }
  | { to: '/planning/epics/$id'; params: { id: string } }
  | { to: '/initiatives/$initiativeId'; params: { initiativeId: string } }
  | { to: '/work-items/$workItemId'; params: { workItemId: string } }

/** The typed route + params for an artifact kind, so navigation never parses a raw link string. */
export function navTargetFor(kind: InsightArtifactKind, id: string): NavTarget {
  switch (kind) {
    case 'plan': return { to: '/planning/plans/$id', params: { id } }
    case 'epic': return { to: '/planning/epics/$id', params: { id } }
    case 'initiative': return { to: '/initiatives/$initiativeId', params: { initiativeId: id } }
    case 'work-item': return { to: '/work-items/$workItemId', params: { workItemId: id } }
  }
}

/** Build the `from` value for the current Planning location (path + optional section hash). */
export function originFrom(path: string, section?: string): string {
  return section ? `${path}#${section}` : path
}
