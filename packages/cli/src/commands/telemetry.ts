import { loadConfig } from '../core/config.js'
import { getStatus } from '../core/telemetry.js'
import { exists, readFile, writeFile, join } from '../utils/fs.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { intro, outro, log } from '../utils/ui.js'

export function runTelemetryStatus() {
  const dir = process.cwd()
  intro('kaddo telemetry status')

  const config = loadConfig(dir)
  if (!config) {
    log.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }

  const status = getStatus(dir)
  log.info(`  Enabled:        ${status.enabled}`)
  log.info(`  Registered:     ${status.registered}`)
  log.info(`  Pending events: ${status.pendingEvents}`)

  if (!status.enabled) {
    log.info('')
    log.info('Enable with: kaddo telemetry enable')
  }

  outro('Telemetry status.')
}

export function runTelemetryEnable() {
  const dir = process.cwd()
  intro('kaddo telemetry enable')
  setTelemetryEnabled(dir, true)
  log.success('Telemetry enabled.')
  log.info('Kaddo will send anonymous usage metadata to telemetry.kaddo.org.')
  log.info('No project content, source code, prompts or PII is ever transmitted.')
  outro('Run `kaddo telemetry status` to check the current state.')
}

export function runTelemetryDisable() {
  const dir = process.cwd()
  intro('kaddo telemetry disable')
  setTelemetryEnabled(dir, false)
  log.success('Telemetry disabled.')
  log.info('No telemetry requests will be made.')
  outro('Run `kaddo telemetry enable` to re-enable.')
}

function setTelemetryEnabled(dir: string, enabled: boolean): void {
  const configPath = join(dir, '.kaddo', 'config.yml')
  if (!exists(configPath)) {
    log.error('Kaddo is not initialized. Run `kaddo init` first.')
    process.exit(1)
  }

  const raw = readFile(configPath)
  const doc = (parseYaml(raw) ?? {}) as Record<string, unknown>
  doc.telemetry = { ...(doc.telemetry as Record<string, unknown> ?? {}), enabled }
  writeFile(configPath, stringifyYaml(doc))
}
