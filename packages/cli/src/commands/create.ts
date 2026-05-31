import { getLevel, getLevelForType, isValidType, type WorkItemType, type KLevel } from '../core/knowledge-levels.js'
import { findWorkItemType } from '../modules/registry.js'
import type { ModuleWorkItemType } from '../modules/types.js'
import { exists, readDir, writeFile, join, cwd } from '../utils/fs.js'
import { intro, outro, log, text } from '../utils/ui.js'

const WORK_ITEMS_DIR = 'architecture/work-items'

function nextWorkItemId(dir: string): string {
  const wiDir = join(dir, WORK_ITEMS_DIR)
  if (!exists(wiDir)) return 'WI-001'

  const files = readDir(wiDir).filter((f) => f.endsWith('.md'))
  const nums = files
    .map((f) => {
      const m = f.match(/WI-(\d+)/)
      return m ? parseInt(m[1], 10) : 0
    })
    .filter((n) => n > 0)

  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
  return `WI-${String(next).padStart(3, '0')}`
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
    `status: in-progress`,
    `domains: []`,
    `code: []`,
    `created_at: ${today}`,
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
    `status: in-progress`,
    `domains: []`,
    `code: []`,
    `created_at: ${today}`,
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

  sections.push(`## Learning\n\n_What did we learn from this change? Update after completion._\n`)
  return sections.join('\n')
}

export async function runCreate(type: string): Promise<void> {
  const dir = cwd()

  // Check module-defined types first
  const modWorkItemType = findWorkItemType(type)

  if (modWorkItemType) {
    return runCreateModule(dir, modWorkItemType)
  }

  if (!isValidType(type)) {
    console.error(`Unknown work item type: "${type}"`)
    console.error('Valid types: feature, bugfix, hotfix, spike')
    console.error('Module types: adr, incident, rfc, migration, legacy (run `kaddo add <module>` first)')
    process.exit(1)
  }

  const workItemType = type as WorkItemType
  const level = getLevelForType(workItemType)
  const levelDef = getLevel(level)

  intro(`kaddo create ${workItemType}`)
  log.info(`Knowledge level: ${level} — ${levelDef.description}`)

  const title = await text({
    message: 'Title for this work item',
    placeholder: `e.g. ${workItemType === 'feature' ? 'Add email verification to checkout' : workItemType === 'hotfix' ? 'Fix null pointer in payment handler' : workItemType === 'bugfix' ? 'Fix broken pagination on orders list' : 'Explore caching strategies for API responses'}`,
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
  const filePath = join(dir, WORK_ITEMS_DIR, fileName)

  const frontMatter = buildFrontMatter(id, workItemType, level, title.trim(), answers)
  const body = buildBody(workItemType, level, title.trim(), answers, levelDef.qualityGate)
  const content = `${frontMatter}\n\n${body}`

  if (!exists(join(dir, WORK_ITEMS_DIR))) {
    log.warn(`${WORK_ITEMS_DIR}/ not found. Run \`kaddo init\` first.`)
    process.exit(1)
  }

  writeFile(filePath, content)
  log.success(`Created ${WORK_ITEMS_DIR}/${fileName}`)
  log.info(`Add code globs to the front matter \`code:\` field to enable Guard Lite.`)
  outro(`Work item ${id} created.`)
}

async function runCreateModule(dir: string, modType: ModuleWorkItemType): Promise<void> {
  intro(`kaddo create ${modType.name}`)
  log.info(`Knowledge level: ${modType.knowledgeLevel} — ${modType.description}`)

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
  const filePath = join(dir, WORK_ITEMS_DIR, fileName)

  const frontMatter = buildModuleFrontMatter(id, modType, title.trim(), answers)
  const body = buildModuleBody(modType, title.trim(), answers)
  const content = `${frontMatter}\n\n${body}`

  writeFile(filePath, content)
  log.success(`Created ${WORK_ITEMS_DIR}/${fileName}`)
  log.info(`Add code globs to the front matter \`code:\` field to enable Guard Lite.`)
  outro(`Work item ${id} created.`)
}
