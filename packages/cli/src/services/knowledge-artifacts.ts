// Unified knowledge artifact discovery (VS-046).
//
// THE single source of truth for "what knowledge exists in this project". Every command
// (explain, context, understand, owners suggest, guard) consumes this so they can never disagree
// about which artifacts exist. Discovery is deterministic, recursive and front-matter-aware.
//
// Discovery priority: front matter (type) → known path/layer → file-name conventions.

import { exists, join } from '../utils/fs.js'
import { readArtifacts, type Artifact } from './artifact-reader.js'
import { lifecycleStateOf, type LifecycleState } from '../core/lifecycle.js'

const ARCH_DIR = 'knowledge'

export type KnowledgeLayer =
  | 'business'
  | 'product'
  | 'tech'
  | 'delivery'
  | 'module'
  | 'unknown'

export type KnowledgeArtifact = Artifact & {
  /** POSIX path relative to the project root, e.g. knowledge/delivery/work-items/ready/WI-001.md */
  relPath: string
  /** Knowledge layer resolved from path/front matter. */
  layer: KnowledgeLayer
  /** True when this artifact is a Work Item (under delivery/work-items/** with a type). */
  isWorkItem: boolean
  /** Lifecycle state for Work Items (undefined for non-work-items). */
  lifecycle?: LifecycleState
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

function relativeTo(dir: string, filePath: string): string {
  const base = toPosix(dir).replace(/\/+$/, '')
  const full = toPosix(filePath)
  return full.startsWith(base + '/') ? full.slice(base.length + 1) : full
}

/** A Work Item is any typed artifact under knowledge/delivery/work-items/** (recursively). */
export function isWorkItemArtifact(a: Pick<Artifact, 'filePath' | 'type'>): boolean {
  return toPosix(a.filePath).includes('/delivery/work-items/') && Boolean(a.type)
}

function classifyLayer(posixPath: string): KnowledgeLayer {
  if (posixPath.includes('/knowledge/business/')) return 'business'
  if (posixPath.includes('/knowledge/product/')) return 'product'
  if (posixPath.includes('/knowledge/tech/modules/') || posixPath.includes('/knowledge/modules/'))
    return 'module'
  if (posixPath.includes('/knowledge/tech/')) return 'tech'
  if (posixPath.includes('/knowledge/delivery/')) return 'delivery'
  return 'unknown'
}

function enrich(dir: string, a: Artifact): KnowledgeArtifact {
  const posix = toPosix(a.filePath)
  const isWi = isWorkItemArtifact(a)
  return {
    ...a,
    relPath: relativeTo(dir, a.filePath),
    layer: classifyLayer(posix),
    isWorkItem: isWi,
    lifecycle: isWi ? lifecycleStateOf({ status: a.status, filePath: a.filePath }) : undefined,
  }
}

/**
 * Discover every knowledge artifact under `knowledge/` (recursively). Skips files with invalid or
 * absent front matter via the shared reader. This is the canonical catalog.
 */
export function discoverKnowledge(dir: string): KnowledgeArtifact[] {
  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) return []
  return readArtifacts(archDir).map((a) => enrich(dir, a))
}

/** All Work Items, discovered recursively across lifecycle subfolders. */
export function discoverWorkItems(dir: string): KnowledgeArtifact[] {
  return discoverKnowledge(dir).filter((a) => a.isWorkItem)
}
