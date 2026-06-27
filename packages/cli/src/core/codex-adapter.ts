// Codex AGENTS.md Adapter (VS-065).
//
// Generates a compact, maintainable `AGENTS.md` PROJECTION of the Kaddo project so Codex (and other
// AGENTS.md-aware tools) get native instructions for working in a Kaddo repo. Kaddo stays the source
// of truth; AGENTS.md references knowledge/agents/skills — it never inlines full file contents. No
// LLM, no git, never modifies knowledge/ or .kaddo/.

import { exists, readDir, isDir, join } from '../utils/fs.js'
import { loadConfig } from './config.js'
import { discoverInstalledSkills } from '../services/installed-skills.js'

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export type CodexAdapterContext = {
  projectName?: string
  projectType?: string
  language?: string
  /** Detected from lockfiles; undefined when none is found (generic fallback). */
  packageManager?: PackageManager
  hasAgents: boolean
  agents: string[]
  hasSkills: boolean
  skills: string[]
  hasMcpHint: boolean
  knowledgePaths: string[]
  generatedPaths: string[]
}

const KNOWLEDGE_PATHS = [
  'knowledge/business/',
  'knowledge/product/',
  'knowledge/tech/',
  'knowledge/delivery/',
  'knowledge/agents/',
  'knowledge/skills/',
]
const GENERATED_PATHS = [
  '.kaddo/context-pack.md',
  '.kaddo/understand.md',
  '.kaddo/explain.md',
  '.kaddo/graph.json',
  '.kaddo/reports/',
]

/** Discover installed agent names from knowledge/agents/** (recursive, per-layer folders). */
function discoverAgents(dir: string): string[] {
  const base = join(dir, 'knowledge', 'agents')
  if (!exists(base) || !isDir(base)) return []
  const out = new Set<string>()
  const walk = (d: string) => {
    for (const e of readDir(d)) {
      const full = join(d, e)
      if (isDir(full)) walk(full)
      else if (e.endsWith('-agent.md')) out.add(e.replace(/\.md$/, ''))
    }
  }
  walk(base)
  return [...out].sort()
}

/** Build the deterministic adapter context from existing project structure. */
export function buildCodexAdapterContext(dir: string): CodexAdapterContext {
  const config = loadConfig(dir)
  const agents = discoverAgents(dir)
  const skills = discoverInstalledSkills(dir).map((s) => s.id)
  return {
    projectName: config?.project.name,
    projectType: config?.project.state,
    language: config ? config.project.language : undefined,
    packageManager: detectPackageManager(dir),
    hasAgents: agents.length > 0,
    agents,
    hasSkills: skills.length > 0,
    skills,
    hasMcpHint: detectMcpHint(dir),
    knowledgePaths: KNOWLEDGE_PATHS.filter((p) => exists(join(dir, p))),
    generatedPaths: GENERATED_PATHS,
  }
}

