import { getLevel, getLevelForType, normalizeType, type WorkItemType, type KLevel } from '../core/knowledge-levels.js'
import { findWorkItemType } from '../modules/registry.js'
import type { ModuleWorkItemType } from '../modules/types.js'
import { exists, readFile, readDir, writeFile, join, cwd, isFile } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'
import { loadConfig, createGuidanceForState, ConfigError } from '../core/config.js'
import {
  parseRoadmapCandidates,
  normalizeCapabilityList,
  domainsFromRelated,
  type RoadmapCandidateWorkItem,
} from '../core/roadmap.js'

const WORK_ITEMS_DIR = 'knowledge/delivery/work-items'
// New Work Items start in the `draft` lifecycle state (VS-041).
const DRAFT_DIR = `${WORK_ITEMS_DIR}/draft`
const ROADMAP_PATH = 'knowledge/delivery/roadmap.md'

export type CreateOptions = { from?: string }

/** Print state-aware helper text if config exists. Best-effort, never blocks. */
function printStateGuidance(dir: string): void {
  let config
  try {
    config = loadConfig(dir)
  } catch (err) {
    if (err instanceof ConfigError) {
      log.warn(err.message)
      return
    }
    throw err
  }
  if (!config) return
  log.info(createGuidanceForState(config.project.state))
}

