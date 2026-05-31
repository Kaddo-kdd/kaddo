import path from 'path'
import { exists, readFile, readDir, isDir, isFile, join } from '../utils/fs.js'

export type Language = 'typescript' | 'javascript' | 'python' | 'go' | 'rust' | 'java' | 'unknown'
export type Framework =
  | 'next'
  | 'nuxt'
  | 'remix'
  | 'vite'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'fastapi'
  | 'django'
  | 'flask'
  | 'gin'
  | 'echo'
  | 'unknown'
  | 'none'
export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'pip' | 'poetry' | 'go-modules' | 'cargo' | 'unknown'

export type ScanResult = {
  language: Language
  framework: Framework
  packageManager: PackageManager
  codeDirs: string[]
  migrationDirs: string[]
  contractFiles: string[]
  infraFiles: string[]
  hasGit: boolean
  suggestedDomains: string[]
}

function detectLanguage(dir: string): Language {
  if (exists(join(dir, 'tsconfig.json'))) return 'typescript'
  if (exists(join(dir, 'package.json'))) return 'javascript'
  if (exists(join(dir, 'pyproject.toml')) || exists(join(dir, 'requirements.txt')) || exists(join(dir, 'setup.py'))) return 'python'
  if (exists(join(dir, 'go.mod'))) return 'go'
  if (exists(join(dir, 'Cargo.toml'))) return 'rust'
  if (exists(join(dir, 'pom.xml')) || exists(join(dir, 'build.gradle'))) return 'java'
  return 'unknown'
}

function readPackageJson(dir: string): Record<string, unknown> {
  const pkgPath = join(dir, 'package.json')
  if (!exists(pkgPath)) return {}
  try {
    return JSON.parse(readFile(pkgPath))
  } catch {
    return {}
  }
}

function detectFramework(dir: string): Framework {
  const pkg = readPackageJson(dir)
  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined ?? {}),
    ...(pkg.devDependencies as Record<string, string> | undefined ?? {}),
  }

  if (exists(join(dir, 'next.config.js')) || exists(join(dir, 'next.config.ts')) || exists(join(dir, 'next.config.mjs')) || 'next' in deps) return 'next'
  if (exists(join(dir, 'nuxt.config.ts')) || exists(join(dir, 'nuxt.config.js')) || 'nuxt' in deps) return 'nuxt'
  if (exists(join(dir, 'remix.config.js')) || '@remix-run/react' in deps) return 'remix'
  if (exists(join(dir, 'vite.config.ts')) || exists(join(dir, 'vite.config.js')) || 'vite' in deps) return 'vite'
  if ('@nestjs/core' in deps) return 'nestjs'
  if ('fastify' in deps) return 'fastify'
  if ('express' in deps) return 'express'
  if (exists(join(dir, 'pyproject.toml')) || exists(join(dir, 'requirements.txt'))) {
    const req = exists(join(dir, 'requirements.txt')) ? readFile(join(dir, 'requirements.txt')) : ''
    if (req.includes('fastapi')) return 'fastapi'
    if (req.includes('django')) return 'django'
    if (req.includes('flask')) return 'flask'
  }
  if (exists(join(dir, 'go.mod'))) {
    const mod = readFile(join(dir, 'go.mod'))
    if (mod.includes('gin-gonic/gin')) return 'gin'
    if (mod.includes('labstack/echo')) return 'echo'
  }
  if (Object.keys(deps).length > 0) return 'none'
  return 'unknown'
}

