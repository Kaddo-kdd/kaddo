import { readArtifacts } from '../services/artifact-reader.js'
import { exists, join, cwd, readFile } from '../utils/fs.js'
import matter from 'gray-matter'

const ARCH_DIR = 'architecture'

type ExplainMode = 'human' | 'agent'
type ExplainOpts = {
  for?: ExplainMode
  scope?: string
  since?: string
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

function filterBySince(artifacts: ReturnType<typeof readArtifacts>, since: string) {
  // Simple date comparison — artifacts with created_at >= since
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
      a.summary.toLowerCase().includes(scopeLower)
  )
}

function explainForHuman(
  dir: string,
  artifacts: ReturnType<typeof readArtifacts>,
  opts: ExplainOpts
): void {
  const knowledge = readKnowledge(dir)
  const roadmap = readRoadmap(dir)

  console.log('')

  // Project knowledge
  if (knowledge) {
    console.log(knowledge.content.trim())
    console.log('')
  }

  // Active work items
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

  // Roadmap excerpt
  if (roadmap && !opts.scope) {
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
  // Structured minimal context — front matters + summaries, no full docs
  const knowledge = readKnowledge(dir)

  const output: Record<string, unknown> = {
    project: opts.scope ? `scope: ${opts.scope}` : 'full project',
    generated_at: new Date().toISOString(),
  }

  if (knowledge) {
    // Extract first paragraph as project summary
    const firstParagraph = knowledge.content
      .trim()
      .split('\n\n')
      .find((p) => p.trim() && !p.startsWith('#'))
    output.knowledge_summary = firstParagraph?.trim() ?? ''
  }

  const workItems = artifacts
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

  output.artifacts = workItems
  output.artifact_count = workItems.length
  output.domains = [...new Set(artifacts.flatMap((a) => a.domains))]

  console.log(JSON.stringify(output, null, 2))
}

export function runExplain(opts: ExplainOpts): void {
  const dir = cwd()
  const mode: ExplainMode = opts.for === 'agent' ? 'agent' : 'human'

  const archDir = join(dir, ARCH_DIR)
  if (!exists(archDir)) {
    console.error('No architecture/ directory found. Run `kaddo init` first.')
    process.exit(1)
  }

  let artifacts = readArtifacts(archDir)

  if (opts.scope) {
    artifacts = filterByScope(artifacts, opts.scope)
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
