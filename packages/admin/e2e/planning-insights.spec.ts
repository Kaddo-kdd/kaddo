import { test, expect } from '@playwright/test'

// WI-081 — Planning Progress & Execution Insights E2E over the fixture project. The read-only Execution
// Insights block lives in the Planning Overview tab. Asserts the three separated dimensions, the three
// attention indicators, a deterministic Needs-attention queue with filters, milestone/outcome signals,
// navigation to canonical detail, and 375px responsiveness. Structural assertions keep it robust to the
// serial suite's shared mutable fixture.

test.describe('Planning Execution Insights (WI-081)', () => {
  test('Overview shows separated dimensions, attention queue with filters, milestones and navigation', async ({ page }) => {
    await page.goto('/planning')
    const insights = page.locator('section').filter({ hasText: 'Execution Insights' })
    await expect(insights).toBeVisible()

    // Three attention indicators (distinct families, never one score).
    await expect(insights.getByText('Blocking issues')).toBeVisible()
    await expect(insights.getByText('Outcome needs verification')).toBeVisible()
    await expect(insights.getByText('Milestones needing review')).toBeVisible()

    // Three separated dimensions (AC-02).
    await expect(insights.getByText('Planning Coverage')).toBeVisible()
    await expect(insights.getByText('Delivery Progress')).toBeVisible()
    await expect(insights.getByText('Outcome Verification')).toBeVisible()

    // Needs attention queue is present with deterministic signals.
    await expect(insights.getByRole('heading', { name: /Needs attention/ })).toBeVisible()

    // Filter by signal type → Dependency (EP-001 is blocked by the unfinished EP-002, a robust fixture
    // relation). Assert on the signal's reason text — the type label also appears inside the <option>,
    // so matching the reason avoids the select. (Pending-candidate classification is covered
    // deterministically by the Core and admin-server unit tests; the shared E2E fixture's only pending
    // candidate can be consumed by an earlier serial spec, so it is not asserted here.)
    await insights.getByLabel('Filter by signal type').selectOption('dependency')
    await expect(insights.getByText(/blocked by unfinished dependency/i)).toBeVisible()
    await insights.getByLabel('Filter by signal type').selectOption('all')

    // Milestone & outcome insights: RM-08 under PLAN-001 needs review (exit criteria unverified; never
    // inferred from the Epic — AC-16).
    const milestones = insights.locator('*').filter({ hasText: 'Milestones & outcomes' })
    await expect(insights.getByText('RM-08').first()).toBeVisible()
    await expect(insights.getByText(/needs review/).first()).toBeVisible()
    void milestones

    // Readiness is shown distinct from lifecycle completed (AC-10).
    await expect(insights.getByRole('heading', { name: 'Readiness' })).toBeVisible()
    await expect(insights.getByText(/not the same as a .*completed.* lifecycle status/)).toBeVisible()

    // Navigation from a signal/insight opens the canonical detail (AC-17).
    await insights.getByRole('button', { name: 'PLAN-001' }).first().click()
    await expect(page).toHaveURL(/\/planning\/plans\/PLAN-001/)
  })

  test('is usable at 375px without horizontal overflow (AC-21)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/planning')
    const insights = page.locator('section').filter({ hasText: 'Execution Insights' })
    await expect(insights).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
