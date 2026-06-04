// Work Item delivery lifecycle (VS work-item-delivery-workflow).
//
// Deterministic helpers to detect active Work Items and render the official delivery
// lifecycle Kaddo recommends. Kaddo never creates branches, commits or merges — these are
// suggestions only.

import { exists, join } from '../utils/fs.js'
import { readArtifacts, type Artifact } from '../services/artifact-reader.js'

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

/** Active Work Items: under delivery/work-items/, typed, status in-progress. */
export function activeWorkItems(dir: string): ActiveWorkItem[] {
  const archDir = join(dir, 'knowledge')
  if (!exists(archDir)) return []
  return readArtifacts(archDir)
    .filter((a) => isWorkItem(a) && a.status === 'in-progress')
    .map((a) => {
      const id = a.id || a.title || 'WI'
      return { id, title: a.title || id, type: a.type, slug: slugify(a.title || id) }
    })
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
    'Delivery lifecycle (Kaddo never runs git for you):',
    `  1. Create a branch          e.g. ${suggestedBranch(wi)}`,
    '  2. Implement the work item',
    '  3. Run `kaddo scan`         (after new modules/migrations/contracts)',
    '  4. Run `kaddo owners suggest`  → confirm code: globs',
    '  5. Run `kaddo guard`        before committing (detect knowledge drift)',
    '  6. Update knowledge         ADR / capabilities.md / current-state.md as needed',
    '  7. Review (human)',
    `  8. Commit                   e.g. ${suggestedCommit(wi)}`,
  ]
}
