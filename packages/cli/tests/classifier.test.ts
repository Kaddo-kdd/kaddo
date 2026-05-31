import { describe, it, expect } from 'vitest'
import { detectSignals, classify } from '../src/core/classifier.js'

describe('detectSignals — migration', () => {
  it('detects supabase migration', () => {
    const signals = detectSignals(['supabase/migrations/20260531_add_table.sql'])
    expect(signals).toHaveLength(1)
    expect(signals[0].name).toBe('DB migration')
    expect(signals[0].suggestedLevel).toBe('K4')
  })

  it('detects prisma migration', () => {
    const signals = detectSignals(['prisma/migrations/20260531_init/migration.sql'])
    expect(signals[0].name).toBe('DB migration')
  })

  it('detects db/migrations', () => {
    const signals = detectSignals(['db/migrations/001_create_users.sql'])
    expect(signals[0].name).toBe('DB migration')
  })
})

describe('detectSignals — contract', () => {
  it('detects openapi file', () => {
    const signals = detectSignals(['openapi.yaml'])
    expect(signals[0].name).toBe('API/event contract')
    expect(signals[0].suggestedLevel).toBe('K3')
  })

  it('detects events dir', () => {
    const signals = detectSignals(['events/payment-created.ts'])
    expect(signals[0].name).toBe('API/event contract')
  })
})

describe('detectSignals — infra', () => {
  it('detects terraform file', () => {
    const signals = detectSignals(['terraform/main.tf'])
    expect(signals[0].name).toBe('Infrastructure')
  })

  it('detects docker-compose', () => {
    const signals = detectSignals(['docker-compose.yml'])
    expect(signals[0].name).toBe('Infrastructure')
  })

  it('detects github workflow', () => {
    const signals = detectSignals(['.github/workflows/deploy.yml'])
    expect(signals[0].name).toBe('Infrastructure')
  })
})

describe('detectSignals — dependencies', () => {
  it('detects package.json', () => {
    const signals = detectSignals(['package.json'])
    expect(signals[0].name).toBe('Dependency')
    expect(signals[0].suggestedLevel).toBe('K2')
  })

  it('detects requirements.txt', () => {
    const signals = detectSignals(['requirements.txt'])
    expect(signals[0].name).toBe('Dependency')
  })
})

describe('detectSignals — no signals', () => {
  it('returns empty for regular source files', () => {
    const signals = detectSignals([
      'src/payments/payment.service.ts',
      'src/orders/order.model.ts',
      'README.md',
    ])
    expect(signals).toHaveLength(0)
  })
})

describe('classify — no drift', () => {
  it('no drift when no signals detected', () => {
    const result = classify('bugfix', 'K2', ['src/payments/payment.ts'])
    expect(result.hasDrift).toBe(false)
    expect(result.observedSignals).toHaveLength(0)
  })

  it('no drift when signals match declared level', () => {
    // feature/K2 with only dependency signal (K2) — no drift
    const result = classify('feature', 'K2', ['package.json'])
    expect(result.hasDrift).toBe(false)
  })
})

describe('classify — drift detected', () => {
  it('detects drift when bugfix has migration signal', () => {
    const result = classify('bugfix', 'K2', ['supabase/migrations/add_table.sql'])
    expect(result.hasDrift).toBe(true)
    expect(result.suggestedTypes).toContain('migration')
  })

  it('detects drift when hotfix has infra signal', () => {
    const result = classify('hotfix', 'K1', ['terraform/main.tf'])
    expect(result.hasDrift).toBe(true)
  })

  it('summary describes the drift clearly', () => {
    const result = classify('bugfix', 'K2', ['supabase/migrations/add_table.sql'])
    expect(result.summary).toContain('bugfix')
    expect(result.summary.toLowerCase()).toMatch(/migration|higher/)
  })

  it('no drift when declared type already matches signal level', () => {
    // migration/K4 with migration signal — consistent
    const result = classify('migration', 'K4', ['supabase/migrations/add_table.sql'])
    expect(result.hasDrift).toBe(false)
  })
})

describe('classify — multiple signals', () => {
  it('handles multiple signal types', () => {
    const result = classify('bugfix', 'K2', [
      'supabase/migrations/add_table.sql',
      'openapi.yaml',
      'package.json',
    ])
    expect(result.observedSignals.length).toBeGreaterThanOrEqual(3)
    expect(result.hasDrift).toBe(true)
  })
})
