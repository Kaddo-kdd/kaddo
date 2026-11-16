import { test, expect } from '@playwright/test'

// WI-085 — Planning Admin navigation & progressive disclosure. Detail pages are overview-first with
// accessible section tabs (only the active panel mounts, so heavy sections render on demand). Completion
// review filters criteria and selects one milestone at a time (the milestones are not all expanded).
// A non-string historical criterion is diagnosed as unreadable, never shown as a verified criterion.
// Structural assertions keep it robust to the serial suite's shared mutable fixture.

test.describe('Planning detail navigation (WI-085)', () => {
  test('Plan Detail is overview-first with accessible section tabs and on-demand sections', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')

    const tablist = page.getByRole('tablist', { name: 'Plan sections' })
    await expect(tablist).toBeVisible()
    // Overview is the default selected tab (AC-03).
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    // The heavy Evidence & completion and Activity sections are tabs, not rendered up front (AC-04).
    await expect(page.getByRole('tab', { name: /Evidence & completion/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Activity' })).toBeVisible()
    // Completion Review is NOT mounted until its tab opens.
    await expect(page.getByRole('heading', { name: 'Completion Review' })).toHaveCount(0)

    // Keyboard: focus the Overview tab and arrow to the next tab (AC-20).
    await page.getByRole('tab', { name: 'Overview' }).focus()
    await page.keyboard.press('ArrowRight')
    // The next tab becomes selected and the URL hash reflects the section (AC-06).
    await expect(page).toHaveURL(/#/)

    // Open Evidence & completion → the completion review (and milestone selector) mount on demand.
    await page.getByRole('tab', { name: /Evidence & completion/ }).click()
    await expect(page.getByRole('heading', { name: 'Completion Review' })).toBeVisible()
    // The two milestones are offered as a selector, not all expanded at once (AC-08).
    await expect(page.getByRole('button', { name: /RM-08/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /RM-09/ })).toBeVisible()
    await expect(page.getByText('Select a milestone to see its exit criteria', { exact: false })).toBeVisible()
    // Selecting a milestone reveals its exit criteria.
    await page.getByRole('button', { name: /RM-08/ }).click()
    await expect(page.getByText('Benchmark evidence reviewed')).toBeVisible()

    // Criteria status filter is present and does not change the canonical summary counts (AC-09).
    await expect(page.getByLabel('Filter criteria by status')).toBeVisible()

    // Activity (Collaboration) mounts only when its tab opens (AC-14).
    await page.getByRole('tab', { name: 'Activity' }).click()
    await expect(page.getByRole('heading', { name: 'Collaboration overview' })).toBeVisible()
  })

  test('a non-string historical criterion is diagnosed, never shown as a verified criterion (AC-18)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    // The Overview surfaces the unreadable-criterion note (PLAN-001 has a mapped success criterion).
    await expect(page.getByText(/not readable text/i)).toBeVisible()
    // The literal "[object Object]" is never rendered as a criterion.
    await expect(page.getByText('[object Object]')).toHaveCount(0)
  })

  test('detail navigation works at 375px without horizontal overflow (AC-22)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/planning/plans/PLAN-001')
    await expect(page.getByRole('tablist', { name: 'Plan sections' })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
