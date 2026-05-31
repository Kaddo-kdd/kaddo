import path from 'path'

export type WorkItemType = 'feature' | 'bugfix' | 'hotfix' | 'spike' | 'migration' | 'architecture-change' | 'incident' | 'rfc'
export type KLevel = 'K0' | 'K1' | 'K2' | 'K3' | 'K4'

export type ObservedSignal = {
  name: string
  file: string
  implication: string
  suggestedLevel: KLevel
}

export type ClassifyResult = {
  declaredType: string
  declaredLevel: string
  observedSignals: ObservedSignal[]
  suggestedTypes: string[]
  hasDrift: boolean
  summary: string
}

const MIGRATION_PATTERNS = [
  /supabase\/migrations\//,
  /prisma\/migrations\//,
  /db\/migrations\//,
  /database\/migrations\//,
  /migrations\/\d/,
]

const CONTRACT_PATTERNS = [
  /openapi\.(json|ya?ml)$/,
  /swagger\.(json|ya?ml)$/,
  /schema\.graphql$/,
  /routes\/.*\.(ts|js)$/,
  /events\//,
  /schemas\//,
  /contracts\//,
]

const INFRA_PATTERNS = [
  /terraform\//,
  /\.tf$/,
  /docker-compose\.(ya?ml)$/,
  /serverless\.(ya?ml)$/,
  /k8s\//,
  /helm\//,
  /\.github\/workflows\//,
  /amplify\.yml$/,
]

const DEP_PATTERNS = [
  /^package\.json$/,
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^go\.sum$/,
  /^Cargo\.lock$/,
  /^pom\.xml$/,
]

function normalizePath(p: string): string {
  return p.split(path.sep).join('/')
}

function matchesAny(file: string, patterns: RegExp[]): boolean {
  const normalized = normalizePath(file)
  return patterns.some((p) => p.test(normalized))
}

export function detectSignals(touchedFiles: string[]): ObservedSignal[] {
  const signals: ObservedSignal[] = []

  for (const file of touchedFiles) {
    if (matchesAny(file, MIGRATION_PATTERNS)) {
      signals.push({
        name: 'DB migration',
        file,
        implication: 'Data schema change — typically K4 or Migration type',
        suggestedLevel: 'K4',
      })
    } else if (matchesAny(file, CONTRACT_PATTERNS)) {
      signals.push({
        name: 'API/event contract',
        file,
        implication: 'Contract change affects consumers — typically K3/K4',
        suggestedLevel: 'K3',
      })
    } else if (matchesAny(file, INFRA_PATTERNS)) {
      signals.push({
        name: 'Infrastructure',
        file,
        implication: 'Infrastructure change — typically K3/K4',
        suggestedLevel: 'K3',
      })
    } else if (matchesAny(file, DEP_PATTERNS)) {
      signals.push({
        name: 'Dependency',
        file,
        implication: 'Dependency change — may affect stability (K2–K4)',
        suggestedLevel: 'K2',
      })
    }
  }

  // Deduplicate by signal name + file
  const seen = new Set<string>()
  return signals.filter((s) => {
    const key = `${s.name}:${s.file}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function highestLevel(signals: ObservedSignal[]): KLevel {
  const order: KLevel[] = ['K0', 'K1', 'K2', 'K3', 'K4']
  let max = 0
  for (const s of signals) {
    const idx = order.indexOf(s.suggestedLevel)
    if (idx > max) max = idx
  }
  return order[max]
}

function suggestTypes(signals: ObservedSignal[], declaredType: string): string[] {
  const suggestions = new Set<string>()
  const names = signals.map((s) => s.name)

  if (names.includes('DB migration')) suggestions.add('migration')
  if (names.includes('API/event contract')) {
    suggestions.add('feature')
    suggestions.add('architecture-change')
  }
  if (names.includes('Infrastructure')) {
    suggestions.add('architecture-change')
    suggestions.add('migration')
  }
  if (names.includes('Dependency')) suggestions.add('feature')

  // Remove what was already declared
  suggestions.delete(declaredType)
  return [...suggestions]
}

const DECLARED_LEVEL: Record<string, KLevel> = {
  hotfix: 'K1',
  bugfix: 'K2',
  feature: 'K2',
  spike: 'K3',
  migration: 'K4',
  'architecture-change': 'K4',
  incident: 'K2',
  rfc: 'K3',
}

export function classify(
  declaredType: string,
  declaredLevel: string,
  touchedFiles: string[]
): ClassifyResult {
  const signals = detectSignals(touchedFiles)
  const observedLevel = highestLevel(signals)
  const expectedLevel = DECLARED_LEVEL[declaredType] ?? (declaredLevel as KLevel) ?? 'K2'

  const levelOrder: KLevel[] = ['K0', 'K1', 'K2', 'K3', 'K4']
  const observedIdx = levelOrder.indexOf(observedLevel)
  const expectedIdx = levelOrder.indexOf(expectedLevel)

  const hasDrift = signals.length > 0 && observedIdx > expectedIdx

  const suggestedTypes = hasDrift ? suggestTypes(signals, declaredType) : []

  let summary = ''
  if (signals.length === 0) {
    summary = `No signals detected. Declared classification (${declaredType} / ${expectedLevel}) looks consistent.`
  } else if (!hasDrift) {
    summary = `Observed signals are consistent with declared classification (${declaredType} / ${expectedLevel}).`
  } else {
    const typeList = suggestedTypes.length > 0 ? suggestedTypes.join(' or ') : 'a higher-level type'
    summary = `This may be more than a ${declaredType}. Signals suggest ${typeList} (${observedLevel}). Review before closing.`
  }

  return {
    declaredType,
    declaredLevel: expectedLevel,
    observedSignals: signals,
    suggestedTypes,
    hasDrift,
    summary,
  }
}
