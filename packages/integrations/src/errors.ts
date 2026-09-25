// Normalized integration errors (VS-102).
//
// Provider SDK errors are never surfaced verbatim to Kaddo output. Adapters and the integration
// service map failures to these stable codes so CLI/Admin/MCP can react consistently and safely.

export type IntegrationErrorCode =
  | 'INTEGRATION_CONFIG_INVALID'
  | 'INTEGRATION_UNAUTHORIZED'
  | 'INTEGRATION_FORBIDDEN'
  | 'INTEGRATION_NOT_FOUND'
  | 'INTEGRATION_RATE_LIMITED'
  | 'INTEGRATION_UNAVAILABLE'
  | 'INTEGRATION_TIMEOUT'
  | 'INTEGRATION_INVALID_QUERY'
  | 'INTEGRATION_PROVIDER_ERROR'
  | 'UNSUPPORTED_CAPABILITY'

/** Codes that describe a transient condition — the same request may succeed later. */
const RETRYABLE = new Set<IntegrationErrorCode>([
  'INTEGRATION_RATE_LIMITED',
  'INTEGRATION_UNAVAILABLE',
  'INTEGRATION_TIMEOUT',
])

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode
  /** True for transient conditions (rate limit / unavailable / timeout). */
  readonly retryable: boolean
  /** A safe, provider-agnostic reason. Never the raw SDK message. */
  readonly safeMessage: string

  constructor(code: IntegrationErrorCode, message: string) {
    super(message)
    this.name = 'IntegrationError'
    this.code = code
    this.retryable = RETRYABLE.has(code)
    this.safeMessage = message
  }
}

/** Default human-safe messages per code — never include provider payloads or credentials. */
export function defaultMessageFor(code: IntegrationErrorCode): string {
  switch (code) {
    case 'INTEGRATION_CONFIG_INVALID': return 'The integration configuration is invalid.'
    case 'INTEGRATION_UNAUTHORIZED': return 'Authentication failed. Check the configured credentials.'
    case 'INTEGRATION_FORBIDDEN': return 'The configured credentials lack permission for this operation.'
    case 'INTEGRATION_NOT_FOUND': return 'The requested external resource was not found.'
    case 'INTEGRATION_RATE_LIMITED': return 'The external provider is rate limiting requests. Try again later.'
    case 'INTEGRATION_UNAVAILABLE': return 'The external provider is temporarily unavailable.'
    case 'INTEGRATION_TIMEOUT': return 'The external provider did not respond in time.'
    case 'INTEGRATION_INVALID_QUERY': return 'The query syntax is invalid. Check filter values or JQL.'
    case 'INTEGRATION_PROVIDER_ERROR': return 'The external provider returned an error.'
    case 'UNSUPPORTED_CAPABILITY': return 'This adapter does not support the requested capability.'
  }
}

export function integrationError(code: IntegrationErrorCode, message?: string): IntegrationError {
  return new IntegrationError(code, message ?? defaultMessageFor(code))
}

/**
 * Wrap an unknown thrown value as a safe IntegrationError. The raw error is discarded (never leaked);
 * only the stable code and a generic message are kept. Already-normalized errors pass through.
 */
export function normalizeProviderError(err: unknown, fallback: IntegrationErrorCode = 'INTEGRATION_PROVIDER_ERROR'): IntegrationError {
  if (err instanceof IntegrationError) return err
  return new IntegrationError(fallback, defaultMessageFor(fallback))
}
