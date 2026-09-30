import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { ensureIdentity, loadIdentity, signPayload } from '../src/core/telemetry-identity.js'
import { createEvent } from '../src/core/telemetry-events.js'
import { enqueue, readBuffer, clearBuffer, bufferSize } from '../src/core/telemetry-buffer.js'
import { isEnabled, getStatus } from '../src/core/telemetry.js'

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

describe('telemetry-events', () => {
  it('creates a well-formed event', () => {
    const event = createEvent('command_executed', 'test-id', 'cli', {
      command: 'guard',
      durationMs: 150,
      interface: 'cli',
    })
    expect(event.schemaVersion).toBe('1.0')
    expect(event.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(event.event).toBe('command_executed')
    expect(event.installationId).toBe('test-id')
    expect(event.source).toBe('cli')
    expect(event.properties).toEqual({ command: 'guard', durationMs: 150, interface: 'cli' })
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
        command: `cmd-${i}`,
        durationMs: i,
        interface: 'cli',
      }),
    )
    enqueue(dir, events)
    expect(bufferSize(dir)).toBe(100)
  })
})

describe('telemetry config', () => {
  it('returns false when telemetry is not configured', () => {
    expect(isEnabled(null)).toBe(false)
    expect(isEnabled({ project: { name: 'x', state: 'new', structure: 'monorepo', language: 'en' }, team: { size: 'small' } })).toBe(false)
  })

  it('returns true when telemetry.enabled is true', () => {
    const config = {
      project: { name: 'x', state: 'new' as const, structure: 'monorepo' as const, language: 'en' as const },
      team: { size: 'small' as const },
      telemetry: { enabled: true },
    }
    expect(isEnabled(config)).toBe(true)
  })

  it('returns status for a project', () => {
    const dir = makeTempDir()
    try {
      const status = getStatus(dir)
      expect(status.enabled).toBe(false)
      expect(status.registered).toBe(false)
      expect(status.pendingEvents).toBe(0)
    } finally {
      cleanup(dir)
    }
  })
})