function detectPackageManager(dir: string): PackageManager {
  if (exists(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
  if (exists(join(dir, 'yarn.lock'))) return 'yarn'
  if (exists(join(dir, 'package-lock.json'))) return 'npm'
  if (exists(join(dir, 'package.json'))) return 'npm'
  if (exists(join(dir, 'poetry.lock')) || exists(join(dir, 'pyproject.toml'))) return 'poetry'
  if (exists(join(dir, 'requirements.txt'))) return 'pip'
  if (exists(join(dir, 'go.mod'))) return 'go-modules'
  if (exists(join(dir, 'Cargo.toml'))) return 'cargo'
  return 'unknown'
}

function detectCodeDirs(dir: string): string[] {
  const candidates = ['src', 'app', 'lib', 'pkg', 'cmd', 'api', 'server', 'client', 'core', 'internal']
  return candidates.filter((d) => isDir(join(dir, d)))
}

function detectMigrationDirs(dir: string): string[] {
  const candidates = [
    'supabase/migrations',
    'prisma/migrations',
    'db/migrations',
    'database/migrations',
    'migrations',
  ]
  return candidates.filter((d) => isDir(join(dir, d)))
}

function detectContractFiles(dir: string): string[] {
  const found: string[] = []
  const contractCandidates = [
    'openapi.json',
    'openapi.yaml',
    'openapi.yml',
    'swagger.json',
    'swagger.yaml',
    'swagger.yml',
    'schema.graphql',
    'api-schema.json',
  ]
  for (const f of contractCandidates) {
    if (isFile(join(dir, f))) found.push(f)
  }
  // Check for routes/events dirs as signals
  const dirCandidates = ['routes', 'events', 'schemas', 'contracts']
  for (const d of dirCandidates) {
    if (isDir(join(dir, d))) found.push(`${d}/`)
  }
  return found
}

function detectInfraFiles(dir: string): string[] {
  const found: string[] = []
  const fileCandidates = [
    'docker-compose.yml',
    'docker-compose.yaml',
    'Dockerfile',
    'serverless.yml',
    'serverless.yaml',
    'amplify.yml',
  ]
  for (const f of fileCandidates) {
    if (isFile(join(dir, f))) found.push(f)
  }
  const dirCandidates = ['terraform', 'infra', 'k8s', 'helm', '.github/workflows']
  for (const d of dirCandidates) {
    if (isDir(join(dir, d))) found.push(`${d}/`)
  }
  return found
}

// Suggest domains from code dirs, package.json workspaces, or top-level src subdirs
function suggestDomains(dir: string, codeDirs: string[]): string[] {
  const domains = new Set<string>()

  // Monorepo packages as domain signals
  const pkg = readPackageJson(dir)
  if (pkg.workspaces) {
    const ws = Array.isArray(pkg.workspaces) ? pkg.workspaces : (pkg.workspaces as { packages?: string[] }).packages ?? []
    for (const w of ws as string[]) {
      const name = w.replace(/\/\*$/, '').replace(/^packages\//, '').replace(/^apps\//, '')
      if (name && !name.includes('*')) domains.add(name)
    }
  }

  // Subdirs of src/ as domain signals
  for (const codeDir of codeDirs) {
    const fullPath = join(dir, codeDir)
    if (isDir(fullPath)) {
      try {
        const entries = readDir(fullPath)
        for (const entry of entries) {
          if (isDir(join(fullPath, entry)) && !entry.startsWith('.') && !['components', 'utils', 'lib', 'types', 'hooks', 'styles', 'assets', 'public', 'static', 'test', 'tests', '__tests__'].includes(entry)) {
            domains.add(entry)
          }
        }
      } catch {
        // ignore unreadable dirs
      }
    }
  }

  return [...domains].slice(0, 6)
}

export function scan(dir: string): ScanResult {
  const language = detectLanguage(dir)
  const framework = detectFramework(dir)
  const packageManager = detectPackageManager(dir)
  const codeDirs = detectCodeDirs(dir)
  const migrationDirs = detectMigrationDirs(dir)
  const contractFiles = detectContractFiles(dir)
  const infraFiles = detectInfraFiles(dir)
  const hasGit = isDir(join(dir, '.git'))
  const suggestedDomains = suggestDomains(dir, codeDirs)

  return {
    language,
    framework,
    packageManager,
    codeDirs,
    migrationDirs,
    contractFiles,
    infraFiles,
    hasGit,
    suggestedDomains,
  }
}
