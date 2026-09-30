import crypto from 'node:crypto'
import { loadConfig, type KaddoConfig } from './config.js'
import {
  ensureIdentity,
  loadIdentity,
  markRegistered,
  signPayload,
  type TelemetryIdentity,
} from './telemetry-identity.js'
import {
  createEvent,
  type KnownTelemetryEvent,
  type TelemetryInterface,
  type AllowlistedProperties,
  type TelemetryEvent,
} from './telemetry-events.js'
import { enqueue, readBuffer, clearBuffer, bufferSize } from './telemetry-buffer.js'

const TELEMETRY_ENDPOINT = 'https://telemetry.kaddo.org'
const EVENTS_PATH = '/v1/events'
const REGISTRATION_PATH = '/v1/installations'
const REQUEST_TIMEOUT_MS = 5_000
const MAX_BATCH_SIZE = 25

export type TelemetryStatus = {
  enabled: boolean
  registered: boolean
  pendingEvents: number
  lastError: string | null
}

export function isEnabled(config: KaddoConfig | null): boolean {
  if (!config) return false
  const t = config.telemetry as { enabled?: boolean } | undefined
  return t?.enabled === true
}

export function getStatus(dir: string): TelemetryStatus {
  const config = loadConfig(dir)
  const enabled = isEnabled(config)
  const identity = loadIdentity(dir)
  return {
    enabled,
    registered: identity?.registered ?? false,
    pendingEvents: enabled ? bufferSize(dir) : 0,
    lastError: null,
  }
}

async function httpPost(
  url: string,
  body: string,
  headers: Record<string, string>,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
      signal: controller.signal,
    })
    const text = await res.text()
    return { status: res.status, body: text }
  } finally {
    clearTimeout(timeout)
  }
}

async function registerInstallation(identity: TelemetryIdentity): Promise<boolean> {
  const payload = JSON.stringify({
    installationId: identity.installationId,
    publicKey: identity.publicKey,
    keyAlgorithm: identity.keyAlgorithm,
    registrationVersion: identity.registrationVersion,
  })
  try {
    const res = await httpPost(`${TELEMETRY_ENDPOINT}${REGISTRATION_PATH}`, payload, {})
    return res.status === 201 || res.status === 200
  } catch {
    return false
  }
}

function buildSignedHeaders(
  identity: TelemetryIdentity,
  bodyStr: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')
  const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
  const signature = signPayload(identity, 'POST', EVENTS_PATH, timestamp, nonce, bodyHash)

  return {
    'X-Kaddo-Installation-Id': identity.installationId,
    'X-Kaddo-Timestamp': timestamp,
    'X-Kaddo-Nonce': nonce,
    'X-Kaddo-Signature-Version': '1',
    'X-Kaddo-Signature': signature,
  }
}

async function deliverBatch(
  identity: TelemetryIdentity,
  events: TelemetryEvent[],
): Promise<boolean> {
  const bodyStr = JSON.stringify({ events })
  const headers = buildSignedHeaders(identity, bodyStr)
  try {
    const res = await httpPost(`${TELEMETRY_ENDPOINT}${EVENTS_PATH}`, bodyStr, headers)
    return res.status === 202
  } catch {
    return false
  }
}

export async function emit(
  dir: string,
  name: KnownTelemetryEvent,
  source: TelemetryInterface,
  properties: AllowlistedProperties,
): Promise<void> {
  try {
    const config = loadConfig(dir)
    if (!isEnabled(config)) return

    const identity = ensureIdentity(dir)

    if (!identity.registered) {
      const ok = await registerInstallation(identity)
      if (ok) markRegistered(dir, identity)
      else {
        const event = createEvent(name, identity.installationId, source, properties)
        enqueue(dir, [event])
        return
      }
    }

    const event = createEvent(name, identity.installationId, source, properties)
    const buffered = readBuffer(dir)
    const batch = [...buffered, event].slice(0, MAX_BATCH_SIZE)

    const ok = await deliverBatch(identity, batch)
    if (ok) {
      if (buffered.length > 0) clearBuffer(dir)
      const remaining = [...buffered, event].slice(MAX_BATCH_SIZE)
      if (remaining.length > 0) enqueue(dir, remaining)
      else if (buffered.length > 0) clearBuffer(dir)
    } else {
      enqueue(dir, [event])
    }
  } catch {
    // Best-effort: never fail the caller
  }
}

export async function flush(dir: string): Promise<number> {
  try {
    const config = loadConfig(dir)
    if (!isEnabled(config)) return 0

    const identity = loadIdentity(dir)
    if (!identity?.registered) return 0

    const buffered = readBuffer(dir)
    if (buffered.length === 0) return 0

    let delivered = 0
    for (let i = 0; i < buffered.length; i += MAX_BATCH_SIZE) {
      const batch = buffered.slice(i, i + MAX_BATCH_SIZE)
      const ok = await deliverBatch(identity, batch)
      if (ok) delivered += batch.length
      else break
    }

    if (delivered >= buffered.length) {
      clearBuffer(dir)
    } else if (delivered > 0) {
      const remaining = buffered.slice(delivered)
      clearBuffer(dir)
      enqueue(dir, remaining)
    }

    return delivered
  } catch {
    return 0
  }
}
