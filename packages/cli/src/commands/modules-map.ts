import { cwd, exists, join, writeFile, readFile, ensureDir } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { getTemplate } from '../templates/registry.js'

const DESCRIPTOR_PATH = '.kaddo/modules.yml'
const CONFIG_PATH = '.kaddo/config.yml'

export const MODULE_TYPES = [
  'frontend',
  'backend',
  'worker',
  'mobile',
  'library',
  'infrastructure',
  'data',
  'unknown',
] as const

export type ModuleType = (typeof MODULE_TYPES)[number]

export type MappedModuleInput = {
  name: string
  repoPath: string
  type: ModuleType
  mainTechnology?: string
  owner?: string
  capabilities?: string[]
}

export type MappedModule = {
  id: string
  name: string
  repoPath: string
  type: ModuleType
  status: 'active'
  mainTechnology: string
  owner: string
  capabilities: string[]
  code: string[]
  docs: {
    moduleDesign: string
    stack: string
    security: string
    standards: string
  }
}

type ModulesDescriptor = {
  version: number
  modules: MappedModule[]
}

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function readModulesDescriptor(dir: string): ModulesDescriptor {
  const path = join(dir, DESCRIPTOR_PATH)
  if (!exists(path)) return { version: 1, modules: [] }
  try {
    const parsed = parseYaml(readFile(path)) as Partial<ModulesDescriptor>
    return { version: parsed.version ?? 1, modules: parsed.modules ?? [] }
  } catch {
    return { version: 1, modules: [] }
  }
}

function writeModulesDescriptor(dir: string, descriptor: ModulesDescriptor): void {
  writeFile(join(dir, DESCRIPTOR_PATH), stringifyYaml(descriptor))
}

function moduleDir(id: string): string {
  return `knowledge/tech/modules/${id}`
}

function buildModule(input: MappedModuleInput): MappedModule {
  const id = slugify(input.name)
  const base = moduleDir(id)
  return {
    id,
    name: input.name.trim(),
    repoPath: input.repoPath.trim(),
    type: input.type,
    status: 'active',
    mainTechnology: (input.mainTechnology ?? 'unknown').trim() || 'unknown',
    owner: (input.owner ?? 'unknown').trim() || 'unknown',
    capabilities: input.capabilities ?? [],
    code: input.repoPath.trim() ? [`${input.repoPath.trim().replace(/\/+$/, '')}/**`] : [],
    docs: {
      moduleDesign: `${base}/module-design.md`,
      stack: `${base}/stack.md`,
      security: `${base}/security.md`,
      standards: `${base}/standards.md`,
    },
  }
}

/** Strip the leading `---` front matter block from a template body, if present. */
function stripFrontMatter(content: string): string {
  if (!content.startsWith('---\n')) return content
  const end = content.indexOf('\n---', 4)
  if (end === -1) return content
  return content.slice(end + 4).replace(/^\n+/, '')
}

/** Render a YAML scalar list, or `key: []` when empty. */
function yamlList(key: string, items: string[]): string[] {
  if (items.length === 0) return [`${key}: []`]
  return [`${key}:`, ...items.map((i) => `  - ${i}`)]
}

function frontMatter(lines: string[]): string {
  return ['---', ...lines, '---', ''].join('\n')
}

/** Fill the descriptive placeholder lines in a registry template body. */
function interpolateBody(body: string, mod: MappedModule): string {
  return body
    .replace(/<Module>/g, mod.name)
    .replace(/^\*\*Type:\*\*.*$/m, `**Type:** ${mod.type}`)
    .replace(/^\*\*Repository:\*\*.*$/m, `**Repository:** ${mod.repoPath}`)
    .replace(/^\*\*Main technology:\*\*.*$/m, `**Main technology:** ${mod.mainTechnology}`)
    .replace(/^\*\*Owner:\*\*.*$/m, `**Owner:** ${mod.owner}`)
}

function buildModuleFrontMatter(templateId: string, mod: MappedModule): string {
  const code = yamlList('code', mod.code)
  switch (templateId) {
    case 'module-design':
      return frontMatter([
        'type: module-design',
        `module: ${mod.id}`,
        `name: ${mod.name}`,
        'status: draft',
        `owner: ${mod.owner}`,
        `repoPath: ${mod.repoPath}`,
        `moduleType: ${mod.type}`,
        `mainTechnology: ${mod.mainTechnology}`,
        ...yamlList('capabilities', mod.capabilities),
        ...code,
      ])
    case 'module-stack':
      return frontMatter([
        'type: module-stack',
        `module: ${mod.id}`,
        'status: draft',
        `repoPath: ${mod.repoPath}`,
        `mainTechnology: ${mod.mainTechnology}`,
        ...code,
      ])
    case 'module-security':
      return frontMatter([
        'type: module-security',
        `module: ${mod.id}`,
        'status: draft',
        `repoPath: ${mod.repoPath}`,
        `owner: ${mod.owner}`,
        ...code,
      ])
    case 'module-standards':
      return frontMatter([
        'type: module-standards',
        `module: ${mod.id}`,
        'status: draft',
        `repoPath: ${mod.repoPath}`,
        ...code,
      ])
    default:
      return frontMatter([`type: ${templateId}`, `module: ${mod.id}`, ...code])
  }
}

