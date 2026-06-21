// Skills catalog for the MCP server (VS-059). Read-only: lists installed skill definitions under
// knowledge/skills/**/skill.md and returns their content. Never executes anything.

import matter from 'gray-matter'
import { listFiles, readText } from './project.js'

export type SkillSummary = {
  id: string
  title: string
  group: string
  applies_to: string[]
  path: string
}

function firstHeadingOrLine(md: string): string {
  for (const line of md.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.startsWith('---')) continue
    return t.replace(/\s+/g, ' ').slice(0, 200)
  }
  return ''
}

/** List installed skills (one per knowledge/skills/<id>/skill.md). */
export function listSkills(root: string): SkillSummary[] {
  const files = listFiles(root, 'knowledge/skills', 'skill.md')
  const out: SkillSummary[] = []
  for (const rel of files) {
    const raw = readText(root, rel)
    if (raw === null) continue
    let data: Record<string, unknown> = {}
    try {
      data = matter(raw).data as Record<string, unknown>
    } catch {
      // keep folder-derived id
    }
    if (data.type && String(data.type) !== 'skill') continue
    const folder = rel.split('/').slice(-2)[0]
    out.push({
      id: String(data.id ?? folder),
      title: String(data.title ?? folder),
      group: String(data.group ?? 'unknown'),
      applies_to: Array.isArray(data.applies_to) ? data.applies_to.map(String).filter(Boolean) : [],
      path: rel,
    })
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

export function getSkill(root: string, id: string): (SkillSummary & { content: string; description: string }) | null {
  const want = id.replace(/\.md$/, '')
  const info = listSkills(root).find((s) => s.id === want)
  if (!info) return null
  const content = readText(root, info.path)
  if (content === null) return null
  return { ...info, content, description: firstHeadingOrLine(content) || info.title }
}
