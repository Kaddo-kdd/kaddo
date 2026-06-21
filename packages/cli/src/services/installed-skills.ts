// Installed-skill discovery (VS-059).
//
// Reads the skill definitions a project has installed under knowledge/skills/**/skill.md. Pure
// front-matter reads — never executes anything. Used by context/explain/understand to summarize
// available skills without inlining their full content.

import matter from 'gray-matter'
import { exists, readDir, readFile, join, isDir, isFile } from '../utils/fs.js'

export type InstalledSkill = {
  id: string
  title: string
  group: string
  appliesTo: string[]
  relPath: string
}

const SKILLS_DIR = join('knowledge', 'skills')

/** Discover installed skills (one per knowledge/skills/<id>/skill.md). */
export function discoverInstalledSkills(dir: string): InstalledSkill[] {
  const base = join(dir, SKILLS_DIR)
  if (!exists(base) || !isDir(base)) return []
  const out: InstalledSkill[] = []
  for (const entry of readDir(base)) {
    const skillFile = join(base, entry, 'skill.md')
    if (!isFile(skillFile)) continue
    try {
      const { data } = matter(readFile(skillFile))
      if (data.type && String(data.type) !== 'skill') continue
      const id = String(data.id ?? entry)
      out.push({
        id,
        title: String(data.title ?? id),
        group: String(data.group ?? 'unknown'),
        appliesTo: Array.isArray(data.applies_to) ? data.applies_to.map(String).filter(Boolean) : [],
        relPath: `${SKILLS_DIR.replace(/\\/g, '/')}/${entry}/skill.md`,
      })
    } catch {
      // skip unreadable skill
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

/** Count installed skills per group. */
export function skillGroupCounts(skills: InstalledSkill[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of skills) counts[s.group] = (counts[s.group] ?? 0) + 1
  return counts
}

/** Installed skill ids that apply to any of the given agents. */
export function skillsForAgents(skills: InstalledSkill[], agents: string[]): string[] {
  const set = new Set(agents.map((a) => a.replace(/\.md$/, '')))
  return skills.filter((s) => s.appliesTo.some((a) => set.has(a))).map((s) => s.id)
}