/**
 * Render a module artifact from the central template registry: generated front matter
 * (authoritative metadata + `code:` globs) followed by the registry template body
 * (headings + quality checklist). Deterministic — no LLM, no templating engine.
 */
export function renderModuleArtifact(templateId: string, mod: MappedModule): string {
  const tpl = getTemplate(templateId)
  const body = tpl ? interpolateBody(stripFrontMatter(tpl.content), mod) : ''
  const rendered = buildModuleFrontMatter(templateId, mod) + body
  return rendered.endsWith('\n') ? rendered : `${rendered}\n`
}

function moduleArtifactFiles(mod: MappedModule): { path: string; content: string }[] {
  return [
    { path: mod.docs.moduleDesign, content: renderModuleArtifact('module-design', mod) },
    { path: mod.docs.stack, content: renderModuleArtifact('module-stack', mod) },
    { path: mod.docs.security, content: renderModuleArtifact('module-security', mod) },
    { path: mod.docs.standards, content: renderModuleArtifact('module-standards', mod) },
    { path: `${moduleDir(mod.id)}/diagrams/.gitkeep`, content: '' },
    { path: `${moduleDir(mod.id)}/adrs/.gitkeep`, content: '' },
  ]
}

export type MapModuleResult = {
  module: MappedModule
  written: string[]
  skipped: string[]
  alreadyRegistered: boolean
}

/**
 * Register a module in `.kaddo/modules.yml` and generate its knowledge structure.
 * Existing artifact files are never overwritten — they are reported as skipped.
 */
export function mapModule(dir: string, input: MappedModuleInput): MapModuleResult {
  const mod = buildModule(input)
  const descriptor = readModulesDescriptor(dir)

  const existingIndex = descriptor.modules.findIndex((m) => m.id === mod.id)
  const alreadyRegistered = existingIndex >= 0
  if (alreadyRegistered) {
    descriptor.modules[existingIndex] = mod
  } else {
    descriptor.modules.push(mod)
  }
  writeModulesDescriptor(dir, descriptor)

  ensureDir(join(dir, `${moduleDir(mod.id)}/diagrams`))
  ensureDir(join(dir, `${moduleDir(mod.id)}/adrs`))

  const written: string[] = []
  const skipped: string[] = []
  for (const file of moduleArtifactFiles(mod)) {
    const full = join(dir, file.path)
    if (exists(full)) {
      skipped.push(file.path)
    } else {
      writeFile(full, file.content)
      written.push(file.path)
    }
  }

  return { module: mod, written, skipped, alreadyRegistered }
}

export async function runModulesMap(dir: string = cwd()): Promise<void> {
  intro('kaddo modules map')

  if (!exists(join(dir, CONFIG_PATH))) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  log.info('Register a secondary repository as a module of this system.')

  const name = await text({
    message: 'Module name',
    placeholder: 'e.g. Frontend Web',
    validate: (v) => (v.trim().length === 0 ? 'Name is required.' : undefined),
  })

  const repoPath = await text({
    message: 'Repository path (relative to this repo)',
    placeholder: 'e.g. ../frontend',
    validate: (v) => (v.trim().length === 0 ? 'Repository path is required.' : undefined),
  })

  const type = await select<ModuleType>({
    message: 'Module type',
    options: MODULE_TYPES.map((t) => ({ value: t, label: t })),
  })

  const mainTechnology = await text({
    message: 'Main technology (optional)',
    placeholder: 'e.g. Next.js',
  })

  const owner = await text({
    message: 'Owner (optional)',
    placeholder: 'e.g. web-team',
  })

  const capabilitiesRaw = await text({
    message: 'Related capabilities (comma-separated, optional)',
    placeholder: 'e.g. customer-dashboard, loyalty-portal',
  })

  if (!exists(join(dir, repoPath.trim()))) {
    log.warn(`Path "${repoPath.trim()}" does not exist yet — registering anyway.`)
  }

  const result = mapModule(dir, {
    name,
    repoPath,
    type,
    mainTechnology,
    owner,
    capabilities: capabilitiesRaw.split(',').map((c) => c.trim()).filter(Boolean),
  })

  for (const p of result.written) log.success(`Created ${p}`)
  for (const p of result.skipped) log.info(`Kept existing ${p}`)
  log.success(`Module "${result.module.id}" recorded in ${DESCRIPTOR_PATH}`)

  outro(
    'Module mapped. Use the `module-design-agent` in your LLM with `.kaddo/context-pack.md` ' +
      'to fill in module-design.md.'
  )
}

export function runModulesList(dir: string = cwd()): void {
  const descriptor = readModulesDescriptor(dir)
  if (descriptor.modules.length === 0) {
    console.log('No modules mapped. Run `kaddo modules map` to register one.')
    return
  }
  console.log('')
  console.log('Mapped modules:')
  for (const m of descriptor.modules) {
    console.log(`  ${m.id.padEnd(16)} ${m.type.padEnd(14)} ${m.repoPath}`)
  }
  console.log('')
}
