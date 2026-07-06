// Scan Signal Enrichment (VS-081).
//
// Detects actionable signals from project files: auth, payments, webhooks, storage,
// background jobs, email, database, migrations, API routes, tests, security,
// infrastructure, external integrations, and environment variables.
//
// Deterministic, no LLM, no git. Never exposes secret values.

import { exists, readFile, readDir, isDir, isFile, join } from '../utils/fs.js'

export type SignalConfidence = 'high' | 'medium' | 'low'

export type SignalCategory =
  | 'auth'
  | 'payments'
  | 'webhooks'
  | 'storage'
  | 'background_jobs'
  | 'email'
  | 'database'
  | 'migrations'
  | 'api_routes'
  | 'tests'
  | 'security'
  | 'infrastructure'
  | 'external_integrations'
  | 'environment'

export type ScanSignal = {
  type: SignalCategory
  label: string
  confidence: SignalConfidence
  evidence: string[]
  reason?: string
  recommended_review?: string
}

export type ScanSignals = Record<SignalCategory, ScanSignal[]>

function emptySignals(): ScanSignals {
  return {
    auth: [],
    payments: [],
    webhooks: [],
    storage: [],
    background_jobs: [],
    email: [],
    database: [],
    migrations: [],
    api_routes: [],
    tests: [],
    security: [],
    infrastructure: [],
    external_integrations: [],
    environment: [],
  }
}

function sig(type: SignalCategory, label: string, confidence: SignalConfidence, evidence: string[], extra?: { reason?: string; recommended_review?: string }): ScanSignal {
  return { type, label, confidence, evidence, ...extra }
}

type Deps = Record<string, string>

function readDeps(dir: string): Deps {
  const pkgPath = join(dir, 'package.json')
  if (!exists(pkgPath)) return {}
  try {
    const pkg = JSON.parse(readFile(pkgPath))
    return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
  } catch {
    return {}
  }
}

function findFilesMatching(dir: string, codeDirs: string[], pattern: RegExp, maxDepth = 3): string[] {
  const found: string[] = []
  const walk = (base: string, rel: string, depth: number) => {
    if (depth > maxDepth) return
    try {
      const entries = readDir(join(base, rel))
      for (const e of entries) {
        if (e.startsWith('.') || e === 'node_modules' || e === 'dist' || e === 'build' || e === '.next') continue
        const fullRel = rel ? `${rel}/${e}` : e
        if (isDir(join(base, fullRel))) {
          walk(base, fullRel, depth + 1)
        } else if (pattern.test(e)) {
          found.push(fullRel)
        }
      }
    } catch { /* unreadable */ }
  }
  for (const cd of codeDirs) {
    walk(dir, cd, 0)
  }
  return found
}

function findPathsContaining(dir: string, codeDirs: string[], keywords: string[], maxDepth = 3): string[] {
  const found: string[] = []
  const walk = (base: string, rel: string, depth: number) => {
    if (depth > maxDepth) return
    try {
      const entries = readDir(join(base, rel))
      for (const e of entries) {
        if (e.startsWith('.') || e === 'node_modules' || e === 'dist' || e === 'build' || e === '.next') continue
        const fullRel = rel ? `${rel}/${e}` : e
        const lower = e.toLowerCase()
        if (keywords.some((k) => lower.includes(k))) {
          found.push(fullRel)
        }
        if (isDir(join(base, fullRel))) {
          walk(base, fullRel, depth + 1)
        }
      }
    } catch { /* unreadable */ }
  }
  for (const cd of codeDirs) {
    walk(dir, cd, 0)
  }
  return found
}

