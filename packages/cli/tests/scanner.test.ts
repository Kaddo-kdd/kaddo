import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { scan } from '../src/services/scanner.js'

let tmpDir: string

function mkdir(rel: string) {
  fs.mkdirSync(path.join(tmpDir, rel), { recursive: true })
}
function touch(rel: string, content = '') {
  const full = path.join(tmpDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-scan-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('scanner — language detection', () => {
  it('detects typescript when tsconfig.json exists', () => {
    touch('tsconfig.json', '{}')
    expect(scan(tmpDir).language).toBe('typescript')
  })

  it('detects javascript when only package.json exists', () => {
    touch('package.json', '{"name":"app"}')
    expect(scan(tmpDir).language).toBe('javascript')
  })

  it('detects python via requirements.txt', () => {
    touch('requirements.txt', 'fastapi\nuvicorn')
    expect(scan(tmpDir).language).toBe('python')
  })

  it('detects go via go.mod', () => {
    touch('go.mod', 'module myapp\ngo 1.21')
    expect(scan(tmpDir).language).toBe('go')
  })

  it('returns unknown for empty dir', () => {
    expect(scan(tmpDir).language).toBe('unknown')
  })
})

describe('scanner — framework detection', () => {
  it('detects next.js via next.config.js', () => {
    touch('package.json', '{"dependencies":{}}')
    touch('next.config.js', '')
    expect(scan(tmpDir).framework).toBe('next')
  })

  it('detects next.js via dependency', () => {
    touch('package.json', '{"dependencies":{"next":"14.0.0"}}')
    expect(scan(tmpDir).framework).toBe('next')
  })

  it('detects nestjs via dependency', () => {
    touch('package.json', '{"dependencies":{"@nestjs/core":"10.0.0"}}')
    expect(scan(tmpDir).framework).toBe('nestjs')
  })

  it('detects fastapi via requirements.txt', () => {
    touch('requirements.txt', 'fastapi\nuvicorn')
    expect(scan(tmpDir).framework).toBe('fastapi')
  })
})

describe('scanner — package manager detection', () => {
  it('detects pnpm via lockfile', () => {
    touch('pnpm-lock.yaml', '')
    touch('package.json', '{}')
    expect(scan(tmpDir).packageManager).toBe('pnpm')
  })

  it('detects yarn via lockfile', () => {
    touch('yarn.lock', '')
    touch('package.json', '{}')
    expect(scan(tmpDir).packageManager).toBe('yarn')
  })

  it('detects poetry via pyproject.toml', () => {
    touch('pyproject.toml', '[tool.poetry]')
    expect(scan(tmpDir).packageManager).toBe('poetry')
  })
})

describe('scanner — migration and infra detection', () => {
  it('detects supabase migrations dir', () => {
    mkdir('supabase/migrations')
    touch('package.json', '{}')
    expect(scan(tmpDir).migrationDirs).toContain('supabase/migrations')
  })

  it('detects prisma migrations dir', () => {
    mkdir('prisma/migrations')
    touch('package.json', '{}')
    expect(scan(tmpDir).migrationDirs).toContain('prisma/migrations')
  })

  it('detects docker-compose.yml as infra', () => {
    touch('docker-compose.yml', '')
    expect(scan(tmpDir).infraFiles).toContain('docker-compose.yml')
  })

  it('detects terraform dir as infra', () => {
    mkdir('terraform')
    expect(scan(tmpDir).infraFiles).toContain('terraform/')
  })
})

describe('scanner — code dirs', () => {
  it('detects src and app dirs', () => {
    mkdir('src')
    mkdir('app')
    const result = scan(tmpDir)
    expect(result.codeDirs).toContain('src')
    expect(result.codeDirs).toContain('app')
  })
})

describe('scanner — domain suggestions', () => {
  it('suggests domains from src subdirs', () => {
    mkdir('src/payments')
    mkdir('src/orders')
    mkdir('src/utils') // excluded
    const result = scan(tmpDir)
    expect(result.suggestedDomains).toContain('payments')
    expect(result.suggestedDomains).toContain('orders')
    expect(result.suggestedDomains).not.toContain('utils')
  })
})