/** Highest WI-NNN across the work-items tree (recursive — items live in lifecycle subfolders). */
function nextWorkItemId(dir: string): string {
  const wiDir = join(dir, WORK_ITEMS_DIR)
  if (!exists(wiDir)) return 'WI-001'

  let max = 0
  const walk = (d: string) => {
    for (const entry of readDir(d)) {
      const full = join(d, entry)
      if (isFile(full)) {
        const m = entry.match(/WI-(\d+)/)
        if (m) max = Math.max(max, parseInt(m[1], 10))
      } else if (!entry.startsWith('.')) {
        walk(full)
      }
    }
  }
  walk(wiDir)

  return `WI-${String(max + 1).padStart(3, '0')}`
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function formatList(items: string[]): string {
  return items.map((i) => `- ${i.trim()}`).join('\n')
}

function buildFrontMatter(
  id: string,
  type: WorkItemType,
  level: KLevel,
  title: string,
  answers: Record<string, string>
): string {
  const today = new Date().toISOString().split('T')[0]
  const lines = [
    '---',
    `type: ${type}`,
    `id: ${id}`,
    `title: "${title}"`,
    `knowledge_level: ${level}`,
    `status: draft`,
    `phase: now`,
    `initiative:`,
    `domains: []`,
    `code: []`,
    `created_at: ${today}`,
    `source: manual`,
    `summary: "${answers.problem?.split('.')[0] ?? title}"`,
    '---',
  ]
  return lines.join('\n')
}

function buildBody(
  type: WorkItemType,
  level: KLevel,
  title: string,
  answers: Record<string, string>,
  qualityGate: string[]
): string {
  const sections: string[] = []

  sections.push(`# ${title}\n`)
  sections.push(`> Type: ${type} · Level: ${level}\n`)

  if (answers.problem) {
    sections.push(`## Problem\n\n${answers.problem}\n`)
  }

  if (answers.expected_result) {
    sections.push(`## Expected result\n\n${answers.expected_result}\n`)
  }

  if (answers.impact) {
    sections.push(`## Impact\n\n${answers.impact}\n`)
  }

  if (answers.acceptance_criteria) {
    const items = answers.acceptance_criteria
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    sections.push(`## Acceptance criteria\n\n${formatList(items)}\n`)
  }

  if (answers.design) {
    sections.push(`## Design\n\n${answers.design}\n`)
  }

  if (answers.risks) {
    sections.push(`## Risks\n\n${answers.risks}\n`)
  }

  sections.push(`## Out of scope\n\n_Not included in this Work Item._\n`)
  sections.push(`## Validation\n\n_How will this be validated?_\n`)

  // Definition of Done
  if (qualityGate.length > 0) {
    sections.push(`## Definition of Done\n\n${qualityGate.map((g) => `- [ ] ${g}`).join('\n')}\n`)
  }

  // Learning section — always present
  sections.push(`## Learning\n\n_What did we learn from this change? Update after completion._\n`)

  return sections.join('\n')
}

function buildModuleFrontMatter(
  id: string,
  modType: ModuleWorkItemType,
  title: string,
  answers: Record<string, string>
): string {
  const today = new Date().toISOString().split('T')[0]
  const extra = modType.extraFrontMatter ?? {}
  const extraLines = Object.entries(extra).map(([k, v]) =>
    `${k}: ${JSON.stringify(v)}`
  )
  const lines = [
    '---',
    `type: ${modType.name}`,
    `id: ${id}`,
    `title: "${title}"`,
    `knowledge_level: ${modType.knowledgeLevel}`,
    `status: draft`,
    `phase: now`,
    `initiative:`,
    `domains: []`,
    `code: []`,
    `created_at: ${today}`,
    `source: manual`,
    `summary: "${title}"`,
    ...extraLines,
    '---',
  ]
  return lines.join('\n')
}

function buildModuleBody(modType: ModuleWorkItemType, title: string, answers: Record<string, string>): string {
  const sections: string[] = []
  sections.push(`# ${title}\n`)
  sections.push(`> Type: ${modType.name} · Level: ${modType.knowledgeLevel}\n`)

  for (const q of modType.questions) {
    const answer = answers[q.frontMatterField]
    if (answer) {
      const heading = q.frontMatterField.replace(/_/g, ' ')
      sections.push(`## ${heading.charAt(0).toUpperCase() + heading.slice(1)}\n\n${answer}\n`)
    }
  }

  if (modType.qualityGate.length > 0) {
    sections.push(`## Definition of Done\n\n${modType.qualityGate.map((g) => `- [ ] ${g}`).join('\n')}\n`)
  }

  sections.push(`## Out of scope\n\n_Not included in this Work Item._\n`)
  sections.push(`## Validation\n\n_How will this be validated?_\n`)

  sections.push(`## Learning\n\n_What did we learn from this change? Update after completion._\n`)
  return sections.join('\n')
}

export async function runCreate(type: string, opts: CreateOptions = {}): Promise<void> {
  const dir = cwd()

  // Roadmap source: create a Work Item from a candidate in knowledge/delivery/roadmap.md.
  if (opts.from === 'roadmap') {
    return runCreateFromRoadmap(dir, type)
  }

  if (!type) {
    console.error('Missing work item type.')
    console.error('Usage: kaddo create <feature|bugfix|hotfix|spike|chore> [--from roadmap]')
    process.exit(1)
  }

  // Check module-defined types first
  const modWorkItemType = findWorkItemType(type)

  if (modWorkItemType) {
    return runCreateModule(dir, modWorkItemType)
  }

  // Accept official types and aliases (setup/tooling/… → chore).
  const workItemType = normalizeType(type)
  if (!workItemType) {
    console.error(`Unknown work item type: "${type}"`)
    console.error('Valid types: feature, bugfix, hotfix, spike, chore')
    console.error('Aliases: setup, maintenance, tooling, infrastructure, refactor → chore')
    console.error('Module types: adr, incident, rfc, migration, legacy (run `kaddo add <module>` first)')
    process.exit(1)
  }

  const level = getLevelForType(workItemType)
  const levelDef = getLevel(level)

  intro(`kaddo create ${workItemType}`)
  log.info(`Knowledge level: ${level} — ${levelDef.description}`)
  printStateGuidance(dir)

  const title = await text({
    message: 'Title for this work item',
    placeholder: `e.g. ${workItemType === 'feature' ? 'Add email verification to checkout' : workItemType === 'hotfix' ? 'Fix null pointer in payment handler' : workItemType === 'bugfix' ? 'Fix broken pagination on orders list' : workItemType === 'chore' ? 'Configure Vitest and CI pipeline' : 'Explore caching strategies for API responses'}`,
    validate: (v) => (v.trim().length === 0 ? 'Title is required.' : undefined),
  })

  const answers: Record<string, string> = {}

  for (const question of levelDef.questions) {
    const answer = await text({
      message: question.prompt,
      placeholder: question.placeholder,
      validate: question.required
        ? (v) => (v.trim().length === 0 ? 'This field is required.' : undefined)
        : undefined,
    })
    answers[question.frontMatterField] = answer.trim()
  }

  const id = nextWorkItemId(dir)
  const slug = slugify(title)
  const fileName = `${id}-${slug}.md`
  const filePath = join(dir, DRAFT_DIR, fileName)

  const frontMatter = buildFrontMatter(id, workItemType, level, title.trim(), answers)
  const body = buildBody(workItemType, level, title.trim(), answers, levelDef.qualityGate)
  const content = `${frontMatter}\n\n${body}`

  if (!exists(join(dir, WORK_ITEMS_DIR))) {
    log.warn(`${WORK_ITEMS_DIR}/ not found. Run \`kaddo init\` first.`)
    process.exit(1)
  }

  writeFile(filePath, content)
  log.success(`Created ${DRAFT_DIR}/${fileName}`)
  log.info(`New Work Items start in \`draft\`. Move to \`ready\` when scope and acceptance are set.`)
  log.info(`Add code globs to the front matter \`code:\` field to enable Guard Lite.`)
  outro(`Work item ${id} created.`)
}

async function runCreateModule(dir: string, modType: ModuleWorkItemType): Promise<void> {
  intro(`kaddo create ${modType.name}`)
  log.info(`Knowledge level: ${modType.knowledgeLevel} — ${modType.description}`)
  printStateGuidance(dir)

  if (!exists(join(dir, WORK_ITEMS_DIR))) {
    log.warn(`${WORK_ITEMS_DIR}/ not found. Run \`kaddo init\` first.`)
    process.exit(1)
  }

  const title = await text({
    message: 'Title for this work item',
    placeholder: `e.g. ${modType.questions[0]?.placeholder ?? modType.description}`,
    validate: (v) => (v.trim().length === 0 ? 'Title is required.' : undefined),
  })

  const answers: Record<string, string> = {}
  for (const q of modType.questions) {
    const answer = await text({
      message: q.prompt,
      placeholder: q.placeholder,
      validate: q.required ? (v) => (v.trim().length === 0 ? 'This field is required.' : undefined) : undefined,
    })
    answers[q.frontMatterField] = answer.trim()
  }

  const id = nextWorkItemId(dir)
  const slug = slugify(title)
  const fileName = `${id}-${slug}.md`
  const filePath = join(dir, DRAFT_DIR, fileName)

  const frontMatter = buildModuleFrontMatter(id, modType, title.trim(), answers)
  const body = buildModuleBody(modType, title.trim(), answers)
  const content = `${frontMatter}\n\n${body}`

  writeFile(filePath, content)
  log.success(`Created ${DRAFT_DIR}/${fileName}`)
  log.info(`Add code globs to the front matter \`code:\` field to enable Guard Lite.`)
  outro(`Work item ${id} created.`)
}

// ---------------------------------------------------------------------------
// Create from roadmap (VS-010)
// ---------------------------------------------------------------------------

const K_LEVEL_RE = /^K[0-4]$/

/** Resolve the Work Item type for a roadmap candidate. Returns null if it must be asked. */
export function resolveCandidateType(
  candidate: RoadmapCandidateWorkItem,
  cliType?: string
): WorkItemType | null {
  // Accept official types AND aliases (chore, setup, tooling, …) without asking the user.
  return normalizeType(candidate.type) ?? normalizeType(cliType)
}

/** Resolve the Knowledge Level for a candidate: prefer its suggestion, else derive from type. */
export function resolveCandidateLevel(
  candidate: RoadmapCandidateWorkItem,
  type: WorkItemType
): KLevel {
  const suggested = candidate.suggestedKnowledgeLevel?.trim().toUpperCase()
  if (suggested && K_LEVEL_RE.test(suggested)) return suggested as KLevel
  return getLevelForType(type)
}

export function buildRoadmapFrontMatter(
  id: string,
  type: WorkItemType,
  level: KLevel,
  title: string,
  candidate: RoadmapCandidateWorkItem,
  answers: Record<string, string>
): string {
  const today = new Date().toISOString().split('T')[0]
  const summary = (answers.problem?.split('.')[0] ?? candidate.expectedValue ?? title).trim()
  const initiative = candidate.initiative?.title ?? candidate.initiative?.id ?? ''
  const q = (s: string) => s.replace(/"/g, "'")

  // VS-078 normalization: fill `domains` from `related_domain`, split comma-joined capabilities into
  // a real list, and carry risks/dependencies/decision candidates as YAML block sequences. Never
  // invents values — only normalizes what the roadmap candidate already provided.
  const domains = domainsFromRelated(candidate.domain)
  const relatedCapabilities = normalizeCapabilityList(candidate.relatedCapabilities)
  const risks = candidate.risk ? [candidate.risk] : []
  const dependencies = candidate.dependencies ?? []
  const sourceSignals = candidate.sourceSignals ?? []
  const decisionCandidates = candidate.decisionCandidates ?? []

  const yamlList = (key: string, items: string[]): string[] =>
    items.length === 0 ? [] : [`${key}:`, ...items.map((i) => `  - "${q(i)}"`)]

  const lines = [
    '---',
    `type: ${type}`,
    `id: ${id}`,
    `title: "${q(title)}"`,
    `knowledge_level: ${level}`,
    `status: draft`,
    `phase: now`,
    `initiative: "${q(initiative)}"`,
    ...yamlList('domains', domains),
    ...(domains.length === 0 ? ['domains: []'] : []),
    `code: []`,
    `created_at: ${today}`,
    `source: roadmap`,
    `source_id: ${candidate.id}`,
    `source_initiative: ${candidate.initiative?.id ?? 'unknown'}`,
    // Capability-grounded traceability (VS-077 / VS-078): distinguish the parent roadmap initiative
    // from the specific Work Item candidate it was materialized from.
    `source_roadmap_initiative: ${candidate.initiative?.id ?? 'unknown'}`,
    `source_work_item_candidate: ${candidate.id}`,
    `source_title: "${q(candidate.title)}"`,
    `source_context: "Materialized from roadmap candidate ${candidate.id}${candidate.initiative?.id ? ` under initiative ${candidate.initiative.id}` : ''}."`,
    ...(candidate.initiative?.title
      ? [`source_initiative_title: "${q(candidate.initiative.title)}"`]
      : []),
    ...(candidate.domain ? [`related_domain: "${q(candidate.domain)}"`] : []),
    ...yamlList('related_capabilities', relatedCapabilities),
    ...(candidate.expectedValue ? [`expected_value: "${q(candidate.expectedValue)}"`] : []),
    ...yamlList('risks', risks),
    ...yamlList('dependencies', dependencies),
    ...yamlList('source_signals', sourceSignals),
    ...yamlList('decision_candidates', decisionCandidates),
    ...(decisionCandidates.length > 0 ? ['related_decisions: []'] : []),
    `summary: "${q(summary)}"`,
    '---',
  ]
  return lines.join('\n')
}

function buildRoadmapBody(
  type: WorkItemType,
  level: KLevel,
  title: string,
  candidate: RoadmapCandidateWorkItem,
  answers: Record<string, string>,
  qualityGate: string[]
): string {
  const sections: string[] = []

  sections.push(`# ${title}\n`)
  sections.push(`> Type: ${type} · Level: ${level}\n`)

  // Source traceability (VS-078): show initiative + work item candidate + related domain/capabilities.
  const initiativeLabel = candidate.initiative
    ? `${candidate.initiative.id ?? ''}${candidate.initiative.title ? ` — ${candidate.initiative.title}` : ''}`.trim()
    : 'unknown'
  const relatedCapabilities = normalizeCapabilityList(candidate.relatedCapabilities)
  const sourceLines = [
    '## Source\n',
    `- Source: roadmap`,
    `- Roadmap Initiative: ${initiativeLabel || 'unknown'}`,
    `- Work Item Candidate: ${candidate.id}`,
  ]
  if (candidate.domain) sourceLines.push(`- Related domain: ${candidate.domain}`)
  if (relatedCapabilities.length) {
    sourceLines.push('- Related capabilities:')
    relatedCapabilities.forEach((c) => sourceLines.push(`  - ${c}`))
  }
  sections.push(sourceLines.join('\n') + '\n')

  // Warning when the Work Item depends on tech decision candidates that have no ADR yet (VS-078).
  if (candidate.decisionCandidates?.length) {
    sections.push(
      '> Warning: This Work Item is related to technical decision candidates that have not been ' +
        'materialized as ADRs.\n'
    )
  }

  if (answers.problem) sections.push(`## Problem\n\n${answers.problem}\n`)

  const expectedValue = candidate.expectedValue ?? answers.expected_result
  if (expectedValue) sections.push(`## Expected Value\n\n${expectedValue}\n`)

  // Context From Roadmap (VS-078): expected value, risks, dependencies and source signals — verbatim
  // from the roadmap. Never invents source signals; when absent it says so explicitly.
  const initiativeRef = candidate.initiative?.id
    ? `roadmap initiative ${candidate.initiative.id}`
    : 'a roadmap candidate'
  const ctx: string[] = [`This Work Item was materialized from ${initiativeRef}.`, '']
  if (candidate.expectedValue) ctx.push(`**Expected value:** ${candidate.expectedValue}`)
  if (candidate.risk) ctx.push(`**Risks:** ${candidate.risk}`)
  if (candidate.dependencies?.length)
    ctx.push(`**Dependencies:** ${candidate.dependencies.join('; ')}`)
  if (candidate.sourceSignals?.length) {
    ctx.push(`**Source signals:**\n${formatList(candidate.sourceSignals)}`)
  } else {
    ctx.push('**Source signals:** _Not provided in roadmap._')
  }
  sections.push(`## Context From Roadmap\n\n${ctx.join('\n\n')}\n`)

  if (answers.acceptance_criteria) {
    const items = answers.acceptance_criteria
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    sections.push(`## Acceptance Criteria\n\n${formatList(items)}\n`)
  }

  if (answers.design) sections.push(`## Design\n\n${answers.design}\n`)

  if (answers.risks) sections.push(`## Risks\n\n${answers.risks}\n`)

  if (candidate.notes) sections.push(`## Notes\n\n${candidate.notes}\n`)

  if (candidate.openQuestions?.length)
    sections.push(`## Open Questions\n\n${formatList(candidate.openQuestions)}\n`)

  sections.push(`## Out of scope\n\n_Not included in this Work Item._\n`)
  sections.push(`## Validation\n\n_How will this be validated?_\n`)

  if (qualityGate.length > 0)
    sections.push(`## Definition of Done\n\n${qualityGate.map((g) => `- [ ] ${g}`).join('\n')}\n`)

  sections.push(`## Learning\n\n_What did we learn from this change? Update after completion._\n`)

  return sections.join('\n')
}

/**
 * Pure builder: turn a roadmap candidate + resolved type/level/answers into a Work Item file.
 * Exposed for testing; the interactive flow wires prompts around it.
 */
export function buildRoadmapWorkItem(opts: {
  id: string
  type: WorkItemType
  level: KLevel
  candidate: RoadmapCandidateWorkItem
  answers?: Record<string, string>
}): { fileName: string; content: string } {
  const { id, type, level, candidate } = opts
  const answers = opts.answers ?? {}
  const title = candidate.title.trim()
  const slug = slugify(title)
  const fileName = `${id}-${slug}.md`
  const qualityGate = getLevel(level).qualityGate
  const frontMatter = buildRoadmapFrontMatter(id, type, level, title, candidate, answers)
  const body = buildRoadmapBody(type, level, title, candidate, answers, qualityGate)
  return { fileName, content: `${frontMatter}\n\n${body}` }
}

async function runCreateFromRoadmap(dir: string, cliType?: string): Promise<void> {
  intro('kaddo create --from roadmap')

  if (!exists(join(dir, WORK_ITEMS_DIR))) {
    log.warn(`${WORK_ITEMS_DIR}/ not found. Run \`kaddo init\` first.`)
    process.exit(1)
  }

  const roadmapFull = join(dir, ROADMAP_PATH)
  if (!exists(roadmapFull)) {
    console.error(`No roadmap found at ${ROADMAP_PATH}.`)
    console.error('Use roadmap-agent first or create a roadmap manually.')
    process.exit(1)
  }

  const candidates = parseRoadmapCandidates(readFile(roadmapFull))
  if (candidates.length === 0) {
    console.error(`No candidate work items found in ${ROADMAP_PATH}.`)
    console.error('Make sure your roadmap uses the Kaddo Roadmap Agent format.')
    process.exit(1)
  }

  // 1. Select a candidate.
  const candidateId =
    candidates.length === 1
      ? candidates[0].id
      : await select<string>({
          message: 'Which roadmap candidate do you want to create?',
          options: candidates.map((c) => ({
            value: c.id,
            label: `${c.id}: ${c.title}`,
            hint: c.initiative?.id,
          })),
        })
  const candidate = candidates.find((c) => c.id === candidateId)!

  // 2. Resolve / confirm type.
  let type = resolveCandidateType(candidate, cliType)
  if (!type) {
    type = await select<WorkItemType>({
      message: candidate.type
        ? `Roadmap suggests type "${candidate.type}" (not a Kaddo type). Choose a Work Item type:`
        : 'No type in roadmap candidate. Choose a Work Item type:',
      options: [
        { value: 'feature', label: 'feature' },
        { value: 'bugfix', label: 'bugfix' },
        { value: 'hotfix', label: 'hotfix' },
        { value: 'spike', label: 'spike' },
        { value: 'chore', label: 'chore' },
      ],
    })
  }

  // 3. Resolve Knowledge Level.
  const level = resolveCandidateLevel(candidate, type)
  const levelDef = getLevel(level)
  log.info(`Knowledge level: ${level} — ${levelDef.description}`)

  // 4. Prefill answers from the candidate; ask only for what is missing.
  const answers: Record<string, string> = {}
  if (candidate.expectedValue) answers.expected_result = candidate.expectedValue
  if (candidate.impact) answers.impact = candidate.impact
  if (candidate.risk) answers.risks = candidate.risk

  for (const question of levelDef.questions) {
    if (answers[question.frontMatterField]?.trim()) continue
    const answer = await text({
      message: question.prompt,
      placeholder: question.placeholder,
      validate: question.required
        ? (v) => (v.trim().length === 0 ? 'This field is required.' : undefined)
        : undefined,
    })
    answers[question.frontMatterField] = answer.trim()
  }

  // 5. Generate the Work Item file.
  const id = nextWorkItemId(dir)
  const { fileName, content } = buildRoadmapWorkItem({ id, type, level, candidate, answers })
  writeFile(join(dir, DRAFT_DIR, fileName), content)

  log.success(`Created ${DRAFT_DIR}/${fileName}`)
  log.info(`Traced to roadmap candidate ${candidate.id}${candidate.initiative?.id ? ` (initiative ${candidate.initiative.id})` : ''}.`)
  log.info(`Add code globs to the front matter \`code:\` field to enable Guard Lite.`)
  outro(`Work item ${id} created from roadmap.`)
}
