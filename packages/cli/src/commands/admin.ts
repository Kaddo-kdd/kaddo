import { exists, join, cwd, ensureDir } from '../utils/fs.js'
import { loadConfig } from '../core/config.js'
import path from 'path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

type AdminOpts = {
  port?: number
  host?: string
  noOpen?: boolean
}

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.once('error', () => resolve(false))
    server.once('listening', () => { server.close(); resolve(true) })
    server.listen(port, host)
  })
}

function resolveStaticDir(): string | null {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const candidates = [
    // Monorepo development: prefer the freshly built admin over the copy bundled into the CLI dist.
    // The CLI build copies admin/dist into dist/admin-dist, but that copy can be stale when the admin
    // was rebuilt after the CLI (build order is not guaranteed in `pnpm -r build`). Serving the admin
    // package's own dist first ensures `kaddo admin` always shows the current frontend in dev. This
    // path does not exist in a published npm install (admin is private), so it falls back below.
    path.resolve(__dirname, '..', '..', 'admin', 'dist'),
    path.resolve(__dirname, '..', 'node_modules', '@kaddo', 'admin', 'dist'),
    // Bundled inside CLI dist (npm install)
    path.resolve(__dirname, 'admin-dist'),
  ]
  for (const c of candidates) {
    if (exists(join(c, 'index.html'))) return c
  }
  return null
}

export async function runAdmin(opts: AdminOpts = {}) {
  const dir = cwd()
  const port = opts.port ?? 4173
  const host = opts.host ?? '127.0.0.1'

  const config = loadConfig(dir)
  if (!config) {
    console.log('')
    console.log('Kaddo Admin could not start.')
    console.log('')
    console.log('No Kaddo project was detected in the current directory.')
    console.log('')
    console.log('Run:')
    console.log('  kaddo init')
    console.log('')
    console.log('or execute this command from a Kaddo project.')
    console.log('')
    process.exit(1)
  }

  const available = await isPortAvailable(port, host)
  if (!available) {
    console.log('')
    console.log(`Port ${port} is already in use.`)
    console.log('')
    console.log('Use:')
    console.log(`  kaddo admin --port <port>`)
    console.log('')
    process.exit(1)
  }

  const staticDir = resolveStaticDir()
  if (!staticDir) {
    console.error('Admin frontend not built. Run `pnpm -r build` first.')
    process.exit(1)
  }

  // Dynamic import — try bundled copy first, then monorepo package
  let adminServer: { createAdminServer: any; SQLiteAdminStorage: any }
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const bundled = path.resolve(__dirname, 'admin-server', 'index.js')
    if (exists(bundled)) {
      // Use file:// URL for Windows ESM compatibility
      const { pathToFileURL } = await import('node:url')
      adminServer = await import(pathToFileURL(bundled).href)
    } else {
      adminServer = await import('@kaddo/admin-server')
    }
  } catch {
    adminServer = await import('@kaddo/admin-server')
  }
  const { createAdminServer, SQLiteAdminStorage } = adminServer

  // Initialize storage
  const dbDir = join(dir, '.kaddo', 'admin')
  ensureDir(dbDir)
  const dbPath = join(dbDir, 'admin.db')
  const storage = new SQLiteAdminStorage(dbPath)
  await storage.initialize()

  const server = await createAdminServer({
    projectDir: dir,
    storage,
    staticDir,
    host,
    port,
  })

  const address = await server.start()

  console.log('')
  console.log('Kaddo Admin')
  console.log('')
  console.log(`Project: ${config.project.name}`)
  console.log(`Mode: local`)
  console.log(`Address: ${address}`)
  console.log('')
  console.log(`Session: active`)
  console.log(`Storage: SQLite`)
  console.log(`Project source: Kaddo Core`)
  console.log('')
  console.log('Press Ctrl+C to stop.')
  console.log('')

  if (!opts.noOpen) {
    try {
      const { default: open } = await import('open')
      await open(address)
    } catch {}
  }

  const shutdown = async () => {
    console.log('')
    console.log('Shutting down...')
    await server.stop()
    console.log('Kaddo Admin stopped.')
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}
