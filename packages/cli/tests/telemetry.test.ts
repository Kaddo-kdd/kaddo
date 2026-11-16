import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { ensureIdentity, ensureProjectId, loadIdentity, signPayload } from '../src/core/telemetry-identity.js'
import { createEvent } from '../src/core/telemetry-events.js'
import { enqueue, readBuffer, clearBuffer, bufferSize } from '../src/core/telemetry-buffer.js'
import { isEnabled, getStatus } from '../src/core/telemetry.js'
import { getConsentState, persistConsent, isInteractive, isDeferralActive, deferConsent, consentNotice } from '../src/core/telemetry-consent.js'
import { loadConfig } from '../src/core/config.js'

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-telemetry-'))
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, '.kaddo', 'config.yml'),
    'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\n',
  )
  return dir
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

describe('telemetry-identity', () => {
  let dir: string
  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { cleanup(dir) })

  it('creates and persists an identity', () => {
    const identity = ensureIdentity(dir)
    expect(identity.installationId).toMatch(/^[0-9a-f-]{36}$/)
    expect(identity.publicKey).toBeTruthy()
    expect(identity.privateKey).toBeTruthy()
    expect(identity.keyAlgorithm).toBe('Ed25519')
    expect(identity.registered).toBe(false)

    const loaded = loadIdentity(dir)
    expect(loaded).toEqual(identity)
  })

  it('returns existing identity on second call', () => {
    const first = ensureIdentity(dir)
    const second = ensureIdentity(dir)
    expect(second.installationId).toBe(first.installationId)
  })

  it('produces a valid Ed25519 signature', () => {
    const identity = ensureIdentity(dir)
    const sig = signPayload(identity, 'POST', '/v1/events', '1700000000', 'testnonce', 'abc123')
    expect(sig).toBeTruthy()
    expect(typeof sig).toBe('string')

    const canonical = 'POST\n/v1/events\n' + identity.installationId + '\n1700000000\ntestnonce\nabc123'
    const pubDer = Buffer.from(identity.publicKey, 'base64url')
    const pubKey = crypto.createPublicKey({ key: pubDer, format: 'der', type: 'spki' })
    const valid = crypto.verify(null, Buffer.from(canonical), pubKey, Buffer.from(sig, 'base64url'))
    expect(valid).toBe(true)
  })
})

describe('project telemetry identity', () => {
  let dir: string
  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { cleanup(dir) })

  it('persists through restart and a path move without deriving from either path', () => {
    const first = ensureProjectId(dir)
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(ensureProjectId(dir)).toBe(first)
    const moved = `${dir}-moved`
    fs.renameSync(dir, moved)
    dir = moved
    expect(ensureProjectId(dir)).toBe(first)
  })

  it('keeps a versioned clone as the same logical project and separates a new project', () => {
    const projectId = ensureProjectId(dir)
    const clone = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-telemetry-clone-'))
    fs.cpSync(dir, clone, { recursive: true })
    const other = makeTempDir()
    try {
      expect(ensureProjectId(clone)).toBe(projectId)
      expect(ensureProjectId(other)).not.toBe(projectId)
    } finally { cleanup(clone); cleanup(other) }
  })

  it('keeps installation identities separate for two installations of one project', () => {
    const a = ensureIdentity(dir)
    const projectId = ensureProjectId(dir)
    const secondInstallation = makeTempDir()
    try {
      const projectConfig = fs.readFileSync(path.join(dir, '.kaddo', 'config.yml'))
      fs.writeFileSync(path.join(secondInstallation, '.kaddo', 'config.yml'), projectConfig)
      expect(ensureProjectId(secondInstallation)).toBe(projectId)
      expect(ensureIdentity(secondInstallation).installationId).not.toBe(a.installationId)
    } finally { cleanup(secondInstallation) }
  })
})

describe('telemetry-events', () => {
  it('creates a well-formed event', () => {
    const event = createEvent('command_executed', 'test-id', 'cli', {
      command: 'guard',
      durationMs: 150,
    })
    expect(event.schemaVersion).toBe('1.1')
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(event.event).toBe('command_executed')
    expect(event.installationId).toBe('test-id')
    expect(event.source).toBe('cli')
    expect(event.kaddoVersion).toMatch(/^\d+\.\d+\.\d+/)
    expect(event.properties).toEqual({ command: 'guard', durationMs: 150 })
  })
})

