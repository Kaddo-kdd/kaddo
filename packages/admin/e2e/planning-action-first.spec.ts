import { test, expect } from '@playwright/test'

// WI-088 — action-first Planning Overview + contextual navigation. The Overview leads with a compact status
// and a "What's next" block (max 3 canonical actions); diagnostics are on demand, nothing hidden; opening a
// detail from an action keeps a return path that restores the origin, while the global routes still work.
// Read-only: navigating never writes. Structural, resilient assertions over the serial shared fixture.

test.describe('Planning action-first experience (WI-088)', () => {
  test('Overview leads with status + What\'s next before diagnostics (AC-01/03)', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByText('Project planning status')).toBeVisible()
    await expect(page.getByRole('heading', { name: /What's next/ })).toBeVisible()
    // An action shows a verb, a target artifact and a functional CTA.
    await expect(page.getByText('Review evidence').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Inspect →|Review →|Open →/ }).first()).toBeVisible()
    // Diagnostics are not rendered up front — they open on demand.
    await expect(page.getByRole('heading', { name: 'Execution Insights' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Open Diagnostics/ })).toBeVisible()
  })

  test('an ambiguous historical reference is a data-quality note, not a critical block (feedback #1/#3)', async ({ page }) => {
    await page.goto('/planning')
    // The composite materialized_as reference (a warning) is surfaced as a quiet data-quality note that
    // points to Diagnostics — it is NOT shown as a red Tier-1 blocking action.
    await expect(page.getByText(/provenance \/ data-quality note/)).toBeVisible()
    const whatsNext = page.locator('section').filter({ hasText: "What's next" })
    await expect(whatsNext.getByText('1 · blocking')).toHaveCount(0)
  })

  test('pending dependencies are blocking context, not actions to fix (AC-04/05)', async ({ page }) => {
    await page.goto('/planning')
    await expect(page.getByText(/blocked by pending dependencies — normal sequencing, not errors/)).toBeVisible()
  })

  test('Diagnostics open on demand with the full findings and insights (AC-08)', async ({ page }) => {
    await page.goto('/planning')
    await page.getByRole('button', { name: /Open Diagnostics/ }).click()
    await expect(page.getByRole('heading', { name: 'Execution Insights' })).toBeVisible()
    await expect(page.getByText('Needs attention', { exact: false }).first()).toBeVisible()
  })

  test('an action opens the target with context and a return path that restores the origin (AC-13/14/15)', async ({ page }) => {
    await page.goto('/planning')
    await page.getByRole('button', { name: /Review →/ }).first().click()
    // Landed on an entity detail with the Planning search context and a target section hash.
    await expect(page).toHaveURL(/from=%2Fplanning/)
    await expect(page).toHaveURL(/#evidence/)
    // Contextual breadcrumb + return link.
    const back = page.getByRole('button', { name: /Back to Planning/ })
    await expect(back).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Planning location' })).toBeVisible()
    // Returning lands back on Planning.
    await back.click()
    await expect(page).toHaveURL(/\/planning$/)
    await expect(page.getByRole('heading', { name: /What's next/ })).toBeVisible()
  })

  test('a Planning breadcrumb shows the milestone embedded in its Plan, not as a route (AC-17)', async ({ page }) => {
    await page.goto('/planning/epics/EP-001?from=%2Fplanning&fromLabel=Planning')
    const nav = page.getByRole('navigation', { name: 'Planning location' })
    await expect(nav).toBeVisible()
    await expect(nav.getByText('PLAN-001')).toBeVisible()
    await expect(nav.getByText(/milestone, in plan/)).toBeVisible()
  })

  test('deep link / global route still works with no Planning context (AC-16/19)', async ({ page }) => {
    await page.goto('/planning/epics/EP-001')
    await expect(page.getByRole('heading', { name: 'Runtime Performance & Concurrency' })).toBeVisible()
    // No contextual back-link when there is no origin.
    await expect(page.getByRole('button', { name: /Back to Planning/ })).toHaveCount(0)
    // A Work Item opened globally keeps its own Work Items breadcrumb, no Planning context.
    await page.goto('/work-items/WI-003')
    await expect(page.getByRole('button', { name: /Back to Planning/ })).toHaveCount(0)
  })

  test('opening a Work Item from Planning keeps a Planning return path (AC-14)', async ({ page }) => {
    await page.goto('/work-items/WI-003?from=%2Fplanning%2Fepics%2FEP-001%23relations&fromLabel=Planning')
    await expect(page.getByRole('navigation', { name: 'Planning location' })).toBeVisible()
    const back = page.getByRole('button', { name: /Back to Planning/ })
    await expect(back).toBeVisible()
    await back.click()
    await expect(page).toHaveURL(/\/planning\/epics\/EP-001/)
  })

  test('the full chain carries context: Epic → Initiative → back restores the Epic tab (AC-14/15)', async ({ page }) => {
    await page.goto('/planning/epics/EP-001?from=%2Fplanning&fromLabel=Planning#relations')
    // Open an associated Initiative from the Epic's Relations tab — it carries the Epic as origin.
    await page.getByText('INI-050').first().click()
    await expect(page).toHaveURL(/\/initiatives\/INI-050/)
    await expect(page.getByRole('navigation', { name: 'Planning location' }).getByRole('button', { name: 'EP-001', exact: true })).toBeVisible()
    const back = page.getByRole('button', { name: /Back to EP-001/ })
    await expect(back).toBeVisible()
    // Back returns to the Epic on its Relations tab, which still keeps its own return to Planning.
    await back.click()
    await expect(page).toHaveURL(/\/planning\/epics\/EP-001.*#relations/)
    await expect(page.getByRole('button', { name: /Back to Planning/ })).toBeVisible()
  })

  test('navigating Planning never writes to the project (AC-23)', async ({ page }) => {
    const writes: string[] = []
    page.on('request', (r) => { if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(r.method())) writes.push(`${r.method()} ${r.url()}`) })
    await page.goto('/planning')
    await page.getByRole('button', { name: /Review →/ }).first().click()
    await page.getByRole('button', { name: /Back to Planning/ }).click()
    await page.getByRole('button', { name: /Open Diagnostics/ }).click()
    expect(writes).toEqual([])
  })
})
