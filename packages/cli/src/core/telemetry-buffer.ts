import { exists, readFile, writeFile, ensureDir, join } from '../utils/fs.js'
import type { TelemetryEvent } from './telemetry-events.js'

const TELEMETRY_DIR = '.kaddo/telemetry'
const BUFFER_FILE = 'buffer.json'
const MAX_BUFFERED = 100

function bufferPath(dir: string): string {
  return join(dir, TELEMETRY_DIR, BUFFER_FILE)
}

export function readBuffer(dir: string): TelemetryEvent[] {
  const p = bufferPath(dir)
  if (!exists(p)) return []
  try {
    const data = JSON.parse(readFile(p))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function enqueue(dir: string, events: TelemetryEvent[]): void {
  const current = readBuffer(dir)
  const combined = [...current, ...events].slice(-MAX_BUFFERED)
  ensureDir(join(dir, TELEMETRY_DIR))
  writeFile(bufferPath(dir), JSON.stringify(combined, null, 2))
}

export function clearBuffer(dir: string): void {
  const p = bufferPath(dir)
  if (exists(p)) writeFile(p, '[]')
}

export function bufferSize(dir: string): number {
  return readBuffer(dir).length
}