/** Detect the package manager from lockfiles (deterministic, read-only). pnpm > yarn > bun > npm. */
export function detectPackageManager(dir: string): PackageManager | undefined {
  if (exists(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
  if (exists(join(dir, 'yarn.lock'))) return 'yarn'
  if (exists(join(dir, 'bun.lockb')) || exists(join(dir, 'bun.lock'))) return 'bun'
  if (exists(join(dir, 'package-lock.json'))) return 'npm'
  return undefined
}

/**
 * Ordered local-runner fallbacks for the detected package manager. The global `kaddo` is always the
 * preferred command; these are tried only if it is not on `PATH`. Generic when no manager detected.
 */
export function commandFallbacks(pm: PackageManager | undefined): string[] {
  switch (pm) {
    case 'pnpm':
      return ['corepack pnpm exec kaddo <command>', 'pnpm exec kaddo <command>', 'npx kaddo <command>']
    case 'yarn':
      return ['yarn kaddo <command>', 'yarn dlx kaddo <command>', 'npx kaddo <command>']
    case 'bun':
      return ['bunx kaddo <command>', 'npx kaddo <command>']
    case 'npm':
      return ['npm exec kaddo <command>', 'npx kaddo <command>']
    default:
      return ['corepack pnpm exec kaddo <command>', 'pnpm exec kaddo <command>', 'npm exec kaddo <command>', 'npx kaddo <command>']
  }
}

/**
 * Render the "Command fallback" section lines. `heading` is the markdown prefix for the title
 * (`## ` in the full projection, `### ` inside the injected Kaddo block). Package-manager aware.
 */
export function commandFallbackSection(pm: PackageManager | undefined, heading: string): string[] {
  const L: string[] = []
  const pmNote = pm ? ` (detected package manager: \`${pm}\`)` : ' (no package manager detected — generic options)'
  L.push(`${heading}Command fallback`, '')
  L.push(`Prefer the global \`kaddo\` command when available:`, '')
  L.push('```bash')
  L.push('kaddo <command>')
  L.push('```')
  L.push('')
  L.push(`If \`kaddo\` is not available in \`PATH\`, try the local project runner${pmNote} before`)
  L.push('reporting that Kaddo is unavailable:', '')
  L.push('```bash')
  for (const f of commandFallbacks(pm)) L.push(f)
  L.push('```')
  L.push('')
  L.push('Do not fail immediately just because the global `kaddo` binary is missing. When you use a')
  L.push('fallback, mention it briefly (e.g. "the global `kaddo` was not available, so I used the local')
  L.push('runner").')
  L.push('')
  return L
}

/** Heuristic, conservative MCP hint: an MCP config file or a package depending on @kaddo/mcp. */
function detectMcpHint(dir: string): boolean {
  for (const f of ['.mcp.json', 'mcp.json', '.cursor/mcp.json']) {
    if (exists(join(dir, f))) return true
  }
  return false
}

const ROLE_HINTS: Record<string, string> = {
  'roadmap-agent': 'use before creating or refining the roadmap.',
  'work-item-agent': 'use before refining Work Items.',
  'implementation-agent': 'use before implementing Work Items.',
  'bootstrap-agent': 'use when refining initial knowledge.',
  'ownership-agent': 'use to propose precise `code:` ownership globs.',
  'graph-agent': 'use to turn graph hints into front matter.',
  'capsule-agent': 'use to refine a Knowledge Capsule for sharing.',
}

export type AdapterTarget = 'codex' | 'claude'

const TARGET_FILE: Record<AdapterTarget, string> = { codex: 'AGENTS.md', claude: 'CLAUDE.md' }

/**
 * Render an adapter projection (AGENTS.md for Codex, CLAUDE.md for Claude Code). The body is shared
 * across targets — only the generated-by header and the H1 title differ. Compact: references, not
 * full file contents.
 */
export function renderAdapterMarkdown(ctx: CodexAdapterContext, target: AdapterTarget): string {
  const file = TARGET_FILE[target]
  const L: string[] = []
  L.push(`<!-- Generated by \`kaddo adapters install ${target}\`. Kaddo is the source of truth —`)
  L.push('     regenerate this file instead of editing it by hand. Do not treat it as primary. -->')
  L.push(`# ${file}`, '')

  L.push('## Project guidance', '')
  if (ctx.projectName) L.push(`Project: **${ctx.projectName}**${ctx.projectType ? ` (${ctx.projectType})` : ''}.`, '')
  L.push('This repository uses **Kaddo** for Knowledge Driven Development. Kaddo keeps business,')
  L.push('product, technical and delivery knowledge close to the code.')
  L.push('')
  L.push('Before making changes, read the relevant Kaddo knowledge files instead of relying only on')
  L.push('source code.')
  L.push('')

  L.push('## Kaddo knowledge map', '')
  L.push('Primary knowledge lives in:', '')
  for (const p of (ctx.knowledgePaths.length > 0 ? ctx.knowledgePaths : KNOWLEDGE_PATHS)) L.push(`- \`${p}\``)
  L.push('')
  L.push('Derived context (generated — do not edit by hand) lives in:', '')
  for (const p of ctx.generatedPaths) L.push(`- \`${p}\``)
  L.push('')

  L.push('## Operating rules', '')
  L.push('- Do not generate a roadmap without checking open-questions readiness.')
  L.push('- Do not implement without reading the active Work Item.')
  L.push('- Do not assume missing product or business decisions — prefer explicit assumptions.')
  L.push('- Keep knowledge updated when implementation changes scope.')
  L.push('- Do not modify `.kaddo/` manually; it is generated output.')
  L.push('- Do not commit without user confirmation.')
  L.push('')

  L.push('## Before roadmap work', '')
  L.push('Read `knowledge/business/business.md`, `knowledge/product/product.md`,')
  L.push('`knowledge/tech/codebase.md`, and `.kaddo/reports/questions-report.md` if available.')
  L.push('')
  L.push('Check open-questions readiness first. **If blocking open questions exist, ask the user to')
  L.push('resolve, assume or defer them before generating the roadmap** — never build the roadmap on')
  L.push('invisible assumptions.')
  L.push('')

  L.push('## Before implementation', '')
  L.push('Read the target Work Item in `knowledge/delivery/work-items/`, `.kaddo/context-pack.md`,')
  L.push('`.kaddo/understand.md`, and the related knowledge and skills files.')
  L.push('')
  L.push('Do not implement outside the scope of the active Work Item unless the user confirms.')
  L.push('')

  L.push('## After implementation', '')
  L.push('Suggest running, as validation (not mandatory):', '')
  L.push('```bash')
  L.push('kaddo guard')
  L.push('kaddo impact')
  L.push('kaddo savings')
  L.push('kaddo drift')
  L.push('```')
  L.push('')
  L.push('Before finishing a change, suggest `kaddo guard`. If warnings appear, explain the possible')
  L.push('knowledge drift and ask the user whether to update the related knowledge — never update it')
  L.push('automatically.')
  L.push('')

  if (ctx.hasAgents) {
    L.push('## Available Kaddo agents', '')
    L.push('Installed under `knowledge/agents/`. Use them as role-specific guidance when relevant:', '')
    for (const a of ctx.agents) {
      const hint = ROLE_HINTS[a]
      L.push(`- \`${a}\`${hint ? `: ${hint}` : ''}`)
    }
    L.push('')
  }

  if (ctx.hasSkills) {
    L.push('## Available Kaddo skills', '')
    L.push('Reusable skills under `knowledge/skills/`. Read only the skills relevant to the current')
    L.push('task — do not load every skill by default.', '')
    for (const s of ctx.skills) L.push(`- \`${s}\``)
    L.push('')
  }

  if (ctx.hasMcpHint) {
    L.push('## MCP', '')
    L.push('A Kaddo MCP server appears to be configured. Prefer MCP resources over manually scanning')
    L.push('generated files:', '')
    for (const r of ['kaddo://context-pack', 'kaddo://understand', 'kaddo://explain', 'kaddo://open-questions', 'kaddo://roadmap-readiness', 'kaddo://impact-report', 'kaddo://savings-report', 'kaddo://drift-report']) {
      L.push(`- \`${r}\``)
    }
    L.push('')
  }

  for (const line of commandFallbackSection(ctx.packageManager, '## ')) L.push(line)

  L.push('## Useful Kaddo commands', '')
  L.push('```bash')
  for (const c of ['kaddo context', 'kaddo understand', 'kaddo explain', 'kaddo graph export', 'kaddo questions', 'kaddo guard', 'kaddo impact', 'kaddo savings', 'kaddo drift']) {
    L.push(c)
  }
  L.push('```')
  L.push('')

  L.push('## Agent behavior', '')
  const steps = [
    'Identify the current task or Work Item.',
    'Read the related Kaddo knowledge.',
    'Check readiness gates (open questions).',
    'Implement only the requested scope.',
    'Validate with tests or checks.',
    'Suggest knowledge updates if implementation changed the original understanding.',
    'Ask before committing.',
  ]
  steps.forEach((s, i) => L.push(`${i + 1}. ${s}`))
  L.push('')

  L.push('## Safety limits', '')
  L.push('Do not: rewrite the Kaddo methodology, delete knowledge files, manually edit generated')
  L.push('`.kaddo/` artifacts, bypass readiness gates, generate a roadmap from source code alone, or')
  L.push('implement broad changes without an active Work Item.')
  L.push('')

  return L.join('\n')
}

/** Codex projection (`AGENTS.md`). Thin wrapper over the shared renderer. */
export function renderAgentsMd(ctx: CodexAdapterContext): string {
  return renderAdapterMarkdown(ctx, 'codex')
}

/** Claude Code projection (`CLAUDE.md`) — VS-066. Same body, Claude-specific header/title. */
export function renderClaudeMd(ctx: CodexAdapterContext): string {
  return renderAdapterMarkdown(ctx, 'claude')
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe merge / inject (VS-065.2)
// ─────────────────────────────────────────────────────────────────────────────

export const KADDO_BEGIN_MARKER = '<!-- BEGIN KADDO CODEX ADAPTER -->'
export const KADDO_END_MARKER = '<!-- END KADDO CODEX ADAPTER -->'
const GENERATED_HEADER = 'Generated by `kaddo adapters install codex`'

export type AgentsFileState =
  | 'missing'
  | 'generated_by_kaddo'
  | 'existing_external'
  | 'existing_with_kaddo_block'
  | 'invalid_kaddo_block'

/** Classify an existing AGENTS.md so the command can pick a safe action. */
export function detectAgentsState(content: string | null): AgentsFileState {
  if (content === null) return 'missing'
  const hasBegin = content.includes(KADDO_BEGIN_MARKER)
  const hasEnd = content.includes(KADDO_END_MARKER)
  if (hasBegin !== hasEnd) return 'invalid_kaddo_block'
  if (hasBegin && hasEnd) return 'existing_with_kaddo_block'
  if (content.includes(GENERATED_HEADER)) return 'generated_by_kaddo'
  return 'existing_external'
}

/** Render the delimited Kaddo block injected into an existing AGENTS.md (compact, self-contained). */
export function renderKaddoBlock(ctx: CodexAdapterContext): string {
  const L: string[] = []
  L.push(KADDO_BEGIN_MARKER, '')
  L.push('## Kaddo guidance', '')
  if (ctx.projectName) L.push(`Project: **${ctx.projectName}**${ctx.projectType ? ` (${ctx.projectType})` : ''}.`, '')
  L.push('This repository uses **Kaddo** for Knowledge Driven Development. Kaddo keeps business,')
  L.push('product, technical and delivery knowledge close to the code. Read the relevant Kaddo')
  L.push('knowledge before changing code.')
  L.push('')

  L.push('### Kaddo knowledge map', '')
  L.push('Primary knowledge:')
  for (const p of (ctx.knowledgePaths.length > 0 ? ctx.knowledgePaths : KNOWLEDGE_PATHS)) L.push(`- \`${p}\``)
  L.push('')
  L.push('Generated context (do not edit by hand):')
  for (const p of ctx.generatedPaths) L.push(`- \`${p}\``)
  L.push('')

  L.push('### Kaddo operating rules', '')
  L.push('- Do not generate a roadmap without checking open-questions readiness.')
  L.push('- Do not implement without reading the active Work Item.')
  L.push('- Do not implement outside the scope of the active Work Item unless the user confirms.')
  L.push('- Do not modify `.kaddo/` manually; it is generated output.')
  L.push('- Do not commit without user confirmation.')
  L.push('')

  for (const line of commandFallbackSection(ctx.packageManager, '### ')) L.push(line)

  L.push('### Before roadmap work', '')
  L.push('Check open-questions readiness first. If blocking open questions exist, ask the user to')
  L.push('resolve, assume or defer them before generating the roadmap.')
  L.push('')

  L.push('### Before implementation', '')
  L.push('Read the target Work Item in `knowledge/delivery/work-items/`, `.kaddo/context-pack.md`,')
  L.push('`.kaddo/understand.md`, and related knowledge and skills.')
  L.push('')

  L.push('### After implementation', '')
  L.push('Suggest running `kaddo guard`, `kaddo impact`, `kaddo savings` and `kaddo drift`. If guard')
  L.push('reports drift, explain it and ask before updating knowledge.')
  L.push('')

  if (ctx.hasAgents) {
    L.push(`### Kaddo agents`, '')
    L.push(`Installed under \`knowledge/agents/\`: ${ctx.agents.map((a) => `\`${a}\``).join(', ')}.`)
    L.push('')
  }
  if (ctx.hasSkills) {
    L.push(`### Kaddo skills`, '')
    L.push(`Installed under \`knowledge/skills/\`: ${ctx.skills.map((s) => `\`${s}\``).join(', ')}. Read only what's relevant.`)
    L.push('')
  }

  L.push(KADDO_END_MARKER)
  return L.join('\n')
}

export type MergeResult = { content: string; status: 'injected' | 'updated' }

/**
 * Inject or update the Kaddo block in an existing AGENTS.md, preserving everything outside the
 * markers. Throws on an invalid (half-open) block — the caller surfaces a clear error.
 */
export function injectKaddoBlock(existing: string, ctx: CodexAdapterContext): MergeResult {
  const block = renderKaddoBlock(ctx)
  const begin = existing.indexOf(KADDO_BEGIN_MARKER)
  const end = existing.indexOf(KADDO_END_MARKER)
  if ((begin === -1) !== (end === -1)) {
    throw new Error('Invalid Kaddo adapter block: found one marker without its pair.')
  }
  if (begin !== -1 && end !== -1) {
    if (end < begin) throw new Error('Invalid Kaddo adapter block: END marker before BEGIN marker.')
    const before = existing.slice(0, begin)
    const after = existing.slice(end + KADDO_END_MARKER.length)
    return { content: `${before}${block}${after}`, status: 'updated' }
  }
  // Append the block, separated by a blank line, preserving the existing content as-is.
  const sep = existing.endsWith('\n') ? '\n' : '\n\n'
  return { content: `${existing.replace(/\s*$/, '')}\n${sep}${block}\n`, status: 'injected' }
}
