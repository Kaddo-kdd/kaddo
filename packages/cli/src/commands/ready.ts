// kaddo ready — Work Item review and ready transition (VS-087).
//
// Transitions a draft Work Item to ready after human review. Updates the frontmatter
// status and moves the file from draft/ to ready/. Deterministic, no LLM, no git.

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { exists, readFile, writeFile, join, ensureDir } from '../utils/fs.js'
import { loadConfig } from '../core/config.js'
import { discoverWorkItems, type KnowledgeArtifact } from '../services/knowledge-artifacts.js'
import { parseWorkItemSource, renderSourceCompact } from '../core/work-item-source.js'
import { intro, outro, log, confirm, cancel } from '../utils/ui.js'

export type ReadyWarning = {
  field: string
  message: string
}

export function validateReadiness(content: string, frontmatter: Record<string, unknown>): ReadyWarning[] {
  const warnings: ReadyWarning[] = []
  const body = content.replace(/^---[\s\S]*?---/, '').trim()
  const lower = body.toLowerCase()

  if (!frontmatter.domains || (Array.isArray(frontmatter.domains) && frontmatter.domains.length === 0)) {
    warnings.push({ field: 'domains', message: 'No domains declared.' })
  }

  const code = frontmatter.code
  if (!code || (Array.isArray(code) && code.length === 0)) {
    warnings.push({ field: 'code', message: 'No code ownership globs declared.' })
  }

  const hasAC = /## acceptance criteria|## criterios de aceptación/i.test(body)
  if (!hasAC) {
    warnings.push({ field: 'acceptance_criteria', message: 'No acceptance criteria section found.' })
  } else {
    const acSection = extractSection(body, /## acceptance criteria|## criterios de aceptación/i)
    if (acSection && acSection.trim().length === 0) {
      warnings.push({ field: 'acceptance_criteria', message: 'Acceptance criteria section is empty.' })
    }
  }

  const hasValidation = /## validation|## validación/i.test(body)
  if (!hasValidation) {
    warnings.push({ field: 'validation', message: 'No validation section found.' })
  }

  const hasOQ = /## open questions|## preguntas abiertas/i.test(body)
  if (hasOQ) {
    const oqSection = extractSection(body, /## open questions|## preguntas abiertas/i)
    if (oqSection && !isResolvedSection(oqSection)) {
      warnings.push({ field: 'open_questions', message: 'Open questions are still present.' })
    }
  }

  return warnings
}

function extractSection(body: string, headerPattern: RegExp): string | null {
  const lines = body.split(/\r?\n/)
  let capture = false
  const result: string[] = []
  for (const line of lines) {
    if (capture) {
      if (/^#{1,3}\s/.test(line)) break
      result.push(line)
    } else if (headerPattern.test(line)) {
      capture = true
    }
  }
  return capture ? result.join('\n').trim() : null
}

function isResolvedSection(text: string): boolean {
  const t = text.trim().toLowerCase()
  return t === '' || /^(none|ninguna|resolved|resueltas|deferred|diferidas)\.?$/i.test(t)
}

export function transitionToReady(filePath: string): { newPath: string; newContent: string } {
  const raw = readFile(filePath)
  const { data, content } = matter(raw)
  const today = new Date().toISOString().slice(0, 10)

  data.status = 'ready'
  data.ready_at = today

  const newContent = matter.stringify(content, data)

  const posix = filePath.replace(/\\/g, '/')
  let newPath = filePath
  if (posix.includes('/work-items/draft/')) {
    const readyDir = path.dirname(filePath).replace(/[/\\]draft$/, path.sep + 'ready')
    ensureDir(readyDir)
    const fileName = path.basename(filePath)
    newPath = path.join(readyDir, fileName)
  }

  return { newPath, newContent }
}

function findWorkItem(dir: string, id: string): KnowledgeArtifact | null {
  const wis = discoverWorkItems(dir)
  return wis.find((w) => w.id.toLowerCase() === id.toLowerCase()) ?? null
}

export async function runReady(id: string, opts: { yes?: boolean } = {}) {
  const dir = process.cwd()
  intro('kaddo ready ' + id)

  const config = loadConfig(dir)
  if (!config) {
    log.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }

  const wi = findWorkItem(dir, id)
  if (!wi) {
    log.error(`Work Item ${id} not found.`)
    log.info('Run `kaddo history` or check knowledge/delivery/work-items/ for available IDs.')
    process.exit(1)
  }

  if (wi.lifecycle === 'ready') {
    log.info(`Work Item ${wi.id} is already ready.`)
    log.info('Suggested next: kaddo context && kaddo understand')
    outro('Nothing to do.')
    return
  }

  if (wi.lifecycle !== 'draft') {
    log.error(`Work Item ${wi.id} is in state "${wi.lifecycle}", not "draft". Only draft Work Items can be marked as ready.`)
    process.exit(1)
  }

  const raw = readFile(wi.filePath)
  const { data } = matter(raw)
  const source = parseWorkItemSource(data as Record<string, unknown>)
  const warnings = validateReadiness(raw, data as Record<string, unknown>)

  log.info(`Work Item found:`)
  log.info(`  ${wi.id} — ${wi.title}`)
  log.info('')
  log.info(`  Status: draft → ready`)
  log.info(`  Type: ${wi.type}`)
  log.info(`  Knowledge level: ${wi.knowledgeLevel || 'unset'}`)
  log.info(`  Domains: ${wi.domains.length > 0 ? wi.domains.join(', ') : 'none'}`)
  log.info(`  Source: ${renderSourceCompact(source)}`)
  if (wi.codeGlobs.length > 0) {
    log.info(`  Code ownership:`)
    for (const g of wi.codeGlobs) log.info(`    - ${g}`)
  } else {
    log.info(`  Code ownership: none`)
  }

  if (warnings.length > 0) {
    log.warn('')
    log.warn('This Work Item may not be ready:')
    for (const w of warnings) {
      log.warn(`  - ${w.message}`)
    }
  }

  if (!opts.yes) {
    log.info('')
    const proceed = await confirm({ message: 'Mark this Work Item as ready for implementation?' })
    if (!proceed) {
      cancel('Cancelled.')
      return
    }
  }

  const { newPath, newContent } = transitionToReady(wi.filePath)

  if (newPath !== wi.filePath) {
    writeFile(newPath, newContent)
    fs.unlinkSync(wi.filePath)
    log.success(`Updated status: ready`)
    log.success(`Moved file:`)
    log.info(`  ${path.relative(dir, wi.filePath)}`)
    log.info(`  → ${path.relative(dir, newPath)}`)
  } else {
    writeFile(wi.filePath, newContent)
    log.success(`Updated status: ready`)
  }

  log.info('')
  log.info('Run `kaddo context && kaddo understand` to refresh the handoff.')
  outro(`Work Item ${wi.id} is ready.`)
}