function detectAuth(dir: string, deps: Deps, codeDirs: string[], signals: ScanSignals): void {
  const authDeps: [string, string][] = [
    ['next-auth', 'NextAuth'],
    ['@auth/core', 'Auth.js'],
    ['@supabase/supabase-js', 'Supabase Auth'],
    ['@supabase/auth-helpers-nextjs', 'Supabase Auth'],
    ['@supabase/ssr', 'Supabase Auth'],
    ['@clerk/nextjs', 'Clerk'],
    ['@clerk/clerk-sdk-node', 'Clerk'],
    ['firebase', 'Firebase Auth'],
    ['firebase-admin', 'Firebase Auth'],
    ['passport', 'Passport.js'],
    ['jsonwebtoken', 'JWT'],
    ['jose', 'JWT (jose)'],
    ['bcrypt', 'Password hashing (bcrypt)'],
    ['bcryptjs', 'Password hashing (bcryptjs)'],
    ['@aws-amplify/auth', 'AWS Amplify Auth'],
  ]
  const seen = new Set<string>()
  for (const [dep, label] of authDeps) {
    if (dep in deps && !seen.has(label)) {
      seen.add(label)
      signals.auth.push(sig('auth', label, 'high', ['package.json']))
    }
  }

  const authPaths = findPathsContaining(dir, codeDirs, ['auth', 'login', 'register', 'signin', 'signup', 'session'], 3)
  if (authPaths.length > 0 && signals.auth.length === 0) {
    signals.auth.push(sig('auth', 'Auth-related paths detected', 'medium', authPaths.slice(0, 5)))
  }
}

function detectPayments(dir: string, deps: Deps, codeDirs: string[], signals: ScanSignals): void {
  const payDeps: [string, string][] = [
    ['stripe', 'Stripe'],
    ['@stripe/stripe-js', 'Stripe'],
    ['mercadopago', 'Mercado Pago'],
    ['@paypal/checkout-server-sdk', 'PayPal'],
    ['paypal-rest-sdk', 'PayPal'],
    ['wompi', 'Wompi'],
    ['@adyen/api-library', 'Adyen'],
    ['braintree', 'Braintree'],
    ['square', 'Square'],
  ]
  const seen = new Set<string>()
  for (const [dep, label] of payDeps) {
    if (dep in deps && !seen.has(label)) {
      seen.add(label)
      signals.payments.push(sig('payments', label, 'high', ['package.json']))
    }
  }

  const payPaths = findPathsContaining(dir, codeDirs, ['payment', 'checkout', 'billing', 'invoice', 'subscription', 'pricing'], 3)
  if (payPaths.length > 0 && signals.payments.length === 0) {
    signals.payments.push(sig('payments', 'Payment-related paths detected', 'medium', payPaths.slice(0, 5)))
  }
}

function detectWebhooks(dir: string, codeDirs: string[], signals: ScanSignals): void {
  const whPaths = findPathsContaining(dir, codeDirs, ['webhook', 'callback'], 3)
  if (whPaths.length > 0) {
    signals.webhooks.push(sig('webhooks', 'Webhook routes detected', 'high', whPaths.slice(0, 5), {
      recommended_review: 'Verify idempotency and signature validation.',
    }))
  }
}

function detectStorage(dir: string, deps: Deps, codeDirs: string[], signals: ScanSignals): void {
  const storageDeps: [string, string][] = [
    ['@aws-sdk/client-s3', 'AWS S3'],
    ['aws-sdk', 'AWS SDK (includes S3)'],
    ['@supabase/storage-js', 'Supabase Storage'],
    ['cloudinary', 'Cloudinary'],
    ['multer', 'File upload (Multer)'],
    ['formidable', 'File upload (Formidable)'],
    ['@google-cloud/storage', 'Google Cloud Storage'],
    ['@azure/storage-blob', 'Azure Blob Storage'],
  ]
  const seen = new Set<string>()
  for (const [dep, label] of storageDeps) {
    if (dep in deps && !seen.has(label)) {
      seen.add(label)
      signals.storage.push(sig('storage', label, 'high', ['package.json']))
    }
  }

  const storagePaths = findPathsContaining(dir, codeDirs, ['upload', 'storage', 'bucket'], 3)
  if (storagePaths.length > 0 && signals.storage.length === 0) {
    signals.storage.push(sig('storage', 'Storage-related paths detected', 'medium', storagePaths.slice(0, 5)))
  }
}

