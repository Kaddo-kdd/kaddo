import type { KaddoPlugin, PluginSignal } from './types.js'

function isOpenApiFile(file: string): boolean {
  const lower = file.toLowerCase()
  return (
    lower.endsWith('openapi.yaml') ||
    lower.endsWith('openapi.yml') ||
    lower.endsWith('openapi.json') ||
    lower.endsWith('swagger.yaml') ||
    lower.endsWith('swagger.yml') ||
    lower.endsWith('swagger.json') ||
    lower.includes('openapi/') ||
    lower.includes('api-spec') ||
    lower.includes('api-contract')
  )
}

// Patterns that signal a potentially breaking contract change
const BREAKING_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /^\-\s+.*(\/[a-z0-9_{}/-]+).*:/m,
    message: 'Endpoint removed or renamed (line starts with -)',
  },
  {
    pattern: /required:.*\n.*-\s+\w+/m,
    message: 'Field added to required list',
  },
  {
    pattern: /^\-\s+type:/m,
    message: 'Schema type removed or changed',
  },
  {
    pattern: /^\-\s+\$ref:/m,
    message: 'Schema reference removed',
  },
]

// Check if file looks like a diff (has +/- lines) or is a full spec
function analyzeOpenApi(file: string, content: string): PluginSignal[] {
  const signals: PluginSignal[] = []
  const isDiff = content.includes('\n-') || content.startsWith('-')

  if (isDiff) {
    for (const { pattern, message } of BREAKING_PATTERNS) {
      if (pattern.test(content)) {
        signals.push({
          plugin: 'openapi',
          file,
          message,
          severity: 'warn',
        })
        break
      }
    }
  } else {
    // Full spec touched — flag as informational
    signals.push({
      plugin: 'openapi',
      file,
      message: 'API contract file modified — review for breaking changes',
      severity: 'info',
    })
  }

  return signals
}

export const openapiPlugin: KaddoPlugin = {
  name: 'openapi',
  description: 'Detects breaking changes in OpenAPI/Swagger contract files',

  detect(touchedFiles, readFile) {
    const signals: PluginSignal[] = []

    for (const file of touchedFiles) {
      if (!isOpenApiFile(file)) continue

      const content = readFile(file)
      if (!content) {
        // File touched but unreadable — still flag it
        signals.push({
          plugin: 'openapi',
          file,
          message: 'API contract file modified',
          severity: 'info',
        })
        continue
      }

      signals.push(...analyzeOpenApi(file, content))
    }

    return signals
  },
}
