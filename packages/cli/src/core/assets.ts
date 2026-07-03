// Installed asset (agent/skill) version status (VS-074.2).
//
// The CLI version does not guarantee the version of the agents/skills installed in a project. This
// module compares each installed agent/skill against the canonical asset shipped by the current
// package and classifies it. Deterministic and read-only — no LLM, no git, no writes (the update
// command does the writing).

import matter from 'gray-matter'
import { exists, readFile, join } from '../utils/fs.js'
import { KADDO_VERSION } from './version.js'
import { AGENT_PROMPTS } from '../agents/prompts.js'
import { agentInstallPath } from '../agents/groups.js'
import { withAgentFrontMatter } from '../modules/agents.js'
import { SKILLS, skillInstallPath } from '../skills/skills.js'

export type AssetKind = 'agent' | 'skill'
export type AssetState = 'up-to-date' | 'outdated' | 'missing' | 'unknown-version' | 'modified'

export type AssetStatus = {
  name: string
  path: string
  installed: string | null
  available: string
  state: AssetState
}

export type AssetsSummary = {
  total: number
  up_to_date: number
  outdated: number
  missing: number
  unknown_version: number
  modified: number
  items: AssetStatus[]
}

type CanonicalAsset = { name: string; path: string; content: string }

/** The canonical agent assets shipped by this package (name = agent file id). */
export function canonicalAgents(): CanonicalAsset[] {
  return AGENT_PROMPTS.map((a) => ({
    name: a.fileName.replace(/\.md$/, ''),
    path: agentInstallPath(a.fileName),
    content: withAgentFrontMatter(a.fileName, a.content),
  }))
}

/** The canonical skill assets shipped by this package (name = skill id). */
export function canonicalSkills(): CanonicalAsset[] {
  return SKILLS.map((s) => ({ name: s.id, path: skillInstallPath(s.id), content: s.content }))
}

function versionOf(content: string): string | null {
  try {
    const v = matter(content).data.version
    return v === undefined || v === null ? null : String(v)
  } catch {
    return null
  }
}

/** Simple semver-ish compare (numeric segments). Returns -1/0/1. */
function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

function classify(dir: string, asset: CanonicalAsset): AssetStatus {
  const full = join(dir, asset.path)
  const base = { name: asset.name, path: asset.path, available: KADDO_VERSION }
  if (!exists(full)) return { ...base, installed: null, state: 'missing' }
  let content = ''
  try {
    content = readFile(full)
  } catch {
    return { ...base, installed: null, state: 'missing' }
  }
  const installed = versionOf(content)
  if (installed === null) return { ...base, installed: null, state: 'unknown-version' }
  const cmp = cmpVersion(installed, KADDO_VERSION)
  if (cmp < 0) return { ...base, installed, state: 'outdated' }
  // Same (or newer) version: modified if the content diverges from the canonical asset.
  if (content.trim() !== asset.content.trim()) return { ...base, installed, state: 'modified' }
  return { ...base, installed, state: 'up-to-date' }
}

function summarize(items: AssetStatus[]): AssetsSummary {
  const count = (s: AssetState) => items.filter((i) => i.state === s).length
  return {
    total: items.length,
    up_to_date: count('up-to-date'),
    outdated: count('outdated'),
    missing: count('missing'),
    unknown_version: count('unknown-version'),
    modified: count('modified'),
    items,
  }
}

/** Status of every catalog asset of a kind, relative to the current package version. */
export function assetStatus(dir: string, kind: AssetKind): AssetsSummary {
  const catalog = kind === 'agent' ? canonicalAgents() : canonicalSkills()
  return summarize(catalog.map((a) => classify(dir, a)))
}

/** Compact summary for explain / context / MCP: agents + skills counts (installed only). */
export function installedAssetsSummary(dir: string): {
  version: string
  agents: AssetsSummary
  skills: AssetsSummary
} {
  return { version: KADDO_VERSION, agents: assetStatus(dir, 'agent'), skills: assetStatus(dir, 'skill') }
}
