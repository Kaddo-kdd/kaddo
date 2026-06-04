import { readArtifacts } from '../services/artifact-reader.js'
import { loadOwners } from '../services/owners.js'
import { loadMappedModules } from '../services/mapped-modules.js'
import { exists, join, cwd, readFile, writeFile } from '../utils/fs.js'
import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'
import {
  buildProjectExplanation,
  renderExplanationHuman,
  renderExplanationAgent,
} from '../core/project-explain.js'

const ARCH_DIR = 'knowledge'
const CONFIG_PATH = '.kaddo/config.yml'

type ExplainMode = 'human' | 'agent'
type ExplainOpts = {
  for?: ExplainMode
  scope?: string
  since?: string
  type?: string
}

function readKnowledge(dir: string): { content: string; data: Record<string, unknown> } | null {
  const knowledgePath = join(dir, ARCH_DIR, 'knowledge.md')
  if (!exists(knowledgePath)) return null
  try {
    const raw = readFile(knowledgePath)
    const { data, content } = matter(raw)
    return { content, data: data as Record<string, unknown> }
  } catch {
    return null
  }
}

function readRoadmap(dir: string): string | null {
  const roadmapPath = join(dir, ARCH_DIR, 'roadmap.md')
  if (!exists(roadmapPath)) return null
  try {
    const raw = readFile(roadmapPath)
    const { content } = matter(raw)
    return content.trim()
  } catch {
    return null
  }
}

