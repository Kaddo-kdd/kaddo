import type { KaddoPlugin, PluginSignal } from './types.js'

// Patterns that indicate destructive schema operations
const DESTRUCTIVE_SQL = [
  /DROP\s+COLUMN/i,
  /DROP\s+TABLE/i,
  /DROP\s+INDEX/i,
  /ALTER\s+COLUMN.*NOT\s+NULL/i,
  /ALTER\s+TYPE/i,
  /TRUNCATE/i,
  /DELETE\s+FROM/i,
  /RENAME\s+COLUMN/i,
  /RENAME\s+TABLE/i,
]

const DESTRUCTIVE_PRISMA = [
  // Field removal indicated by comment in migration SQL
  /--\s*AlterTable.*remove/i,
  // Type changes (changeColumnType)
  /ALTER\s+COLUMN.*TYPE/i,
  // Unique constraint removal
  /DROP\s+CONSTRAINT/i,
  // Required field added to existing table (dangerous backfill)
  /NOT NULL.*DEFAULT/i,
]

function isMigrationFile(file: string): boolean {
  return (
    file.includes('migrations/') &&
    (file.endsWith('.sql') || file.endsWith('.ts') || file.endsWith('.js'))
  ) || (
    file.includes('prisma/') && file.endsWith('.sql')
  )
}

export const prismaPlugin: KaddoPlugin = {
  name: 'prisma',
  description: 'Detects destructive database migration operations',

  detect(touchedFiles, readFile) {
    const signals: PluginSignal[] = []

    for (const file of touchedFiles) {
      if (!isMigrationFile(file)) continue

      const content = readFile(file)
      if (!content) continue

      const allPatterns = [...DESTRUCTIVE_SQL, ...DESTRUCTIVE_PRISMA]
      for (const pattern of allPatterns) {
        const match = content.match(pattern)
        if (match) {
          signals.push({
            plugin: 'prisma',
            file,
            message: `Destructive migration op detected: ${match[0].trim().slice(0, 60)}`,
            severity: 'critical',
          })
          break // one signal per file is enough
        }
      }
    }

    return signals
  },
}
