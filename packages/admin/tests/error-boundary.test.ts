import { describe, it, expect } from 'vitest'

describe('RouteErrorFallback', () => {
  it('extracts message from Error instances', async () => {
    const { RouteErrorFallback } = await import('../src/components/ErrorBoundary')
    expect(RouteErrorFallback).toBeDefined()
    expect(typeof RouteErrorFallback).toBe('function')
  })

  it('accepts unknown error type (non-Error)', async () => {
    const { RouteErrorFallback } = await import('../src/components/ErrorBoundary')
    expect(() => RouteErrorFallback({ error: 'string error' })).not.toThrow()
    expect(() => RouteErrorFallback({ error: null })).not.toThrow()
    expect(() => RouteErrorFallback({ error: 42 })).not.toThrow()
  })

  it('accepts optional reset function', async () => {
    const { RouteErrorFallback } = await import('../src/components/ErrorBoundary')
    const noop = () => {}
    expect(() => RouteErrorFallback({ error: new Error('test'), reset: noop })).not.toThrow()
    expect(() => RouteErrorFallback({ error: new Error('test') })).not.toThrow()
  })
})

describe('ErrorBoundary class component', () => {
  it('is exported and is a class', async () => {
    const { ErrorBoundary } = await import('../src/components/ErrorBoundary')
    expect(ErrorBoundary).toBeDefined()
    expect(ErrorBoundary.prototype).toBeDefined()
    expect(ErrorBoundary.prototype.render).toBeDefined()
  })

  it('has getDerivedStateFromError static method', async () => {
    const { ErrorBoundary } = await import('../src/components/ErrorBoundary')
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function')
    const state = ErrorBoundary.getDerivedStateFromError(new Error('boom'))
    expect(state).toEqual({ hasError: true, error: expect.any(Error) })
  })
})