function detectBackgroundJobs(dir: string, deps: Deps, codeDirs: string[], signals: ScanSignals): void {
  const jobDeps: [string, string][] = [
    ['bullmq', 'BullMQ'],
    ['bull', 'Bull'],
    ['agenda', 'Agenda'],
    ['@aws-sdk/client-sqs', 'AWS SQS'],
    ['amqplib', 'RabbitMQ (AMQP)'],
    ['bee-queue', 'Bee-Queue'],
    ['node-cron', 'Node-cron'],
    ['cron', 'Cron'],
  ]
  for (const [dep, label] of jobDeps) {
    if (dep in deps) {
      signals.background_jobs.push(sig('background_jobs', label, 'high', ['package.json']))
    }
  }

  if (isDir(join(dir, 'supabase', 'functions'))) {
    signals.background_jobs.push(sig('background_jobs', 'Supabase Edge Functions', 'high', ['supabase/functions/']))
  }

  const cronMigrations = findFilesMatching(dir, ['supabase/migrations'], /pg_cron|cron/i, 2)
  if (cronMigrations.length > 0) {
    signals.background_jobs.push(sig('background_jobs', 'pg_cron scheduled jobs', 'high', cronMigrations.slice(0, 3)))
  }

  if (exists(join(dir, 'vercel.json'))) {
    try {
      const vc = JSON.parse(readFile(join(dir, 'vercel.json')))
      if (vc.crons && Array.isArray(vc.crons) && vc.crons.length > 0) {
        signals.background_jobs.push(sig('background_jobs', 'Vercel Cron Jobs', 'high', ['vercel.json']))
      }
    } catch { /* skip */ }
  }

  const jobPaths = findPathsContaining(dir, codeDirs, ['cron', 'queue', 'worker', 'job'], 3)
  if (jobPaths.length > 0 && signals.background_jobs.length === 0) {
    signals.background_jobs.push(sig('background_jobs', 'Job-related paths detected', 'medium', jobPaths.slice(0, 5)))
  }
}

function detectEmail(dir: string, deps: Deps, signals: ScanSignals): void {
  const emailDeps: [string, string][] = [
    ['resend', 'Resend'],
    ['@sendgrid/mail', 'SendGrid'],
    ['@sendinblue/client', 'Brevo (Sendinblue)'],
    ['@getbrevo/brevo', 'Brevo'],
    ['nodemailer', 'Nodemailer'],
    ['@aws-sdk/client-ses', 'AWS SES'],
    ['postmark', 'Postmark'],
    ['mailgun-js', 'Mailgun'],
    ['@mailchimp/mailchimp_transactional', 'Mailchimp Transactional'],
  ]
  for (const [dep, label] of emailDeps) {
    if (dep in deps) {
      signals.email.push(sig('email', label, 'high', ['package.json']))
    }
  }
}

function detectDatabase(dir: string, deps: Deps, signals: ScanSignals): void {
  const dbDeps: [string, string][] = [
    ['prisma', 'Prisma'],
    ['@prisma/client', 'Prisma'],
    ['drizzle-orm', 'Drizzle ORM'],
    ['typeorm', 'TypeORM'],
    ['sequelize', 'Sequelize'],
    ['knex', 'Knex.js'],
    ['@supabase/supabase-js', 'Supabase (Postgres)'],
    ['pg', 'PostgreSQL (pg)'],
    ['mysql2', 'MySQL'],
    ['mongodb', 'MongoDB'],
    ['mongoose', 'Mongoose (MongoDB)'],
    ['better-sqlite3', 'SQLite'],
    ['@neondatabase/serverless', 'Neon Postgres'],
    ['@planetscale/database', 'PlanetScale'],
    ['@libsql/client', 'Turso (LibSQL)'],
  ]
  const seen = new Set<string>()
  for (const [dep, label] of dbDeps) {
    if (dep in deps && !seen.has(label)) {
      seen.add(label)
      signals.database.push(sig('database', label, 'high', ['package.json']))
    }
  }
}

function detectMigrations(dir: string, migrationDirs: string[], signals: ScanSignals): void {
  for (const md of migrationDirs) {
    const fullPath = join(dir, md)
    if (!isDir(fullPath)) continue
    let count = 0
    try {
      count = readDir(fullPath).filter((f) => !f.startsWith('.')).length
    } catch { /* skip */ }
    signals.migrations.push(sig('migrations', `${md} (${count} file${count === 1 ? '' : 's'})`, 'high', [md]))
  }
}

