import crypto from 'node:crypto'
import { exists, readFile, writeFile, ensureDir, join } from '../utils/fs.js'

const TELEMETRY_DIR = '.kaddo/telemetry'
const IDENTITY_FILE = 'identity.json'

export type TelemetryIdentity = {
  installationId: string
  publicKey: string
  privateKey: string
  keyAlgorithm: 'Ed25519'
  registrationVersion: '1.0'
  registered: boolean
}

function identityPath(dir: string): string {
  return join(dir, TELEMETRY_DIR, IDENTITY_FILE)
}

export function loadIdentity(dir: string): TelemetryIdentity | null {
  const p = identityPath(dir)
  if (!exists(p)) return null
  try {
    return JSON.parse(readFile(p)) as TelemetryIdentity
  } catch {
    return null
  }
}

export function ensureIdentity(dir: string): TelemetryIdentity {
  const existing = loadIdentity(dir)
  if (existing) return existing

  const installationId = crypto.randomUUID()
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')

  const pubSpki = publicKey.export({ type: 'spki', format: 'der' })
  const privPkcs8 = privateKey.export({ type: 'pkcs8', format: 'der' })

  const identity: TelemetryIdentity = {
    installationId,
    publicKey: pubSpki.toString('base64url'),
    privateKey: privPkcs8.toString('base64url'),
    keyAlgorithm: 'Ed25519',
    registrationVersion: '1.0',
    registered: false,
  }

  ensureDir(join(dir, TELEMETRY_DIR))
  writeFile(identityPath(dir), JSON.stringify(identity, null, 2))
  return identity
}

export function markRegistered(dir: string, identity: TelemetryIdentity): void {
  identity.registered = true
  ensureDir(join(dir, TELEMETRY_DIR))
  writeFile(identityPath(dir), JSON.stringify(identity, null, 2))
}

export function signPayload(
  identity: TelemetryIdentity,
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  bodySha256: string,
): string {
  const canonical = `${method}\n${path}\n${identity.installationId}\n${timestamp}\n${nonce}\n${bodySha256}`
  const privKeyDer = Buffer.from(identity.privateKey, 'base64url')
  const privKey = crypto.createPrivateKey({ key: privKeyDer, format: 'der', type: 'pkcs8' })
  const sig = crypto.sign(null, Buffer.from(canonical), privKey)
  return sig.toString('base64url')
}
