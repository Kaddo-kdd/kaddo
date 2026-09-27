import { describe, it, expect } from 'vitest'

describe('EmptyState component', () => {
  it('is exported as a function', async () => {
    const { EmptyState } = await import('../src/components/EmptyState')
    expect(typeof EmptyState).toBe('function')
  })

  it('accepts minimal props (title only)', async () => {
    const { EmptyState } = await import('../src/components/EmptyState')
    expect(() => EmptyState({ title: 'Nothing here' })).not.toThrow()
  })

  it('accepts all optional props', async () => {
    const { EmptyState } = await import('../src/components/EmptyState')
    expect(() => EmptyState({
      title: 'No items',
      description: 'Try adding one.',
      icon: '📋',
      action: { label: 'Add item', onClick: () => {} },
    })).not.toThrow()
  })
})

describe('ConfirmDialog component', () => {
  it('is exported as a function', async () => {
    const { ConfirmDialog } = await import('../src/components/ConfirmDialog')
    expect(typeof ConfirmDialog).toBe('function')
  })
})

describe('shared button styles', () => {
  it('exports btnStyle, primaryBtnStyle, dangerBtnStyle', async () => {
    const { btnStyle, primaryBtnStyle, dangerBtnStyle } = await import('../src/components/editor/primitives')
    expect(btnStyle).toBeDefined()
    expect(btnStyle.cursor).toBe('pointer')
    expect(primaryBtnStyle.background).toBe('var(--primary)')
    expect(dangerBtnStyle.color).toBe('var(--danger)')
  })

  it('exports DangerButton component', async () => {
    const { DangerButton } = await import('../src/components/editor/primitives')
    expect(typeof DangerButton).toBe('function')
  })
})
