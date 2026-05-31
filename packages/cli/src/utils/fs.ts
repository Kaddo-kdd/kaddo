import fs from 'fs'
import path from 'path'

export function exists(p: string): boolean {
  return fs.existsSync(p)
}

export function readFile(p: string): string {
  return fs.readFileSync(p, 'utf-8')
}

export function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf-8')
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

export function readDir(dirPath: string): string[] {
  if (!exists(dirPath)) return []
  return fs.readdirSync(dirPath)
}

export function isFile(p: string): boolean {
  return exists(p) && fs.statSync(p).isFile()
}

export function isDir(p: string): boolean {
  return exists(p) && fs.statSync(p).isDirectory()
}

export function cwd(): string {
  return process.cwd()
}

export function resolve(...parts: string[]): string {
  return path.resolve(...parts)
}

export function join(...parts: string[]): string {
  return path.join(...parts)
}