function detectApiRoutes(dir: string, codeDirs: string[], signals: ScanSignals): void {
  // Next.js app/api
  for (const cd of codeDirs) {
    const apiDir = join(dir, cd, 'app', 'api')
    if (isDir(apiDir)) {
      signals.api_routes.push(sig('api_routes', 'Next.js API routes', 'high', [`${cd}/app/api`]))
    }
    // Next.js pages/api
    const pagesApi = join(dir, cd, 'pages', 'api')
    if (isDir(pagesApi)) {
      signals.api_routes.push(sig('api_routes', 'Next.js Pages API routes', 'high', [`${cd}/pages/api`]))
    }
  }
  // Top-level app/api or pages/api
  if (isDir(join(dir, 'app', 'api'))) {
    signals.api_routes.push(sig('api_routes', 'Next.js API routes', 'high', ['app/api']))
  }
  if (isDir(join(dir, 'pages', 'api'))) {
    signals.api_routes.push(sig('api_routes', 'Next.js Pages API routes', 'high', ['pages/api']))
  }

  // Express/Fastify routes dir
  if (isDir(join(dir, 'routes'))) {
    signals.api_routes.push(sig('api_routes', 'Routes directory', 'medium', ['routes/']))
  }
}

function detectTests(dir: string, testDirs: string[], deps: Deps, signals: ScanSignals): void {
  const testFrameworks: [string, string][] = [
    ['vitest', 'Vitest'],
    ['jest', 'Jest'],
    ['@playwright/test', 'Playwright'],
    ['cypress', 'Cypress'],
    ['@testing-library/react', 'Testing Library'],
    ['mocha', 'Mocha'],
    ['ava', 'AVA'],
  ]
  for (const [dep, label] of testFrameworks) {
    if (dep in deps) {
      signals.tests.push(sig('tests', label, 'high', ['package.json']))
    }
  }

  if (testDirs.length > 0) {
    signals.tests.push(sig('tests', `Test directories: ${testDirs.join(', ')}`, 'high', testDirs))
  }

  if (testDirs.length === 0 && signals.tests.length === 0) {
    signals.tests.push(sig('tests', 'No test directory detected', 'high', [], {
      recommended_review: 'Confirm how this project is validated before production changes.',
    }))
  }
}

function detectSecurity(dir: string, deps: Deps, codeDirs: string[], envVarNames: string[], signals: ScanSignals): void {
  const secDeps: [string, string][] = [
    ['helmet', 'Helmet (security headers)'],
    ['cors', 'CORS middleware'],
    ['csurf', 'CSRF protection'],
    ['express-rate-limit', 'Rate limiting'],
    ['@upstash/ratelimit', 'Upstash Rate Limiting'],
  ]
  for (const [dep, label] of secDeps) {
    if (dep in deps) {
      signals.security.push(sig('security', label, 'high', ['package.json']))
    }
  }

  // Detect middleware files
  const middlewarePaths = findPathsContaining(dir, codeDirs, ['middleware'], 2)
  if (middlewarePaths.length > 0) {
    signals.security.push(sig('security', 'Middleware detected', 'medium', middlewarePaths.slice(0, 5)))
  }
  // Top-level middleware (Next.js)
  if (isFile(join(dir, 'middleware.ts')) || isFile(join(dir, 'middleware.js')) || isFile(join(dir, 'src', 'middleware.ts')) || isFile(join(dir, 'src', 'middleware.js'))) {
    const evidence = ['middleware.ts', 'middleware.js', 'src/middleware.ts', 'src/middleware.js'].filter((f) => isFile(join(dir, f)))
    if (evidence.length > 0) {
      signals.security.push(sig('security', 'Next.js middleware', 'high', evidence))
    }
  }

  // RLS / policies in migrations
  const rlsMigrations = findFilesMatching(dir, ['supabase/migrations'], /rls|policies|policy/i, 2)
  if (rlsMigrations.length > 0) {
    signals.security.push(sig('security', 'RLS / row-level security policies', 'high', rlsMigrations.slice(0, 3)))
  }

  // Internal secrets in env var names
  const secretVars = envVarNames.filter((v) => /secret|token|key|password|credential/i.test(v))
  if (secretVars.length > 0) {
    signals.security.push(sig('security', 'Secret-bearing environment variables', 'medium', secretVars.slice(0, 10), {
      recommended_review: 'Confirm secret rotation and endpoint protection strategy.',
    }))
  }
}

function detectInfrastructure(dir: string, infraFiles: string[], signals: ScanSignals): void {
  for (const f of infraFiles) {
    const label = inferInfraLabel(f)
    signals.infrastructure.push(sig('infrastructure', label, 'high', [f]))
  }
}

