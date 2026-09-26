// kaddo work-item — Work Item operations (VS-109).

import { loadConfig } from '../core/config.js'
import {
  importWorkItem,
  parseContent,
  computeContentHash,
  findDuplicateByHash,
  ImportError,
} from '../core/work-item-import.js'
import { intro, outro, log, confirm, cancel } from '../utils/ui.js'
import { exists, readFile, cwd } from '../utils/fs.js'

function requireProject(dir: string): void {
  if (!loadConfig(dir)) {
    log.error('No Kaddo project was found in the current directory.')
    process.exit(1)
  }
}

export async function runWorkItemImport(
  dir: string,
  fileOrText: string | undefined,
  opts: { text?: string; type?: string; yes?: boolean },
): Promise<void> {
  requireProject(dir)

  let content: string | undefined

  if (opts.text) {
    content = opts.text
  } else if (fileOrText) {
    if (!exists(fileOrText)) {
      log.error(`File not found: ${fileOrText}`)
      process.exit(1)
    }
    content = readFile(fileOrText) ?? undefined
    if (!content?.trim()) {
      log.error(`File is empty: ${fileOrText}`)
      process.exit(1)
    }
  } else if (!process.stdin.isTTY) {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer)
    content = Buffer.concat(chunks).toString('utf-8')
  }

  if (!content?.trim()) {
    log.error('No content provided. Use a file path, --text, or pipe content via stdin.')
    process.exit(1)
  }

  try {
    intro('Import external Work Item')

    const parsed = parseContent(content)
    const hash = computeContentHash(content)
    const duplicate = findDuplicateByHash(dir, hash)

    if (duplicate) {
      log.warn(`Already imported as ${duplicate.workItemId}.`)
      outro('No duplicate was created.')
      return
    }

    log.info(`Format: ${parsed.format}`)
    log.info(`Title: ${parsed.title}`)
    log.message(`Type: ${opts.type ?? parsed.type ?? 'feature'}`)
    log.message('Will create: a Draft Work Item (needs refinement).')
    log.message('No project files have been modified yet.')

    if (!opts.yes) {
      const ok = await confirm({ message: 'Import this content as a Draft Work Item?' })
      if (ok !== true) {
        cancel('Import cancelled. No files were changed.')
        process.exit(0)
      }
    }

    const result = importWorkItem(dir, {
      content,
      source: 'cli',
      type: opts.type,
      filePath: fileOrText,
    })

    if (!result.created) {
      log.warn(`Already imported as ${result.duplicateOf}.`)
      outro('No duplicate was created.')
      return
    }

    log.info(`Created ${result.workItemId} (Draft, needs refinement).`)
    log.info(`Path: ${result.path}`)
    if (result.discardedFields?.length) {
      log.warn(`Lifecycle fields discarded from import: ${result.discardedFields.join(', ')}`)
      log.message('Kaddo always generates its own id and status — external values are ignored.')
    }
    log.message('executed = false — the Work Item has NOT been implemented.')

    if (result.refinementHandoff) {
      log.step('Refinement handoff')
      log.message(`Agent: ${result.refinementHandoff.recommendedAgent}`)
      log.message(`Skill: ${result.refinementHandoff.recommendedSkill}`)
    }

    outro('Done. Refine it next with the Work Item refinement handoff.')
  } catch (err) {
    if (err instanceof ImportError) log.error(`[${err.code}] ${err.message}`)
    else log.error('The import operation failed.')
    process.exit(1)
  }
}
