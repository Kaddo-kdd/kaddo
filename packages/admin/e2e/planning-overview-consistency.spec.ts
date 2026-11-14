import { test, expect } from '@playwright/test'

// WI-083 — Planning Overview consistency & information hierarchy. The Overview leads coverage with the
// validated figure (declared stays visible as detail), groups the Needs-attention summary by artifact
// (≤5 distinct artifacts, each with its finding count), distinguishes a Work-Item metric from blocking
// findings, and collapses the readiness detail behind a compact summary. Structural assertions keep it
// robust to the serial suite's shared mutable fixture. The Initiative-first empty-state layout needs a
// project with no Plans/Epics (covered by the Core and admin-server unit tests and by local visual review).

test.describe('Planning Overview consistency (WI-083)', () => {
  test('validated coverage leads; needs attention groups by artifact; readiness collapses', async ({ page }) => {
    await page.goto('/planning')

    // Overview metric row distinguishes the Work-Item count from blocking findings (AC-04). Exact match —
    // Initiative cards also say "No Work Items linked".
    await expect(page.getByText('Work Items linked', { exact: true })).toBeVisible()
    await expect(page.getByText('Blocked Work Items', { exact: true })).toBeVisible()

    const insights = page.locator('section').filter({ hasText: 'Execution Insights' })
    await expect(insights).toBeVisible()

    // Coverage leads with the validated figure when declarations are unresolved (the fixture's INI-055
    // carries a historical composite reference) — declared stays visible as detail (AC-07, AC-08).
    await expect(insights.getByText('Validated Coverage')).toBeVisible()
    await expect(insights.getByText(/\d+\/\d+ declared/)).toBeVisible()

    // Needs attention summary groups by artifact: each row shows a per-artifact finding count, and no
    // more than five distinct artifacts appear up front (AC-17, AC-18).
    await expect(insights.getByText(/top \d+ artifacts?/)).toBeVisible()
    await expect(insights.getByText(/\d+ findings? · /).first()).toBeVisible()
    const summaryRows = insights.locator('ul > li').filter({ hasText: /finding/ })
    expect(await summaryRows.count()).toBeLessThanOrEqual(5)

    // The full explorer (WI-082) still opens from here, unchanged (AC-19).
    await expect(insights.getByRole('button', { name: 'View all findings' })).toBeVisible()

    // Readiness is a collapsible summary (AC-13): the counts show up front, detail expands on demand.
    await expect(insights.getByText(/ready · .*needs work · .*blocked/)).toBeVisible()
    await insights.getByText('Readiness').click()
    await expect(insights.getByText(/Current evidence review:/).first()).toBeVisible()
  })

  test('is usable at 375px without horizontal overflow (AC-21)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/planning')
    await expect(page.locator('section').filter({ hasText: 'Execution Insights' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
