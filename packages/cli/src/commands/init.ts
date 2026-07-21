import path from 'path'
import { exists, writeFile, ensureDir, readFile, cwd, join } from '../utils/fs.js'
import { intro, outro, log, text, confirm, select } from '../utils/ui.js'

const KADDO_DIR = '.kaddo'
const ARCH_DIR = 'knowledge'

function inferProjectName(dir: string): string {
  const pkgPath = join(dir, 'package.json')
  if (exists(pkgPath)) {
    try {
      const pkg = JSON.parse(readFile(pkgPath))
      if (pkg.name) return pkg.name
    } catch {
      // ignore
    }
  }
  return path.basename(dir)
}

function hasGit(dir: string): boolean {
  return exists(join(dir, '.git'))
}

interface ProjectMeta {
  name: string
  state: string
  teamSize: string
  structure: string
  language: string
  role?: string
  parentSystem?: string
  moduleId?: string
}

function buildConfig(meta: ProjectMeta): string {
  let yml = `version: 1
project:
  name: "${meta.name}"
  state: ${meta.state}
  structure: ${meta.structure}
  language: ${meta.language}${meta.role ? `\n  role: ${meta.role}` : ''}
  domains: []
team:
  size: ${meta.teamSize}
knowledge:
  default_level: K2
guard:
  silent_without_ownership: true
`
  if (meta.role === 'core') {
    yml += `\nmultirepo:\n  role: core\n  modules_file: knowledge/modules/modules.md\n`
  }
  if (meta.role === 'module') {
    yml += `\nmultirepo:\n  role: module${meta.parentSystem ? `\n  parent_system: ${meta.parentSystem}` : ''}\n`
    yml += `\nmodule:\n  id: ${meta.moduleId ?? meta.name}\n`
  }
  return yml
}

function buildModuleContext(moduleId: string, parentSystem: string): string {
  return `---
type: module-context
scope: module
module_id: ${moduleId}
parent_system: ${parentSystem}
generated_by: kaddo-init
template_version: 1
---

# Module Context

## Module identity

_Describe the module name, purpose, and role inside the parent system._

## Responsibility

_Describe what this module owns inside the system._

## Boundaries

_Describe what belongs to this module and what should not be handled here._

## Exposed interfaces

_List APIs, routes, events, tables, packages, contracts, or other integration points exposed by this module._

## Dependencies

_List modules, services, databases, queues, providers, or infrastructure this module depends on._

## Consumers

_List modules, apps, teams, or external systems that consume this module._

## Local rules

_Document module-specific rules that agents and developers must respect._

## Risks

_Document known risks when changing this module._

## Open questions

- [open] _What still needs confirmation about this module?_
`
}

function buildSystemContext(projectName: string): string {
  return `---
type: system-context
scope: system
generated_by: kaddo-init
template_version: 1
---

# ${projectName} — System Context

## System purpose

_Describe the overall purpose of the system and the problem it solves._

## System components

_List the repositories, services, and modules that compose the system._

## Integration model

_Describe how components communicate: APIs, events, shared databases, queues, etc._

## Deployment topology

_How the system is deployed: regions, environments, infrastructure._

## Cross-cutting concerns

_Auth, observability, error handling, compliance, and other shared concerns._
`
}

function buildModulesFile(projectName: string): string {
  return `---
type: modules-map
system: ${projectName}
generated_by: kaddo-init
template_version: 1
---

# ${projectName} — Modules

_List the modules that compose this system. Each module is a repository with its own \`kaddo init\` as a multirepo module._

## Modules

_No modules mapped yet. Run \`kaddo modules map\` to register one._
`
}

function buildKnowledge(projectName: string): string {
  return `---
type: current-state
updated_at: ${new Date().toISOString().split('T')[0]}
---

# ${projectName} — Knowledge

> What is true about this product right now.

## Purpose

_Describe what this product does and who it serves._

## Architecture overview

_High-level description of the main components._

## Key domains

_List the main domains or bounded contexts._

## Active constraints

_Technical, regulatory, or operational constraints that shape decisions._
`
}

function buildRoadmap(projectName: string): string {
  return `---
type: roadmap
updated_at: ${new Date().toISOString().split('T')[0]}
---

# ${projectName} — Roadmap

> What we intend to build and why.

## Now

_What is in progress or planned for the immediate cycle._

## Next

_What comes after the current cycle._

## Later

_Ideas and intentions not yet committed._
`
}

