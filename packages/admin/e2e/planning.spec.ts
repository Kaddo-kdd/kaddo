import { test, expect } from '@playwright/test'

// WI-074 + WI-075 — Unified Planning Explorer E2E, over Wasma-representative fixtures (PLAN-001 / RM-08
// / EP-001 blocked by EP-002 / INI-050 in epic / INI-051 standalone). Read-only navigation; no
// knowledge change. Planning is the single entry for Plans, Epics and Initiatives.

test.describe('Unified Planning Explorer', () => {
  test('WI-075: Planning is the single sidebar entry; Initiatives is not a top-level item', async ({ page }) => {
    await page.goto('/overview')
    const nav = page.getByRole('navigation')
    await expect(nav.getByText('Planning')).toBeVisible()
    await expect(nav.getByText('Initiatives', { exact: true })).toHaveCount(0)
  })

  test('WI-075: overview shows indicators, sections and initiatives (incl. unassigned)', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByRole('heading', { name: 'Planning', exact: true })).toBeVisible()
    // Secondary navigation.
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Delivery Plans' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Epics' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Initiatives' })).toBeVisible()
    // Indicators, including initiatives without an epic.
    await expect(page.getByText('Initiatives without Epic')).toBeVisible()
    // Initiatives appear in the overview (standalone one is shown, not treated as an error).
    await expect(page.getByText('Standalone Initiative')).toBeVisible()
    await expect(page.getByText('independent (no epic)').first()).toBeVisible()
  })

  test('WI-075: the Initiatives tab reuses the existing Initiatives screen', async ({ page }) => {
    await page.goto('/planning')
    await page.getByRole('tab', { name: 'Initiatives' }).click()
    await expect(page.getByRole('button', { name: /Create Initiative/ })).toBeVisible()
    await expect(page.getByText('Host-side Workers')).toBeVisible()
  })

  test('WI-075: existing /initiatives routes still work (bookmarks preserved)', async ({ page }) => {
    await page.goto('/initiatives/INI-051')
    await expect(page.getByText('Standalone Initiative')).toBeVisible()
    await expect(page.getByText('Planning coverage')).toBeVisible()
  })

  test('navigates Plan → milestones → Epic → initiatives/work items with human-gated readiness', async ({ page }) => {
    await page.goto('/planning')
    await page.getByText('Wasma Technical Roadmap').click()
    await expect(page.getByRole('heading', { name: 'Wasma Technical Roadmap' })).toBeVisible()
    await expect(page.getByText('Benchmark evidence reviewed').first()).toBeVisible()
    // Completion is human-gated via the canonical Completion Review (WI-078).
    await expect(page.getByRole('heading', { name: 'Completion Review' })).toBeVisible()
    await expect(page.getByText(/never completes anything automatically/)).toBeVisible()

    await page.getByText('Runtime Performance & Concurrency').click()
    await expect(page.getByRole('heading', { name: 'Runtime Performance & Concurrency' })).toBeVisible()
    await expect(page.getByText('Host-side Workers')).toBeVisible()
    await expect(page.getByText('owner(s): developer-a')).toBeVisible()
    await expect(page.getByText('Blocking dependencies: EP-002')).toBeVisible()
  })

  test('surfaces the EP-001 → EP-002 dependency block', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByText('blocked by unfinished dependency EP-002')).toBeVisible()
  })
})
