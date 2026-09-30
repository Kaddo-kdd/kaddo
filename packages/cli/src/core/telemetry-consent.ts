import { exists, readFile, writeFile, join } from '../utils/fs.js'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { KaddoConfig } from './config.js'

export type ConsentState = 'unset' | 'enabled' | 'disabled'

export const CURRENT_CONSENT_VERSION = 1

const DEFERRAL_DURATION_MS = 24 * 60 * 60 * 1000

export function getConsentState(config: KaddoConfig | null): ConsentState {
  if (!config) return 'unset'
  const t = config.telemetry as { consent?: string; enabled?: boolean } | undefined
  if (!t) return 'unset'

  if (t.consent === 'enabled') return 'enabled'
  if (t.consent === 'disabled') return 'disabled'

  if (t.consent === undefined) {
    if (t.enabled === true) return 'enabled'
    if (t.enabled === false) return 'disabled'
  }

  return 'unset'
}

export function isInteractive(): boolean {
  if (process.env.CI) return false
  if (!process.stdin.isTTY) return false
  if (!process.stdout.isTTY) return false
  return true
}

export function persistConsent(dir: string, consent: 'enabled' | 'disabled'): void {
  const configPath = join(dir, '.kaddo', 'config.yml')
  if (!exists(configPath)) return

  const raw = readFile(configPath)
  const doc = (parseYaml(raw) ?? {}) as Record<string, unknown>
  const prev = (doc.telemetry ?? {}) as Record<string, unknown>
  delete prev.enabled
  doc.telemetry = { ...prev, consent, consentVersion: CURRENT_CONSENT_VERSION }
  writeFile(configPath, stringifyYaml(doc))
}

export function isDeferralActive(dir: string): boolean {
  const p = join(dir, '.kaddo', 'telemetry-deferred.json')
  if (!exists(p)) return false
  try {
    const data = JSON.parse(readFile(p)) as { deferredUntil: number }
    return data.deferredUntil > Date.now()
  } catch {
    return false
  }
}

export function deferConsent(dir: string): void {
  const p = join(dir, '.kaddo', 'telemetry-deferred.json')
  writeFile(p, JSON.stringify({ deferredUntil: Date.now() + DEFERRAL_DURATION_MS }))
}

export function consentNotice(): string {
  return (
    '[Telemetry consent] Anonymous usage telemetry has not been configured.\n' +
    '  Collects: command usage, version, lifecycle events.\n' +
    '  Never collects: source code, knowledge, prompts or PII.\n' +
    '  Use kaddo_set_telemetry_consent to enable, disable, or defer ("not-now").'
  )
}

export async function ensureTelemetryConsent(dir: string, config: KaddoConfig): Promise<void> {
  const state = getConsentState(config)
  if (state !== 'unset') return
  if (!isInteractive()) return

  const { confirm } = await import('../utils/ui.js')
  const accepted = await confirm({
    message:
      'Help improve Kaddo by sharing anonymous usage telemetry?\n' +
      '  Collects: command usage, version, lifecycle events.\n' +
      '  Never collects: source code, knowledge, prompts or PII.\n' +
      '  Change anytime: kaddo telemetry enable/disable',
    initialValue: false,
  })

  persistConsent(dir, accepted ? 'enabled' : 'disabled')
}