function readConfig(dir: string): Record<string, unknown> {
  const configPath = join(dir, CONFIG_PATH)
  if (!exists(configPath)) return {}
  try {
    return parseYaml(readFile(configPath)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function filterBySince(artifacts: ReturnType<typeof readArtifacts>, since: string) {
  return artifacts.filter((a) => {
    const fm = a as unknown as { created_at?: string }
    if (!fm.created_at) return true
    return fm.created_at >= since
  })
}

function filterByScope(artifacts: ReturnType<typeof readArtifacts>, scope: string) {
  const scopeLower = scope.toLowerCase()
  return artifacts.filter(
    (a) =>
      a.domains.some((d) => d.toLowerCase().includes(scopeLower)) ||
      a.codeGlobs.some((g) => g.toLowerCase().includes(scopeLower)) ||
      a.title.toLowerCase().includes(scopeLower) ||
      a.summary.toLowerCase().includes(scopeLower) ||
      a.type.toLowerCase().includes(scopeLower)
  )
}

function filterByType(artifacts: ReturnType<typeof readArtifacts>, type: string) {
  const typeLower = type.toLowerCase()
  return artifacts.filter((a) => a.type.toLowerCase() === typeLower)
}

function explainForHuman(
  dir: string,
  artifacts: ReturnType<typeof readArtifacts>,
  opts: ExplainOpts
): void {
  const knowledge = readKnowledge(dir)
  const roadmap = readRoadmap(dir)

  console.log('')

  if (opts.scope) {
    console.log(`Scope: ${opts.scope}${opts.type ? ` · type: ${opts.type}` : ''}`)
    console.log(`Artifacts matched: ${artifacts.length}`)
    console.log('')
  }

  if (knowledge && !opts.scope) {
    console.log(knowledge.content.trim())
    console.log('')
  }

  const workItems = artifacts.filter(
    (a) => a.type !== 'current-state' && a.type !== 'roadmap' && a.status === 'in-progress'
  )

  if (workItems.length > 0) {
    console.log('## Active work items')
    console.log('')
    for (const wi of workItems) {
      const level = wi.knowledgeLevel ? ` [${wi.knowledgeLevel}]` : ''
      console.log(`- **${wi.id || wi.title}**${level} — ${wi.summary || wi.title}`)
      if (wi.domains.length > 0) console.log(`  Domains: ${wi.domains.join(', ')}`)
      if (wi.codeGlobs.length > 0) console.log(`  Owns: ${wi.codeGlobs.join(', ')}`)
    }
    console.log('')
  }

  // Non-work-item artifacts (ADRs, RFCs, etc.) when filtering by scope or type
  if (opts.scope || opts.type) {
    const otherArtifacts = artifacts.filter(
      (a) => a.type !== 'current-state' && a.type !== 'roadmap' && a.status !== 'in-progress'
    )
    if (otherArtifacts.length > 0) {
      console.log('## Related artifacts')
      console.log('')
      for (const a of otherArtifacts) {
        const level = a.knowledgeLevel ? ` [${a.knowledgeLevel}]` : ''
        const status = a.status ? ` (${a.status})` : ''
        console.log(`- **${a.id || a.title}** [${a.type}]${level}${status} — ${a.summary || a.title}`)
      }
      console.log('')
    }
  }

  if (roadmap && !opts.scope && !opts.type) {
    const nowSection = roadmap.match(/## Now[\s\S]*?(?=##|$)/)
    if (nowSection) {
      console.log('## Now (from roadmap)')
      console.log('')
      console.log(nowSection[0].replace('## Now', '').trim())
      console.log('')
    }
  }
}

function explainForAgent(
  dir: string,
  artifacts: ReturnType<typeof readArtifacts>,
  opts: ExplainOpts
): void {
  const knowledge = readKnowledge(dir)
  const config = readConfig(dir)
  const ownerMap = loadOwners(dir)

  const output: Record<string, unknown> = {
    project: config.project ?? 'unknown',
    generated_at: new Date().toISOString(),
    scope: opts.scope ?? null,
    type_filter: opts.type ?? null,
    since: opts.since ?? null,
  }

  if (knowledge) {
    const firstParagraph = knowledge.content
      .trim()
      .split('\n\n')
      .find((p) => p.trim() && !p.startsWith('#'))
    output.knowledge_summary = firstParagraph?.trim() ?? ''
  }

  const mappedArtifacts = artifacts
    .filter((a) => a.type !== 'current-state' && a.type !== 'roadmap')
    .map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      summary: a.summary,
      knowledge_level: a.knowledgeLevel,
      status: a.status,
      domains: a.domains,
      code: a.codeGlobs,
    }))

  output.artifacts = mappedArtifacts
  output.artifact_count = mappedArtifacts.length
  output.domains = [...new Set(artifacts.flatMap((a) => a.domains))].filter(Boolean)
  output.domain_owners = ownerMap

  // Installed add-on modules from config (`kaddo add`) — distinct from mapped modules.
  const modules = Array.isArray(config.modules) ? config.modules : []
  output.installed_modules = modules

  // Mapped multirepo modules (`kaddo modules map`) from `.kaddo/modules.yml`.
  output.mapped_modules = loadMappedModules(dir)

  // Plugins
  const plugins = Array.isArray(config.plugins) ? config.plugins : []
  output.enabled_plugins = plugins

  console.log(JSON.stringify(output, null, 2))
}

/** Default (no-filter) invocation: summarize the whole project from existing artifacts. */
function explainProject(dir: string, mode: ExplainMode): void {
  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('No .kaddo/config.yml found. Run `kaddo init` first.')
    process.exit(1)
  }

  const explanation = buildProjectExplanation(dir)
  const markdown = renderExplanationHuman(explanation)
  const jsonOut = renderExplanationAgent(explanation)

  // Persist both outputs for reuse (onboarding, handoff, agents).
  writeFile(join(dir, '.kaddo', 'explain.md'), markdown)
  writeFile(join(dir, '.kaddo', 'explain.json'), jsonOut)

  if (mode === 'agent') {
    console.log(renderExplanationAgent(explanation).trimEnd())
  } else {
    console.log('')
    console.log(markdown.trimEnd())
    console.log('')
  }
}

export function runExplain(opts: ExplainOpts): void {
  const dir = cwd()
  const mode: ExplainMode = opts.for === 'agent' ? 'agent' : 'human'

  // No filters → the consolidated project explanation (VS-013).
  if (!opts.scope && !opts.type && !opts.since) {
    explainProject(dir, mode)
    return
  }

  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) {
    console.error('No knowledge/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  let artifacts = readArtifacts(archDir)

  if (opts.scope) {
    artifacts = filterByScope(artifacts, opts.scope)
  }

  if (opts.type) {
    artifacts = filterByType(artifacts, opts.type)
  }

  if (opts.since) {
    artifacts = filterBySince(artifacts, opts.since)
  }

  if (mode === 'agent') {
    explainForAgent(dir, artifacts, opts)
  } else {
    explainForHuman(dir, artifacts, opts)
  }
}