describe('telemetry-buffer', () => {
  let dir: string
  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { cleanup(dir) })

  it('enqueues and reads events', () => {
    const event = createEvent('command_executed', 'id', 'cli', {
      command: 'scan',
      durationMs: 100,
      interface: 'cli',
    })
    enqueue(dir, [event])
    const buf = readBuffer(dir)
    expect(buf).toHaveLength(1)
    expect(buf[0].event).toBe('command_executed')
  })

  it('clears the buffer', () => {
    const event = createEvent('command_executed', 'id', 'cli', {
      command: 'scan',
      durationMs: 100,
      interface: 'cli',
    })
    enqueue(dir, [event])
    clearBuffer(dir)
    expect(bufferSize(dir)).toBe(0)
  })

  it('bounds the buffer at 100 events', () => {
    const events = Array.from({ length: 120 }, (_, i) =>
      createEvent('command_executed', 'id', 'cli', {
        command: 'scan',
        durationMs: i,
        interface: 'cli',
      }),
    )
    enqueue(dir, events)
    expect(bufferSize(dir)).toBe(100)
  })
})

describe('telemetry 1.1 privacy boundary', () => {
  it('rejects command arguments before they can enter the queue', () => {
    expect(() => createEvent('command_executed', 'id', 'cli', { command: 'scan --path private' }))
      .toThrow('catalogued')
  })

  it('keeps zero token usage instead of treating it as absent', () => {
    const event = createEvent('ai_interaction', 'id', 'agent', {
      provider: 'openai', model: 'gpt-5', totalTokens: 0, usageSource: 'provider',
    })
    expect(event.properties.totalTokens).toBe(0)
  })
})

describe('telemetry consent', () => {
  let dir: string
  beforeEach(() => { dir = makeTempDir() })
  afterEach(() => { cleanup(dir) })

  it('returns unset when no telemetry config exists', () => {
    expect(getConsentState(null)).toBe('unset')
    const config = loadConfig(dir)!
    expect(getConsentState(config)).toBe('unset')
  })

  it('returns enabled when consent is enabled', () => {
    persistConsent(dir, 'enabled')
    const config = loadConfig(dir)!
    expect(getConsentState(config)).toBe('enabled')
  })

  it('returns disabled when consent is disabled', () => {
    persistConsent(dir, 'disabled')
    const config = loadConfig(dir)!
    expect(getConsentState(config)).toBe('disabled')
  })

  it('migrates legacy enabled:true to enabled', () => {
    fs.writeFileSync(
      path.join(dir, '.kaddo', 'config.yml'),
      'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\ntelemetry:\n  enabled: true\n',
    )
    const config = loadConfig(dir)!
    expect(getConsentState(config)).toBe('enabled')
  })

  it('migrates legacy enabled:false to disabled', () => {
    fs.writeFileSync(
      path.join(dir, '.kaddo', 'config.yml'),
      'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\ntelemetry:\n  enabled: false\n',
    )
    const config = loadConfig(dir)!
    expect(getConsentState(config)).toBe('disabled')
  })

  it('persistConsent writes consent and consentVersion', () => {
    persistConsent(dir, 'enabled')
    const raw = fs.readFileSync(path.join(dir, '.kaddo', 'config.yml'), 'utf-8')
    expect(raw).toContain('consent: enabled')
    expect(raw).toContain('consentVersion: 1')
    expect(raw).not.toContain('enabled: true')
  })

  it('persistConsent removes legacy enabled field', () => {
    fs.writeFileSync(
      path.join(dir, '.kaddo', 'config.yml'),
      'version: 1\nproject:\n  name: test\n  state: new\n  structure: monorepo\n  language: en\nteam:\n  size: small\ntelemetry:\n  enabled: true\n',
    )
    persistConsent(dir, 'disabled')
    const raw = fs.readFileSync(path.join(dir, '.kaddo', 'config.yml'), 'utf-8')
    expect(raw).toContain('consent: disabled')
    expect(raw).not.toContain('enabled:')
  })

  it('re-enable after disable works', () => {
    persistConsent(dir, 'disabled')
    expect(getConsentState(loadConfig(dir)!)).toBe('disabled')
    persistConsent(dir, 'enabled')
    expect(getConsentState(loadConfig(dir)!)).toBe('enabled')
  })

  it('identity is preserved across disable/enable', () => {
    const identity1 = ensureIdentity(dir)
    persistConsent(dir, 'enabled')
    persistConsent(dir, 'disabled')
    persistConsent(dir, 'enabled')
    const identity2 = loadIdentity(dir)
    expect(identity2?.installationId).toBe(identity1.installationId)
  })

  it('isInteractive returns false when CI env is set', () => {
    const origCI = process.env.CI
    process.env.CI = 'true'
    try {
      expect(isInteractive()).toBe(false)
    } finally {
      if (origCI === undefined) delete process.env.CI
      else process.env.CI = origCI
    }
  })

  it('deferConsent creates a deferral that isDeferralActive detects', () => {
    expect(isDeferralActive(dir)).toBe(false)
    deferConsent(dir)
    expect(isDeferralActive(dir)).toBe(true)
  })

  it('isDeferralActive returns false for expired deferral', () => {
    const p = path.join(dir, '.kaddo', 'telemetry-deferred.json')
    fs.writeFileSync(p, JSON.stringify({ deferredUntil: Date.now() - 1000 }))
    expect(isDeferralActive(dir)).toBe(false)
  })

  it('isDeferralActive returns false for missing file', () => {
    expect(isDeferralActive(dir)).toBe(false)
  })

  it('isDeferralActive returns false for malformed file', () => {
    const p = path.join(dir, '.kaddo', 'telemetry-deferred.json')
    fs.writeFileSync(p, 'not json')
    expect(isDeferralActive(dir)).toBe(false)
  })

  it('consentNotice returns a non-empty string', () => {
    const notice = consentNotice()
    expect(notice).toContain('kaddo_set_telemetry_consent')
  })
})

