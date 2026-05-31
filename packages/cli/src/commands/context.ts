import { writeFile, join, cwd } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { loadConfig, ConfigError } from '../core/config.js'
import { buildContextPack, serializeContextPackJson } from '../core/context-pack.js'
import { renderContextPack } from '../templates/context-pack-template.js'

type ContextFormat = 'markdown' | 'json'
type ContextOpts = { format?: string }

export function runContext(opts: ContextOpts = {}): void {
  const dir = cwd()

  intro('kaddo context')

  let config
  try {
    config = loadConfig(dir)
  } catch (err) {
    const message = err instanceof ConfigError ? err.message : String(err)
    console.error(message)
    process.exit(1)
  }

  if (!config) {
    console.error('Kaddo is not initialized in this project.')
    console.error('Run `kaddo init` first.')
    process.exit(1)
  }

  const pack = buildContextPack(dir, config)

  const format = opts.format as ContextFormat | undefined
  const writeMarkdown = format !== 'json'
  const writeJson = format !== 'markdown'

  if (writeJson) {
    const jsonPath = join(dir, '.kaddo', 'context-pack.json')
    writeFile(jsonPath, serializeContextPackJson(pack))
    log.success('Wrote .kaddo/context-pack.json')
  }

  if (writeMarkdown) {
    const mdPath = join(dir, '.kaddo', 'context-pack.md')
    writeFile(mdPath, renderContextPack(pack))
    log.success('Wrote .kaddo/context-pack.md')
  }

  if (pack.missing.length > 0) {
    log.warn(`Some context is missing (${pack.missing.length} item(s)) — see the pack's "Missing Context" section.`)
  }

  log.info('Paste .kaddo/context-pack.md into your LLM chat alongside a Kaddo agent prompt.')
  outro('Context pack ready.')
}
