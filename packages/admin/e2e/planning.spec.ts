import { test, expect } from '@playwright/test'

// WI-074 — Delivery Planning Explorer E2E, over Wasma-representative fixtures (PLAN-001 / RM-08 /
// EP-001 blocked by EP-002 / INI-050 with declared owners). Read-only navigation; no knowledge change.

test.describe('Delivery Planning Explorer', () => {
  test('lists plans and epics and surfaces a dependency block', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByRole('heading', { name: 'Delivery Planning' })).toBeVisible()
    await expect(page.getByText('Wasma Technical Roadmap')).toBeVisible()
    await expect(page.getByText('Runtime Performance & Concurrency')).toBeVisible()
    // Planning check: EP-001 is blocked by its unfinished dependency EP-002.
    await expect(page.getByText('blocked by unfinished dependency EP-002')).toBeVisible()
  })

  test('navigates Plan → milestones → Epic → initiatives/work items with human-gated readiness', async ({ page }) => {
    await page.goto('/planning')
    await page.getByText('Wasma Technical Roadmap').click()
    await expect(page.getByRole('heading', { name: 'Wasma Technical Roadmap' })).toBeVisible()
    // Milestone with its exit criteria (unique text).
    await expect(page.getByText('Benchmark evidence reviewed')).toBeVisible()
    await expect(page.getByText('Worker isolation verified')).toBeVisible()
    // Readiness note is explicit about human approval.
    await expect(page.getByText('Completion is never automatic')).toBeVisible()

    await page.getByText('Runtime Performance & Concurrency').click()
    await expect(page.getByRole('heading', { name: 'Runtime Performance & Concurrency' })).toBeVisible()
    // Declared responsibilities (never inferred from Git).
    await expect(page.getByText('Host-side Workers')).toBeVisible()
    await expect(page.getByText('owner(s): developer-a')).toBeVisible()
    // Blocking dependency surfaced; completion preconditions not met.
    await expect(page.getByText('Blocking dependencies: EP-002')).toBeVisible()
  })

  test('Planning appears in the sidebar navigation', async ({ page }) => {
    await page.goto('/overview')
    await expect(page.getByRole('navigation').getByText('Planning')).toBeVisible()
  })
})
