import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { exists, writeFile, ensureDir, readFile, isFile, isDir } from '../src/utils/fs.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kaddo-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('fs utils', () => {
  it('exists returns false for non-existent path', () => {
    expect(exists(path.join(tmpDir, 'nope'))).toBe(false)
  })

  it('writeFile creates file and parent dirs', () => {
    const filePath = path.join(tmpDir, 'nested', 'dir', 'file.txt')
    writeFile(filePath, 'hello')
    expect(exists(filePath)).toBe(true)
    expect(readFile(filePath)).toBe('hello')
  })

  it('ensureDir creates directory recursively', () => {
    const dirPath = path.join(tmpDir, 'a', 'b', 'c')
    ensureDir(dirPath)
    expect(isDir(dirPath)).toBe(true)
  })

  it('isFile distinguishes file from dir', () => {
    const filePath = path.join(tmpDir, 'file.txt')
    writeFile(filePath, '')
    expect(isFile(filePath)).toBe(true)
    expect(isDir(filePath)).toBe(false)
  })
})
