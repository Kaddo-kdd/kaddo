// Work Item lifecycle model (VS-041).
//
// Deterministic helpers that resolve a Work Item's lifecycle state and organize the
// `knowledge/delivery/work-items/` folder as an active workspace. No LLM, no git — pure logic.
//
// Agent note: only `draft`, `ready`, `in-progress` and `blocked` are ACTIVE work. `completed`
// and `archived` are historical and must not dominate the context sent to an LLM.

export const LIFECYCLE_STATES = [
  'draft',
  'ready',
  'in-progress',
  'blocked',
  'completed',
  'archived',
] as const

export type LifecycleState = (typeof LIFECYCLE_STATES)[number]

/** Operational states: work that still needs attention. */
export const ACTIVE_STATES: readonly LifecycleState[] = ['draft', 'ready', 'in-progress', 'blocked']

/** Historical states: knowledge, not active work. */
export const HISTORICAL_STATES: readonly LifecycleState[] = ['completed', 'archived']

/** Valid lifecycle transitions (model only — no command enforces these yet). */
export const LIFECYCLE_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  draft: ['ready'],
  ready: ['in-progress'],
  'in-progress': ['completed', 'blocked'],
  blocked: ['ready'],
  completed: ['archived'],
  archived: [],
}

// Back-compat mapping for pre-lifecycle statuses (VS-035 used in-progress/done/cancelled).
const LEGACY_STATUS_MAP: Record<string, LifecycleState> = {
  done: 'completed',
  cancelled: 'archived',
  canceled: 'archived',
  'in-progress': 'in-progress',
}

const STATE_SET = new Set<string>(LIFECYCLE_STATES)

function isLifecycleState(s: string): s is LifecycleState {
  return STATE_SET.has(s)
}

export function isActiveState(s: LifecycleState): boolean {
  return ACTIVE_STATES.includes(s)
}

/** The lifecycle subfolder a file lives in under work-items/, or null. */
export function lifecycleFolderOf(filePath: string): LifecycleState | null {
  const p = filePath.replace(/\\/g, '/')
  const m = p.match(/\/delivery\/work-items\/([^/]+)\//)
  if (m && isLifecycleState(m[1])) return m[1]
  return null
}

/**
 * Resolve a Work Item's lifecycle state, in priority order:
 * 1. front-matter `status` if it is a valid lifecycle state;
 * 2. legacy status mapping (done → completed, cancelled → archived, in-progress → in-progress);
 * 3. the work-items subfolder it lives in;
 * 4. fallback `ready` (a flat work-items/*.md with no recognizable status).
 */
export function lifecycleStateOf(item: { status?: string; filePath?: string }): LifecycleState {
  const status = (item.status ?? '').trim().toLowerCase()
  if (isLifecycleState(status)) return status
  if (status && LEGACY_STATUS_MAP[status]) return LEGACY_STATUS_MAP[status]
  const folder = lifecycleFolderOf(item.filePath ?? '')
  if (folder) return folder
  return 'ready'
}

/** Zeroed counts for every lifecycle state. */
export function emptyLifecycleCounts(): Record<LifecycleState, number> {
  return Object.fromEntries(LIFECYCLE_STATES.map((s) => [s, 0])) as Record<LifecycleState, number>
}

/** Count a list of states by lifecycle state. */
export function lifecycleCounts(states: LifecycleState[]): Record<LifecycleState, number> {
  const counts = emptyLifecycleCounts()
  for (const s of states) counts[s]++
  return counts
}
