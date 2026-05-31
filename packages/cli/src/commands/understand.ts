import { writeFile, exists, join, cwd } from '../utils/fs.js'
import { intro, outro, log } from '../utils/ui.js'
import { loadConfig, ConfigError } from '../core/config.js'
import { buildContextPack, serializeContextPackJson } from '../core/context-pack.js'
import { renderContextPack } from '../templates/context-pack-template.js'
import { buildUnderstandPlan } from '../core/understand.js'
import { renderUnderstand, renderUnderstandTerminal } from '../templates/understand-template.js'

export function runUnderstand(): void {
  const dir = cwd()

  intro('kaddo understand')

  // 1. Require an initialized project.
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

  // 2. Check the scan baseline (non-blocking — continue with an incomplete pack).
  const scanAvailable = exists(join(dir, '.kaddo', 'scan.json'))
  if (!scanAvailable) {
    log.warn('No scan baseline found. Run `kaddo scan` first for a richer context pack.')
  }

  // 3. Generate / refresh the context pack (reuse the VS-004 builder).
  const pack = buildContextPack(dir, config)
  writeFile(join(dir, '.kaddo', 'context-pack.json'), serializeContextPackJson(pack))
  writeFile(join(dir, '.kaddo', 'context-pack.md'), renderContextPack(pack))
  log.success('Refreshed .kaddo/context-pack.md')

  // 4. Build the state-aware plan and check installed agents.
  const plan = buildUnderstandPlan(dir, config)
  if (plan.missingAgents.length > 0) {
    log.warn(
      `Agents are not installed (${plan.missingAgents.map((a) => a.replace(/\.md$/, '')).join(', ')}). Run \`kaddo add agents\`.`
    )
  }

  // 5. Print the concise handoff and write the reusable guide.
  console.log(renderUnderstandTerminal(plan))

  writeFile(join(dir, '.kaddo', 'understand.md'), renderUnderstand(plan))
  log.success('Wrote .kaddo/understand.md')

  outro('Handoff ready. CLI prepares context — your LLM creates the understanding.')
}
