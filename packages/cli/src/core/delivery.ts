// Work Item delivery lifecycle (VS work-item-delivery-workflow).
//
// Deterministic helpers to detect active Work Items and render the official delivery
// lifecycle Kaddo recommends. Kaddo never creates branches, commits or merges — these are
// suggestions only.

import { exists, readFile, join } from '../utils/fs.js'
import { parse as parseYaml } from 'yaml'
import { readArtifacts, type Artifact } from '../services/artifact-reader.js'

const DEFAULT_BRANCH_PATTERN = '{type}/{workItemId}-{slug}'

/** Branch-naming pattern from the project's Git strategy (.kaddo/git.yml), or the default. */
export function branchPattern(dir: string): string {
  const p = join(dir, '.kaddo', 'git.yml')
  if (!exists(p)) return DEFAULT_BRANCH_PATTERN
  try {
    const cfg = parseYaml(readFile(p)) as { branchNaming?: { pattern?: string } }
    return cfg.branchNaming?.pattern || DEFAULT_BRANCH_PATTERN
  } catch {
    return DEFAULT_BRANCH_PATTERN
  }
}

/** Build the branch name for a Work Item using the project's Git strategy pattern. */
export function branchNameFor(dir: string, wi: ActiveWorkItem): string {
  return branchPattern(dir)
    .replace(/\{type\}/g, branchPrefix(wi.type))
    .replace(/\{workItemId\}/g, wi.id)
    .replace(/\{id\}/g, wi.id)
    .replace(/\{slug\}/g, wi.slug)
}

export type ActiveWorkItem = { id: string; title: string; type: string; slug: string }

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function isWorkItem(a: Artifact): boolean {
  return a.filePath.replace(/\\/g, '/').includes('/delivery/work-items/') && Boolean(a.type)
}

function toActive(a: Artifact): ActiveWorkItem {
  const id = a.id || a.title || 'WI'
  return { id, title: a.title || id, type: a.type, slug: slugify(a.title || id) }
}

/** All Work Items under delivery/work-items/ (typed). */
export function allWorkItems(dir: string): ActiveWorkItem[] {
  const archDir = join(dir, 'knowledge')
  if (!exists(archDir)) return []
  return readArtifacts(archDir)
    .filter(isWorkItem)
    .map(toActive)
}

/** Active Work Items: under delivery/work-items/, typed, status in-progress. */
export function activeWorkItems(dir: string): ActiveWorkItem[] {
  const archDir = join(dir, 'knowledge')
  if (!exists(archDir)) return []
  return readArtifacts(archDir)
    .filter((a) => isWorkItem(a) && a.status === 'in-progress')
    .map(toActive)
}

/**
 * Resolve which Work Item to start a branch for: the given id, or the single active one.
 * Returns the work item, or an error reason.
 */
export function resolveStartTarget(
  dir: string,
  id?: string
): { wi: ActiveWorkItem } | { error: string } {
  const all = allWorkItems(dir)
  if (id) {
    const wi = all.find((w) => w.id === id)
    return wi ? { wi } : { error: `Work Item "${id}" not found under knowledge/delivery/work-items/.` }
  }
  const active = activeWorkItems(dir)
  if (active.length === 1) return { wi: active[0] }
  if (active.length === 0)
    return { error: 'No active Work Item. Pass an id: `kaddo start <work-item-id>`.' }
  return {
    error: `Multiple active Work Items (${active
      .map((w) => w.id)
      .join(', ')}). Pass one: \`kaddo start <work-item-id>\`.`,
  }
}

/** Branch prefix recommended for a work-item type (GitHub Flow). */
export function branchPrefix(type: string): string {
  switch (type) {
    case 'bugfix':
      return 'bugfix'
    case 'hotfix':
      return 'hotfix'
    case 'spike':
      return 'spike'
    default:
      return 'feature'
  }
}

/** Conventional-commit type for a work-item type. */
export function commitPrefix(type: string): string {
  switch (type) {
    case 'bugfix':
    case 'hotfix':
      return 'fix'
    case 'spike':
      return 'chore'
    default:
      return 'feat'
  }
}

export function suggestedBranch(wi: ActiveWorkItem): string {
  return `${branchPrefix(wi.type)}/${wi.id}-${wi.slug}`
}

export function suggestedCommit(wi: ActiveWorkItem): string {
  return `${commitPrefix(wi.type)}: ${wi.title.toLowerCase()}`
}

/** Render the delivery lifecycle for an active Work Item (terminal lines). */
export function renderDeliveryLifecycle(wi: ActiveWorkItem): string[] {
  return [
    `Active work item: ${wi.id} — ${wi.title}`,
    '',
    'Delivery lifecycle (Kaddo creates the branch; it never commits, pushes or merges):',
    `  1. Run \`kaddo start ${wi.id}\`   → branch ${suggestedBranch(wi)}`,
    '  2. Implement the work item',
    '  3. Run `kaddo scan`         (after new modules/migrations/contracts)',
    '  4. Run `kaddo owners suggest`  → confirm code: globs',
    '  5. Run `kaddo guard`        before committing (detect knowledge drift)',
    '  6. Update knowledge         ADR / capabilities.md / current-state.md as needed',
    '  7. Review (human)',
    `  8. Commit (you)             e.g. ${suggestedCommit(wi)}`,
  ]
}
