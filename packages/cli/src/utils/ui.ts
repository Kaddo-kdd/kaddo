import * as p from '@clack/prompts'

export const intro = (title: string) => p.intro(title)
export const outro = (msg: string) => p.outro(msg)
export const log = p.log
export const cancel = (msg: string) => p.cancel(msg)

export async function text(opts: Parameters<typeof p.text>[0]) {
  const val = await p.text(opts)
  if (p.isCancel(val)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }
  return val as string
}

export async function confirm(opts: Parameters<typeof p.confirm>[0]) {
  const val = await p.confirm(opts)
  if (p.isCancel(val)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }
  return val as boolean
}

export async function select<T extends string>(opts: Parameters<typeof p.select>[0]) {
  const val = await p.select(opts)
  if (p.isCancel(val)) {
    p.cancel('Operation cancelled.')
    process.exit(0)
  }
  return val as T
}
