import { loadConfig } from '../core/config.js'
import { getStatus } from '../core/telemetry.js'
import { persistConsent } from '../core/telemetry-consent.js'
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
  log.info(`  Consent:        ${status.consent}`)
  log.info(`  Registered:     ${status.registered}`)
  log.info(`  Pending events: ${status.pendingEvents}`)

  if (status.consent === 'unset') {
    log.info('')
    log.info('Enable with: kaddo telemetry enable')
  }

  outro('Telemetry status.')
}

export function runTelemetryEnable() {
  const dir = process.cwd()
  intro('kaddo telemetry enable')
  persistConsent(dir, 'enabled')
  log.success('Telemetry enabled.')
  log.info('Kaddo will send anonymous usage metadata to telemetry.kaddo.org.')
  log.info('No project content, source code, prompts or PII is ever transmitted.')
  outro('Run `kaddo telemetry status` to check the current state.')
}

export function runTelemetryDisable() {
  const dir = process.cwd()
  intro('kaddo telemetry disable')
  persistConsent(dir, 'disabled')
  log.success('Telemetry disabled.')
  log.info('No telemetry requests will be made.')
  outro('Run `kaddo telemetry enable` to re-enable.')
}