describe('telemetry config (consent-aware)', () => {
  it('isEnabled returns false when consent is unset', () => {
    expect(isEnabled(null)).toBe(false)
    expect(isEnabled({ project: { name: 'x', state: 'new', structure: 'monorepo', language: 'en' }, team: { size: 'small' } })).toBe(false)
  })

  it('isEnabled returns true when consent is enabled', () => {
    const config = {
      project: { name: 'x', state: 'new' as const, structure: 'monorepo' as const, language: 'en' as const },
      team: { size: 'small' as const },
      telemetry: { consent: 'enabled' as const, consentVersion: 1 },
    }
    expect(isEnabled(config)).toBe(true)
  })

  it('isEnabled returns true for legacy enabled:true (back-compat)', () => {
    const config = {
      project: { name: 'x', state: 'new' as const, structure: 'monorepo' as const, language: 'en' as const },
      team: { size: 'small' as const },
      telemetry: { enabled: true },
    }
    expect(isEnabled(config)).toBe(true)
  })

  it('isEnabled returns false when consent is disabled', () => {
    const config = {
      project: { name: 'x', state: 'new' as const, structure: 'monorepo' as const, language: 'en' as const },
      team: { size: 'small' as const },
      telemetry: { consent: 'disabled' as const, consentVersion: 1 },
    }
    expect(isEnabled(config)).toBe(false)
  })

  it('getStatus shows consent state', () => {
    const dir = makeTempDir()
    try {
      const status = getStatus(dir)
      expect(status.consent).toBe('unset')
      expect(status.enabled).toBe(false)
      expect(status.registered).toBe(false)
      expect(status.pendingEvents).toBe(0)
    } finally {
      cleanup(dir)
    }
  })

  it('getStatus shows enabled after consent', () => {
    const dir = makeTempDir()
    try {
      persistConsent(dir, 'enabled')
      const status = getStatus(dir)
      expect(status.consent).toBe('enabled')
      expect(status.enabled).toBe(true)
    } finally {
      cleanup(dir)
    }
  })
})
