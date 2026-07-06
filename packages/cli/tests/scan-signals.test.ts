import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { buildScanSignals, signalCount, hasWarnings, renderSignalsCompact, renderSignalsConsole } from '../src/core/scan-signals.js'

let tmpDir: string

function write(rel: string, content: string) {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

function mkdir(rel: string) {
  fs.mkdirSync(path.join(tmpDir, rel), { recursive: true })
}

function pkg(deps: Record<string, string> = {}, devDeps: Record<string, string> = {}) {
  write('package.json', JSON.stringify({ name: 'test', dependencies: deps, devDependencies: devDeps }))
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-signals-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('scan signals (VS-081)', () => {
  it('AC1: detects auth signal from Supabase dependency', () => {
    pkg({ '@supabase/supabase-js': '2.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.auth.length).toBeGreaterThan(0)
    expect(signals.auth[0].label).toContain('Supabase')
    expect(signals.auth[0].confidence).toBe('high')
  })

  it('AC1: detects auth signal from next-auth dependency', () => {
    pkg({ 'next-auth': '5.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.auth[0].label).toBe('NextAuth')
  })

  it('AC1: detects auth signal from auth-related paths', () => {
    pkg()
    mkdir('src/auth')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.auth.length).toBeGreaterThan(0)
    expect(signals.auth[0].confidence).toBe('medium')
  })

  it('AC2: detects payment signal from Mercado Pago dependency', () => {
    pkg({ mercadopago: '2.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.payments[0].label).toBe('Mercado Pago')
    expect(signals.payments[0].confidence).toBe('high')
  })

  it('AC2: detects payment signal from Stripe dependency', () => {
    pkg({ stripe: '14.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.payments[0].label).toBe('Stripe')
  })

  it('AC3: detects webhook signal from api webhook route', () => {
    mkdir('src/app/api/webhooks/mercadopago')
    write('src/app/api/webhooks/mercadopago/route.ts', 'export async function POST() {}')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.webhooks.length).toBeGreaterThan(0)
    expect(signals.webhooks[0].recommended_review).toBeDefined()
  })

  it('AC4: detects storage signal from S3 dependency', () => {
    pkg({ '@aws-sdk/client-s3': '3.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.storage[0].label).toContain('S3')
  })

  it('AC5: detects background job signal from cron/edge function paths', () => {
    mkdir('supabase/functions/process-expired')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.background_jobs.length).toBeGreaterThan(0)
    expect(signals.background_jobs[0].label).toContain('Edge Functions')
  })

  it('AC5: detects background job signal from BullMQ dependency', () => {
    pkg({ bullmq: '5.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.background_jobs[0].label).toBe('BullMQ')
  })

  it('AC6: detects email signal from Resend dependency', () => {
    pkg({ resend: '3.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.email[0].label).toBe('Resend')
  })

  it('AC6: detects email signal from SendGrid dependency', () => {
    pkg({ '@sendgrid/mail': '8.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.email[0].label).toBe('SendGrid')
  })

  it('AC7: detects database signal from Prisma dependency', () => {
    pkg({ '@prisma/client': '5.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.database[0].label).toBe('Prisma')
  })

  it('AC7: detects database signal from Supabase dependency', () => {
    pkg({ '@supabase/supabase-js': '2.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.database.some((s) => s.label.includes('Supabase'))).toBe(true)
  })

  it('AC8: detects migration signal from supabase/migrations', () => {
    mkdir('supabase/migrations')
    write('supabase/migrations/001_init.sql', 'CREATE TABLE foo (id int);')
    const signals = buildScanSignals(tmpDir, ['src'], ['supabase/migrations'], [], [])
    expect(signals.migrations.length).toBeGreaterThan(0)
    expect(signals.migrations[0].label).toContain('supabase/migrations')
  })

  it('AC9: detects API routes for Next.js app/api', () => {
    mkdir('src/app/api')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.api_routes[0].label).toContain('Next.js API')
  })

  it('AC10: detects no test directory warning', () => {
    pkg()
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.tests[0].label).toContain('No test directory')
    expect(signals.tests[0].recommended_review).toBeDefined()
  })

  it('AC10: detects test framework from dependency', () => {
    pkg({}, { vitest: '1.0.0' })
    mkdir('tests')
    const signals = buildScanSignals(tmpDir, ['src'], [], ['tests'], [])
    expect(signals.tests.some((s) => s.label === 'Vitest')).toBe(true)
    expect(signals.tests.some((s) => s.label.includes('Test directories'))).toBe(true)
  })

  it('AC11: detects security signal from helmet dependency', () => {
    pkg({ helmet: '7.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.security[0].label).toContain('Helmet')
  })

  it('AC11: detects RLS policies in migrations', () => {
    mkdir('supabase/migrations')
    write('supabase/migrations/001_rls.sql', 'ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
    const signals = buildScanSignals(tmpDir, ['supabase/migrations'], [], [], [])
    // Should detect via the filename containing 'rls'
    expect(signals.security.some((s) => s.label.includes('RLS'))).toBe(true)
  })

  it('AC12: detects infrastructure signal from amplify.yml', () => {
    const signals = buildScanSignals(tmpDir, ['src'], [], [], ['amplify.yml'])
    expect(signals.infrastructure[0].label).toContain('Amplify')
  })

  it('AC12: detects infrastructure signal from Dockerfile', () => {
    const signals = buildScanSignals(tmpDir, ['src'], [], [], ['Dockerfile'])
    expect(signals.infrastructure[0].label).toBe('Dockerfile')
  })

  it('AC13: detects external integrations from dependencies', () => {
    pkg({ '@sentry/nextjs': '8.0.0', ioredis: '5.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.external_integrations.some((s) => s.label === 'Sentry')).toBe(true)
    expect(signals.external_integrations.some((s) => s.label === 'Redis')).toBe(true)
  })

  it('AC14: detects environment variable names without values', () => {
    write('.env.example', 'SUPABASE_URL=\nMERCADO_PAGO_ACCESS_TOKEN=\nINTERNAL_CRON_SECRET=\n')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(signals.environment.length).toBeGreaterThan(0)
    const evidence = signals.environment[0].evidence
    expect(evidence).toContain('SUPABASE_URL')
    expect(evidence).toContain('MERCADO_PAGO_ACCESS_TOKEN')
    // Must not contain values
    expect(JSON.stringify(signals)).not.toContain('APP_USR')
  })

  it('AC15: scan.json includes signals (via scanner)', async () => {
    const { scan } = await import('../src/services/scanner.js')
    write('package.json', JSON.stringify({ name: 'test', dependencies: { stripe: '14.0.0' } }))
    mkdir('src')
    const result = scan(tmpDir)
    expect(result.signals).toBeDefined()
    expect(result.signals.payments.length).toBeGreaterThan(0)
  })

  it('AC23: does not expose secret values', () => {
    write('.env', 'MERCADO_PAGO_ACCESS_TOKEN=APP_USR-secret-value-123\nSUPABASE_URL=https://x.supabase.co\n')
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    const json = JSON.stringify(signals)
    expect(json).not.toContain('APP_USR')
    expect(json).not.toContain('secret-value')
    expect(json).not.toContain('https://x.supabase.co')
    // Only variable names
    if (signals.environment.length > 0) {
      expect(signals.environment[0].evidence).toContain('MERCADO_PAGO_ACCESS_TOKEN')
    }
  })

  it('AC24: scan remains deterministic', () => {
    pkg({ stripe: '14.0.0', '@supabase/supabase-js': '2.0.0' })
    mkdir('src/app/api/webhooks')
    write('src/app/api/webhooks/route.ts', '')
    const s1 = buildScanSignals(tmpDir, ['src'], [], [], [])
    const s2 = buildScanSignals(tmpDir, ['src'], [], [], [])
    expect(JSON.stringify(s1)).toEqual(JSON.stringify(s2))
  })

  it('returns empty signals for a bare directory', () => {
    const signals = buildScanSignals(tmpDir, [], [], [], [])
    expect(signalCount(signals)).toBe(1) // only "no test directory" warning
    expect(signals.tests[0].label).toContain('No test directory')
  })

  it('hasWarnings returns true when no tests detected', () => {
    const signals = buildScanSignals(tmpDir, [], [], [], [])
    expect(hasWarnings(signals)).toBe(true)
  })

  it('hasWarnings returns false when tests exist', () => {
    pkg({}, { vitest: '1.0.0' })
    mkdir('tests')
    const signals = buildScanSignals(tmpDir, ['src'], [], ['tests'], [])
    expect(hasWarnings(signals)).toBe(false)
  })

  it('renderSignalsCompact produces concise output', () => {
    pkg({ stripe: '14.0.0', resend: '3.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    const compact = renderSignalsCompact(signals)
    expect(compact).toContain('Payments: Stripe')
    expect(compact).toContain('Email: Resend')
  })

  it('renderSignalsConsole produces formatted lines', () => {
    pkg({ stripe: '14.0.0' })
    const signals = buildScanSignals(tmpDir, ['src'], [], [], [])
    const lines = renderSignalsConsole(signals)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.some((l) => l.includes('Payments'))).toBe(true)
  })
})
