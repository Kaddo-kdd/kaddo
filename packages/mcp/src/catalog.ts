// Shared catalog helpers (VS-057): capsules and installed agent prompts.
// Read-only; reads only external/, .kaddo/external.yml and knowledge/agents/**.

import matter from 'gray-matter'
import { listFiles, readText, readYaml } from './project.js'

export type CapsuleSummary = {
  id: string
  path: string
  owner?: string
  system?: string
  purpose?: string
  updated_at?: string
}

type ExternalRegistry = { external?: { id: string; path: string; owner?: string }[] }

function sectionParagraph(md: string, title: string): string {
  const lines = md.split(/\r?\n/)
  const re = new RegExp(`^##\\s+${title}\\s*$`, 'i')
  const start = lines.findIndex((l) => re.test(l))
  if (start < 0) return ''
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) break
    const t = lines[i].trim()
    if (t && !/^_.*_$/.test(t)) return t
  }
  return ''
}

/** List external Knowledge Capsules from `.kaddo/external.yml`, enriched from the capsule files. */
export function listCapsules(root: string): CapsuleSummary[] {
  const registry = readYaml<ExternalRegistry>(root, '.kaddo/external.yml')
  const entries = Array.isArray(registry?.external) ? registry!.external : []
  return entries.map((e) => {
    const md = e.path ? readText(root, e.path) : null
    let system: string | undefined
    let updated_at: string | undefined
    let purpose: string | undefined
    if (md) {
      try {
        const { data } = matter(md)
        system = data.system ? String(data.system) : undefined
        updated_at = data.updated_at ? String(data.updated_at) : undefined
      } catch {
        // ignore parse errors — keep registry fields only
      }
      purpose = sectionParagraph(md, 'Purpose') || undefined
    }
    return { id: e.id, path: e.path, owner: e.owner, system, updated_at, purpose }
  })
}

export function getCapsule(root: string, id: string): { id: string; path: string; content: string } | null {
  const entry = listCapsules(root).find((c) => c.id === id)
  if (!entry) return null
  const content = readText(root, entry.path)
  if (content === null) return null
  return { id: entry.id, path: entry.path, content }
}

export type AgentInfo = {
  name: string
  path: string
  group: string
  description: string
}

function firstHeadingOrLine(md: string): string {
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    return t.replace(/\s+/g, ' ').slice(0, 200)
  }
  return ''
}

/** List installed agent prompts under knowledge/agents/** (per-layer folders or flat). */
export function listAgents(root: string): AgentInfo[] {
  const files = listFiles(root, 'knowledge/agents', '-agent.md')
  return files.map((rel) => {
    const segs = rel.split('/')
    const file = segs[segs.length - 1]
    const group = segs.length >= 3 ? segs[segs.length - 2] : 'agents'
    const md = readText(root, rel) ?? ''
    return {
      name: file.replace(/\.md$/, ''),
      path: rel,
      group,
      description: firstHeadingOrLine(md),
    }
  })
}

export function getAgentPrompt(root: string, name: string): AgentInfo & { content: string } | null {
  const want = name.replace(/\.md$/, '')
  const info = listAgents(root).find((a) => a.name === want)
  if (!info) return null
  const content = readText(root, info.path)
  if (content === null) return null
  return { ...info, content }
}