function inferInfraLabel(f: string): string {
  const lower = f.toLowerCase()
  if (lower.includes('docker-compose')) return 'Docker Compose'
  if (lower === 'dockerfile') return 'Dockerfile'
  if (lower.includes('serverless')) return 'Serverless Framework'
  if (lower.includes('amplify')) return 'AWS Amplify'
  if (lower.includes('terraform')) return 'Terraform'
  if (lower.includes('k8s') || lower.includes('kubernetes')) return 'Kubernetes'
  if (lower.includes('helm')) return 'Helm'
  if (lower.includes('.github/workflows')) return 'GitHub Actions'
  if (lower.includes('vercel')) return 'Vercel'
  if (lower.includes('netlify')) return 'Netlify'
  return f
}

function detectExternalIntegrations(deps: Deps, signals: ScanSignals): void {
  const integrations: [string, string][] = [
    ['@supabase/supabase-js', 'Supabase'],
    ['@aws-sdk/client-s3', 'AWS'],
    ['aws-sdk', 'AWS'],
    ['@google-cloud/storage', 'Google Cloud'],
    ['@azure/storage-blob', 'Azure'],
    ['twilio', 'Twilio'],
    ['@slack/web-api', 'Slack'],
    ['@slack/bolt', 'Slack'],
    ['@notionhq/client', 'Notion'],
    ['@octokit/rest', 'GitHub API'],
    ['@sentry/node', 'Sentry'],
    ['@sentry/nextjs', 'Sentry'],
    ['@datadog/datadog-api-client', 'Datadog'],
    ['newrelic', 'New Relic'],
    ['@segment/analytics-node', 'Segment'],
    ['posthog-node', 'PostHog'],
    ['mixpanel', 'Mixpanel'],
    ['@amplitude/node', 'Amplitude'],
    ['firebase-admin', 'Firebase'],
    ['@google/generative-ai', 'Google AI'],
    ['openai', 'OpenAI'],
    ['@anthropic-ai/sdk', 'Anthropic'],
    ['@vercel/analytics', 'Vercel Analytics'],
    ['@vercel/kv', 'Vercel KV'],
    ['@upstash/redis', 'Upstash Redis'],
    ['ioredis', 'Redis'],
  ]
  const seen = new Set<string>()
  for (const [dep, label] of integrations) {
    if (dep in deps && !seen.has(label)) {
      seen.add(label)
      signals.external_integrations.push(sig('external_integrations', label, 'high', ['package.json']))
    }
  }
}

function detectEnvironment(dir: string): string[] {
  const envFiles = ['.env.example', '.env.local.example', '.env.template', '.env.sample']
  const varNames = new Set<string>()

  for (const ef of envFiles) {
    const p = join(dir, ef)
    if (!exists(p)) continue
    try {
      const lines = readFile(p).split(/\r?\n/)
      for (const line of lines) {
        const m = line.match(/^([A-Z][A-Z0-9_]+)\s*=/)
        if (m) varNames.add(m[1])
      }
    } catch { /* skip */ }
  }

  // Also check .env if it's gitignored (but we still read var names, not values)
  const envPath = join(dir, '.env')
  if (exists(envPath)) {
    try {
      const lines = readFile(envPath).split(/\r?\n/)
      for (const line of lines) {
        const m = line.match(/^([A-Z][A-Z0-9_]+)\s*=/)
        if (m) varNames.add(m[1])
      }
    } catch { /* skip */ }
  }

  return [...varNames].sort()
}

export function buildScanSignals(dir: string, codeDirs: string[], migrationDirs: string[], testDirs: string[], infraFiles: string[]): ScanSignals {
  const signals = emptySignals()
  const deps = readDeps(dir)
  const envVarNames = detectEnvironment(dir)

  detectAuth(dir, deps, codeDirs, signals)
  detectPayments(dir, deps, codeDirs, signals)
  detectWebhooks(dir, codeDirs, signals)
  detectStorage(dir, deps, codeDirs, signals)
  detectBackgroundJobs(dir, deps, codeDirs, signals)
  detectEmail(dir, deps, signals)
  detectDatabase(dir, deps, signals)
  detectMigrations(dir, migrationDirs, signals)
  detectApiRoutes(dir, codeDirs, signals)
  detectTests(dir, testDirs, deps, signals)
  detectSecurity(dir, deps, codeDirs, envVarNames, signals)
  detectInfrastructure(dir, infraFiles, signals)
  detectExternalIntegrations(deps, signals)

  if (envVarNames.length > 0) {
    signals.environment.push(sig('environment', `${envVarNames.length} environment variable(s) detected`, 'high', envVarNames.slice(0, 20)))
  }

  return signals
}

