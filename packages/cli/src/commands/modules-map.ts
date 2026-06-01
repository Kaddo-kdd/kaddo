import { cwd, exists, join, writeFile, readFile, ensureDir } from '../utils/fs.js'
import { intro, outro, log, text, select } from '../utils/ui.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

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
  return `architecture/modules/${id}`
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

function moduleArtifactFiles(mod: MappedModule): { path: string; content: string }[] {
  const title = mod.name
  return [
    {
      path: mod.docs.moduleDesign,
      content: [
        `# ${title} — Design`,
        '',
        '> Starter template. Refine it with the Kaddo `module-design-agent` in your LLM.',
        '',
        `**Type:** ${mod.type}`,
        `**Repository:** ${mod.repoPath}`,
        `**Main technology:** ${mod.mainTechnology}`,
        `**Owner:** ${mod.owner}`,
        '',
        '## Purpose',
        '',
        '## Boundaries',
        '',
        '## Inputs / Outputs',
        '',
        '## Dependencies',
        '',
        '## Related capabilities',
        '',
        ...(mod.capabilities.length ? mod.capabilities.map((c) => `- ${c}`) : ['- TODO']),
        '',
        '## Ownership',
        '',
        '## Diagrams to create',
        '',
        '## Risks & open questions',
        '',
      ].join('\n'),
    },
    {
      path: mod.docs.stack,
      content: [
        `# ${title} — Stack`,
        '',
        '> Starter template. Refine it with the Kaddo `stack-agent` in your LLM.',
        '',
        `**Main technology:** ${mod.mainTechnology}`,
        '',
        '## Languages',
        '',
        '## Frameworks',
        '',
        '## Data',
        '',
        '## Infrastructure',
        '',
        '## Unknowns / needs confirmation',
        '',
      ].join('\n'),
    },
    {
      path: mod.docs.security,
      content: [
        `# ${title} — Security Considerations`,
        '',
        '> Starter template. Refine it with the Kaddo `security-agent` in your LLM.',
        '> Kaddo does **not** perform security scanning.',
        '',
        '## Authentication & authorization',
        '',
        '## Data sensitivity',
        '',
        '## Secrets handling',
        '',
        '## Open questions',
        '',
      ].join('\n'),
    },
    {
      path: mod.docs.standards,
      content: [
        `# ${title} — Standards`,
        '',
        '> Starter template. Refine it with the Kaddo `standards-agent` in your LLM.',
        '',
        '## Coding standards',
        '',
        '## Testing expectations',
        '',
        '## PR checklist',
        '',
      ].join('\n'),
    },
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
