import { afterEach, describe, expect, it } from 'vitest'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createWorkItem, completeWorkItem, getWorkItemForEdit, transitionWorkItem } from '../src/core/work-item-write.js'
import { persistConsent } from '../src/core/telemetry-consent.js'
import { enqueue, readBuffer } from '../src/core/telemetry-buffer.js'
import { drainTelemetry, emit, setTelemetryEndpointForTesting } from '../src/core/telemetry.js'
import { loadIdentity } from '../src/core/telemetry-identity.js'
import { setTelemetryEventObserver } from '../src/core/telemetry.js'
import type { TelemetryEvent } from '../src/core/telemetry-events.js'

const harnessRoot = process.env.KADDO_TELEMETRY_HARNESS_PATH
const dirs: string[] = []

type Harness = {
  origin: string
  client: { send(command: unknown): Promise<{ Items?: Record<string, unknown>[] }> }
  tables: { events: string }
  close(): Promise<void>
}

function project(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-telemetry-http-'))
  dirs.push(dir)
  fs.mkdirSync(path.join(dir, '.kaddo'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.kaddo', 'config.yml'), 'project:\n  name: telemetry-e2e\n  state: new\n  structure: monorepo\n  language: en\n')
  persistConsent(dir, 'enabled')
  return dir
}

afterEach(() => {
  setTelemetryEventObserver()
  setTelemetryEndpointForTesting()
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

it('limits the integration endpoint seam to unauthenticated loopback HTTP', () => {
  expect(() => setTelemetryEndpointForTesting('https://telemetry.kaddo.org')).toThrow(/loopback/)
  expect(() => setTelemetryEndpointForTesting('http://user:pass@127.0.0.1:8000')).toThrow(/loopback/)
  expect(() => setTelemetryEndpointForTesting('http://127.0.0.1:8000/path')).toThrow(/loopback/)
  expect(() => setTelemetryEndpointForTesting('http://127.0.0.1:8000')).not.toThrow()
})

describe('WI-084 telemetry against the isolated collector harness', () => {
  const run = harnessRoot ? it : it.skip

  run('delivers real lifecycle and queued compatibility events over signed HTTP', async () => {
    const telemetry = await import(pathToFileURL(path.join(harnessRoot!, 'tests/local-http-harness.ts')).href) as {
      startLocalHttpHarness(): Promise<Harness>
    }
    const { ScanCommand } = createRequire(path.join(harnessRoot!, 'package.json'))('@aws-sdk/lib-dynamodb') as {
      ScanCommand: new (input: { TableName: string; ConsistentRead: boolean }) => unknown
    }
    const harness = await telemetry.startLocalHttpHarness()
    const dir = project()
    const observed: TelemetryEvent[] = []
    setTelemetryEventObserver(event => observed.push(event))
    setTelemetryEndpointForTesting(harness.origin)
    try {
      const created = createWorkItem(dir, { intent: 'HTTP harness lifecycle', type: 'feature' })
      await drainTelemetry(dir)

      let edit = getWorkItemForEdit(dir, created.id)
      const ready = transitionWorkItem(dir, created.id, 'ready', edit.revision)
      transitionWorkItem(dir, created.id, 'in-progress', ready.revision)
      completeWorkItem(dir, created.id, 'Completed through the isolated HTTP collector')
      await drainTelemetry(dir)

      const identity = loadIdentity(dir)
      expect(identity?.registered).toBe(true)
      const legacy: TelemetryEvent = {
        schemaVersion: '1.0', id: crypto.randomUUID(), timestamp: new Date().toISOString(),
        event: 'work_item_created', installationId: identity!.installationId, source: 'cli', properties: {},
      }
      enqueue(dir, [legacy])
      expect(await drainTelemetry(dir)).toBe(1)

      const createdEvent = observed.find(event => event.event === 'work_item_created')
      expect(createdEvent).toBeDefined()
      enqueue(dir, [createdEvent!])
      await drainTelemetry(dir)

      const stored = (await harness.client.send(new ScanCommand({ TableName: harness.tables.events, ConsistentRead: true }))).Items ?? []
      const lifecycle = stored.filter(item => item.event === 'work_item_created' || item.event === 'work_item_completed')
      expect(lifecycle).toHaveLength(2)
      for (const event of lifecycle) {
        expect(event.schemaVersion).toBe('1.1')
        expect(event.projectId).toMatch(/^[0-9a-f-]{36}$/i)
        expect(event.kaddoVersion).toMatch(/^\d+\.\d+\.\d+/)
        expect(event.properties).toMatchObject({ workItemType: 'feature', knowledgeLevel: 'K2' })
        expect((event.properties as Record<string, unknown>).workItemIdAnon).toMatch(/^[0-9a-f-]{36}$/i)
      }
      expect((lifecycle[0].properties as Record<string, unknown>).workItemIdAnon).toBe((lifecycle[1].properties as Record<string, unknown>).workItemIdAnon)
      expect(stored.some(item => item.id === legacy.id && item.schemaVersion === '1.0')).toBe(true)
      expect(stored.filter(item => item.id === createdEvent!.id)).toHaveLength(1)
      expect(readBuffer(dir)).toEqual([])

      setTelemetryEndpointForTesting('http://127.0.0.1:1')
      await expect(emit(dir, 'command_executed', 'cli', { command: 'guard' })).resolves.toBeUndefined()
      expect(readBuffer(dir)).toHaveLength(1)
      setTelemetryEndpointForTesting(harness.origin)
      expect(await drainTelemetry(dir)).toBe(1)
      expect(readBuffer(dir)).toEqual([])
      const recovered = (await harness.client.send(new ScanCommand({ TableName: harness.tables.events, ConsistentRead: true }))).Items ?? []
      expect(recovered.some(event => event.event === 'command_executed' && (event.properties as Record<string, unknown>).command === 'guard')).toBe(true)
      persistConsent(dir, 'disabled')
      const pending = readBuffer(dir).length
      await emit(dir, 'command_executed', 'cli', { command: 'guard' })
      expect(readBuffer(dir)).toHaveLength(pending)
    } finally {
      await harness.close()
    }
  })
})