export function signalCount(signals: ScanSignals): number {
  return Object.values(signals).reduce((sum, arr) => sum + arr.length, 0)
}

export function hasWarnings(signals: ScanSignals): boolean {
  return signals.tests.some((s) => s.label.includes('No test directory'))
}

export function renderSignalsCompact(signals: ScanSignals): string {
  const lines: string[] = []
  const CATEGORIES: [SignalCategory, string][] = [
    ['auth', 'Auth'],
    ['payments', 'Payments'],
    ['webhooks', 'Webhooks'],
    ['storage', 'Storage'],
    ['background_jobs', 'Background jobs'],
    ['email', 'Email'],
    ['database', 'Database'],
    ['migrations', 'Migrations'],
    ['api_routes', 'API routes'],
    ['tests', 'Tests'],
    ['security', 'Security'],
    ['infrastructure', 'Infrastructure'],
    ['external_integrations', 'External integrations'],
    ['environment', 'Environment'],
  ]
  for (const [key, label] of CATEGORIES) {
    const arr = signals[key]
    if (arr.length === 0) continue
    if (arr.length === 1) {
      lines.push(`- ${label}: ${arr[0].label}`)
    } else {
      lines.push(`- ${label}: ${arr.length}`)
    }
  }
  return lines.length > 0 ? lines.join('\n') + '\n' : 'No signals detected.\n'
}

export function renderSignalsInventory(signals: ScanSignals): string {
  const parts: string[] = []
  const CATEGORIES: [SignalCategory, string][] = [
    ['auth', 'Auth'],
    ['payments', 'Payments'],
    ['webhooks', 'Webhooks'],
    ['storage', 'Storage'],
    ['background_jobs', 'Background Jobs'],
    ['email', 'Email / Notifications'],
    ['database', 'Database'],
    ['migrations', 'Migrations'],
    ['api_routes', 'API Routes'],
    ['tests', 'Tests'],
    ['security', 'Security'],
    ['infrastructure', 'Infrastructure'],
    ['external_integrations', 'External Integrations'],
    ['environment', 'Environment'],
  ]
  for (const [key, label] of CATEGORIES) {
    const arr = signals[key]
    if (arr.length === 0) continue
    parts.push(`### ${label}\n`)
    for (const s of arr) {
      parts.push(`- ${s.label} — confidence: ${s.confidence}`)
      if (s.evidence.length > 0) {
        parts.push(`  - Evidence: ${s.evidence.map((e) => '`' + e + '`').join(', ')}`)
      }
      if (s.recommended_review) {
        parts.push(`  - Review: ${s.recommended_review}`)
      }
    }
    parts.push('')
  }
  return parts.join('\n')
}

export function renderSignalsConsole(signals: ScanSignals): string[] {
  const lines: string[] = []
  const CATEGORIES: [SignalCategory, string][] = [
    ['auth', 'Auth'],
    ['payments', 'Payments'],
    ['webhooks', 'Webhooks'],
    ['storage', 'Storage'],
    ['background_jobs', 'Background jobs'],
    ['email', 'Email'],
    ['database', 'Database'],
    ['migrations', 'Migrations'],
    ['api_routes', 'API routes'],
    ['tests', 'Tests'],
    ['security', 'Security'],
    ['infrastructure', 'Infrastructure'],
    ['external_integrations', 'Integrations'],
    ['environment', 'Environment'],
  ]
  for (const [key, label] of CATEGORIES) {
    const arr = signals[key]
    if (arr.length === 0) continue
    if (arr.length === 1) {
      const warning = arr[0].label.toLowerCase().includes('no test') ? ' ⚠' : ''
      lines.push(`  ${label}: ${arr[0].label}${warning}`)
    } else {
      lines.push(`  ${label}: ${arr.map((s) => s.label).join(', ')}`)
    }
  }
  return lines
}