export async function runInit(): Promise<void> {
  const dir = cwd()

  intro('kaddo init')

  if (!hasGit(dir)) {
    log.warn('No Git repository detected. Kaddo works best inside a Git repo.')
  }

  const kaddoExists = exists(join(dir, KADDO_DIR, 'config.yml'))

  if (kaddoExists) {
    const overwrite = await confirm({
      message: 'Kaddo is already initialized. Overwrite configuration?',
      initialValue: false,
    })
    if (!overwrite) {
      outro('Nothing changed.')
      return
    }
  }

  const inferredName = inferProjectName(dir)
  const projectName = await text({
    message: 'Project name',
    initialValue: inferredName,
    validate: (v) => (v.trim().length === 0 ? 'Project name is required.' : undefined),
  })

  const state = await select<string>({
    message: 'What kind of project is this?',
    options: [
      { value: 'new', label: 'New', hint: 'Starting from scratch' },
      { value: 'pre-ai', label: 'Pre-AI', hint: 'Existing code, not prepared for agents' },
      { value: 'legacy', label: 'Legacy', hint: 'Knowledge lives in people\'s heads' },
    ],
    initialValue: 'pre-ai',
  })

  const teamSize = await select<string>({
    message: 'Team size',
    options: [
      { value: 'indie', label: 'Indie', hint: '1 person' },
      { value: 'small', label: 'Small', hint: '2-5 people' },
      { value: 'medium', label: 'Medium', hint: '6-20 people' },
      { value: 'enterprise', label: 'Enterprise', hint: '20+ people' },
    ],
    initialValue: 'small',
  })

  const structure = await select<string>({
    message: 'Repository structure',
    options: [
      { value: 'monorepo', label: 'Monorepo' },
      { value: 'multirepo', label: 'Multirepo' },
    ],
    initialValue: 'monorepo',
  })

  // Knowledge language (VS-051) — the CLI stays in English; this only affects generated knowledge.
  const language = await select<string>({
    message: 'Project knowledge language (the CLI stays in English)',
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
    ],
    initialValue: 'en',
  })

  // VS-091: multirepo core/module distinction.
  let role: string | undefined
  let parentSystem: string | undefined
  let modId: string | undefined

  if (structure === 'multirepo') {
    role = await select<string>({
      message: 'Is this repository the core or a module?',
      options: [
        { value: 'core', label: 'Core / system orchestrator' },
        { value: 'module', label: 'Module of an existing system' },
      ],
    })

    if (role === 'module') {
      parentSystem = await text({
        message: 'Parent system name',
        placeholder: 'e.g. dotear-platform',
        validate: (v) => (v.trim().length === 0 ? 'Parent system name is required.' : undefined),
      })
      modId = await text({
        message: 'Module ID',
        placeholder: 'e.g. loyalty',
        validate: (v) => (v.trim().length === 0 ? 'Module ID is required.' : undefined),
      })
    }
  }

  const meta: ProjectMeta = {
    name: projectName.trim(),
    state,
    teamSize,
    structure,
    language,
    role,
    parentSystem: parentSystem?.trim(),
    moduleId: modId?.trim(),
  }

  // Create .kaddo/
  const kaddoConfigPath = join(dir, KADDO_DIR, 'config.yml')
  writeFile(kaddoConfigPath, buildConfig(meta))
  log.success('Created .kaddo/config.yml')

  if (role === 'module') {
    // Module: module-context + tech stubs + work-items dir (no business/product/agents/skills).
    ensureDir(join(dir, ARCH_DIR, 'module'))
    writeFile(
      join(dir, ARCH_DIR, 'module', 'module-context.md'),
      buildModuleContext(modId!.trim(), parentSystem!.trim()),
    )
    ensureDir(join(dir, ARCH_DIR, 'tech'))
    if (!exists(join(dir, ARCH_DIR, 'tech', 'current-state.md'))) {
      writeFile(join(dir, ARCH_DIR, 'tech', 'current-state.md'), buildKnowledge(projectName.trim()))
    }
    if (!exists(join(dir, ARCH_DIR, 'tech', 'codebase.md'))) {
      writeFile(join(dir, ARCH_DIR, 'tech', 'codebase.md'), buildKnowledge(projectName.trim()))
    }
    ensureDir(join(dir, ARCH_DIR, 'delivery', 'work-items'))
    log.success('Created knowledge/module/module-context.md')
    log.success('Created knowledge/tech/current-state.md')
    log.success('Created knowledge/tech/codebase.md')
    log.info('Next: run `kaddo scan` to detect your stack, then use module-context-agent to refine module-context.md.')
  } else if (role === 'core') {
    // Core: full knowledge structure + system context + modules map.
    ensureDir(join(dir, ARCH_DIR, 'delivery', 'work-items'))
    ensureDir(join(dir, ARCH_DIR, 'system'))
    ensureDir(join(dir, ARCH_DIR, 'modules'))
    writeFile(join(dir, ARCH_DIR, 'knowledge.md'), buildKnowledge(projectName.trim()))
    writeFile(join(dir, ARCH_DIR, 'delivery', 'roadmap.md'), buildRoadmap(projectName.trim()))
    writeFile(join(dir, ARCH_DIR, 'system', 'system-context.md'), buildSystemContext(projectName.trim()))
    writeFile(join(dir, ARCH_DIR, 'modules', 'modules.md'), buildModulesFile(projectName.trim()))
    log.success('Created knowledge/knowledge.md')
    log.success('Created knowledge/delivery/roadmap.md')
    log.success('Created knowledge/system/system-context.md')
    log.success('Created knowledge/modules/modules.md')
    log.info('Next: run `kaddo scan` then `kaddo add agents` and `kaddo add skills`.')
  } else {
    // Single repo or plain multirepo without role.
    ensureDir(join(dir, ARCH_DIR, 'delivery', 'work-items'))
    writeFile(join(dir, ARCH_DIR, 'knowledge.md'), buildKnowledge(projectName.trim()))
    writeFile(join(dir, ARCH_DIR, 'delivery', 'roadmap.md'), buildRoadmap(projectName.trim()))
    log.success('Created knowledge/knowledge.md')
    log.success('Created knowledge/delivery/roadmap.md')
    log.success('Created knowledge/delivery/work-items/')
    log.info('Next: run `kaddo scan` to detect your stack.')
  }

  outro('Kaddo initialized.')
}
