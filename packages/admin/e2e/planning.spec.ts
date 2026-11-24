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

  test('WI-075/088: overview shows action-first status and sections; initiatives live in their tab', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByRole('heading', { name: 'Planning', exact: true })).toBeVisible()
    // Secondary navigation.
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Delivery Plans' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Epics' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Initiatives' })).toBeVisible()
    // WI-088: the Overview leads with a compact status, not duplicated full lists.
    await expect(page.getByText('Project planning status')).toBeVisible()
    // The standalone initiative is shown (not treated as an error) in the Initiatives tab.
    await page.getByRole('tab', { name: 'Initiatives' }).click()
    await expect(page.getByText('Standalone Initiative').first()).toBeVisible()
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
    // WI-088: full Plan list lives in the Delivery Plans tab (not duplicated on the Overview).
    await page.getByRole('tab', { name: 'Delivery Plans' }).click()
    await page.getByText('Wasma Technical Roadmap').click()
    await expect(page.getByRole('heading', { name: 'Wasma Technical Roadmap' })).toBeVisible()
    // WI-085/086: detail pages are overview-first with section tabs. The Milestones section is a compact
    // index — select one milestone to reveal its exit criteria; the Completion Review is under Evidence.
    await page.getByRole('tab', { name: /Milestones/ }).click()
    await page.getByRole('button', { name: /RM-08/ }).click()
    await expect(page.getByText('Benchmark evidence reviewed').first()).toBeVisible()
    await page.getByRole('tab', { name: /Evidence & completion/ }).click()
    await expect(page.getByRole('heading', { name: 'Completion Review' })).toBeVisible()
    await expect(page.getByText(/never completes anything automatically/)).toBeVisible()

    // Open the Epic from the Epics section.
    await page.getByRole('tab', { name: /Epics/ }).click()
    await page.getByText('Runtime Performance & Concurrency').click()
    await expect(page.getByRole('heading', { name: 'Runtime Performance & Concurrency' })).toBeVisible()
    // Blocking dependencies are on the Epic Overview; initiatives and owners under Relations & delivery.
    await expect(page.getByText('Blocking dependencies: EP-002')).toBeVisible()
    await page.getByRole('tab', { name: /Relations & delivery/ }).click()
    await expect(page.getByText('Host-side Workers')).toBeVisible()
    await expect(page.getByText('owner(s): developer-a')).toBeVisible()
  })

  test('surfaces the EP-001 → EP-002 dependency block', async ({ page }) => {
    await page.goto('/planning')
    // WI-088: the full Planning checks live under Diagnostics (on demand), nothing hidden.
    await page.getByRole('button', { name: /Open Diagnostics/ }).click()
    await expect(page.getByText('blocked by unfinished dependency EP-002')).toBeVisible()
  })
})
