import { cwd, exists, writeFile, join } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { requireConfig } from '../core/config.js'
import { printCommandFooter } from '../core/command-help.js'
import {
  buildCapsule,
  buildSystemCapsule,
  buildModuleCapsule,
  renderCapsuleMarkdown,
  serializeCapsuleJson,
  addExternalCapsule,
} from '../core/capsule.js'

function slug(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project'
}

export type CapsuleExportOptions = { scope?: string; module?: string }

/** `kaddo capsule export` — write a Knowledge Capsule about this project. */
export function runCapsuleExport(opts: CapsuleExportOptions = {}): void {
  const dir = cwd()
  const config = requireConfig(dir)
  intro('kaddo capsule export')

  let capsule
  let name: string

  if (opts.module) {
    capsule = buildModuleCapsule(dir, opts.module, config)
    if (!capsule) {
      console.error(`Module "${opts.module}" not found in .kaddo/modules.yml.`)
      process.exit(1)
    }
    name = `${slug(config.project.name)}-${slug(opts.module)}`
  } else if (opts.scope === 'system') {
    capsule = buildSystemCapsule(dir, config)
    name = `${slug(config.project.name)}-system`
  } else {
    capsule = buildCapsule(dir, config)
    name = slug(config.project.name)
  }

  const mdPath = join('.kaddo', 'exports', `${name}.capsule.md`)
  const jsonPath = join('.kaddo', 'exports', `${name}.capsule.json`)

  writeFile(join(dir, mdPath), renderCapsuleMarkdown(capsule))
  writeFile(join(dir, jsonPath), serializeCapsuleJson(capsule))

  log.success(`Wrote ${mdPath}`)
  log.success(`Wrote ${jsonPath}`)
  log.info('Refine it with the capsule-agent before sharing — and never include secrets or source code.')
  printCommandFooter('capsule export')
  outro('Knowledge Capsule exported.')
}

/** `kaddo capsule add <path>` — register an external Knowledge Capsule as context. */
export function runCapsuleAdd(srcPath: string): void {
  const dir = cwd()
  requireConfig(dir)
  intro('kaddo capsule add')

  if (!srcPath) {
    console.error('Usage: kaddo capsule add <path-to-capsule.md>')
    process.exit(1)
  }
  const abs = join(dir, srcPath)
  const source = exists(abs) ? abs : srcPath
  if (!exists(source)) {
    console.error(`Capsule not found: ${srcPath}`)
    process.exit(1)
  }

  const result = addExternalCapsule(dir, source)
  if (!result.isCapsuleType) {
    log.warn('This file is not marked as a knowledge-capsule (front matter `type: knowledge-capsule`).')
  }
  log.success(`Imported capsule "${result.id}" → ${result.destRel}`)
  log.success('Registered in .kaddo/external.yml')
  log.info('Run `kaddo context` — the pack now includes an "External Knowledge" section.')
  printCommandFooter('capsule add')
  outro('External capsule registered.')
}
