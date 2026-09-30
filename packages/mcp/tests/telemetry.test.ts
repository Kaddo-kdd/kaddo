import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { telemetryStatusTool, setTelemetryConsentTool } from '../src/tools.js'
import { makeProject, write, config, cleanup } from './helpers.js'

let root: string
afterEach(() => root && cleanup(root))

describe('kaddo_telemetry_status', () => {
  it('returns unset consent for fresh project', () => {
    root = makeProject()
    config(root)
    const result = telemetryStatusTool(root)
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.consent).toBe('unset')
    expect(data.registered).toBe(false)
    expect(data.pendingEvents).toBe(0)
    expect(data.notice).toBeTruthy()
  })

  it('returns enabled consent after setting it', () => {
    root = makeProject()
    config(root)
    setTelemetryConsentTool(root, { consent: 'enabled', confirm: true })
    const result = telemetryStatusTool(root)
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.consent).toBe('enabled')
    expect(data.notice).toBeUndefined()
  })

  it('omits notice when deferral is active', () => {
    root = makeProject()
    config(root)
    setTelemetryConsentTool(root, { consent: 'not-now', confirm: true })
    const result = telemetryStatusTool(root)
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.consent).toBe('unset')
    expect(data.notice).toBeUndefined()
  })
})

describe('kaddo_set_telemetry_consent', () => {
  it('returns preview without confirm', () => {
    root = makeProject()
    config(root)
    const result = setTelemetryConsentTool(root, { consent: 'enabled' })
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.instruction).toContain('confirm=true')
  })

  it('enables telemetry with confirm', () => {
    root = makeProject()
    config(root)
    const result = setTelemetryConsentTool(root, { consent: 'enabled', confirm: true })
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.applied).toBe(true)
    expect(data.consent).toBe('enabled')

    const raw = fs.readFileSync(path.join(root, '.kaddo', 'config.yml'), 'utf-8')
    expect(raw).toContain('consent: enabled')
    expect(raw).toContain('consentVersion: 1')
  })

  it('disables telemetry with confirm', () => {
    root = makeProject()
    config(root)
    const result = setTelemetryConsentTool(root, { consent: 'disabled', confirm: true })
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.consent).toBe('disabled')
  })

  it('defers consent with not-now', () => {
    root = makeProject()
    config(root)
    const result = setTelemetryConsentTool(root, { consent: 'not-now', confirm: true })
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.deferred).toBe(true)
    expect(data.consent).toBe('unset')

    const deferred = fs.existsSync(path.join(root, '.kaddo', 'telemetry-deferred.json'))
    expect(deferred).toBe(true)
  })

  it('rejects invalid consent value', () => {
    root = makeProject()
    config(root)
    const result = setTelemetryConsentTool(root, { consent: 'invalid', confirm: true })
    expect(result.ok).toBe(false)
  })

  it('cross-interface: CLI enable is visible from MCP status', () => {
    root = makeProject()
    config(root)

    // Simulate CLI enable by writing config directly (same as persistConsent)
    const configPath = path.join(root, '.kaddo', 'config.yml')
    const raw = fs.readFileSync(configPath, 'utf-8')
    fs.writeFileSync(
      configPath,
      raw + 'telemetry:\n  consent: enabled\n  consentVersion: 1\n',
    )

    const result = telemetryStatusTool(root)
    expect(result.ok).toBe(true)
    const data = (result as { data: Record<string, unknown> }).data
    expect(data.consent).toBe('enabled')
  })
})
