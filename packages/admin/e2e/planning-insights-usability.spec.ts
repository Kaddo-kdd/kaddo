import { test, expect } from '@playwright/test'

// WI-082 — Execution Insights usability & provenance diagnostics. The Planning Overview keeps a COMPACT
// Needs-attention summary (so the main blocks stay visible) and opens a full, read-only attention explorer
// (in-place drawer) with signal/artifact/severity filters, grouping and per-finding context. Provenance is
// classified: an ambiguous historical reference is a warning, never a false "missing Work Item". Structural
// assertions keep it robust to the serial suite's shared mutable fixture.

test.describe('Planning Execution Insights usability (WI-082)', () => {
  test('Overview keeps a compact summary; the explorer opens with filters, grouping, context and navigation', async ({ page }) => {
    await page.goto('/planning')
    const insights = page.locator('section').filter({ hasText: 'Execution Insights' })
    await expect(insights).toBeVisible()

    // Compact: the Needs attention summary never renders more than five rows up front (AC-01), and shows
    // an honest total of findings and artifacts (AC-04).
    await expect(insights.getByText(/\d+ findings? · \d+ artifacts?/)).toBeVisible()
    const compactRows = insights.locator('ul > li').filter({ hasText: /Blocking|Warning|Info/ })
    expect(await compactRows.count()).toBeLessThanOrEqual(5)

    // Delivery Plans, Epics and Initiatives stay discoverable on the Overview (AC-02).
    await expect(page.getByRole('tab', { name: /Delivery Plans/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Epics/ })).toBeVisible()

    // Open the full explorer (AC-05).
    await insights.getByRole('button', { name: 'View all findings' }).click()
    const dialog = page.getByRole('dialog', { name: 'All findings' })
    await expect(dialog).toBeVisible()

    // Full filters incl. severity + grouping (AC-06, AC-07).
    await expect(dialog.getByLabel('Explorer: filter by signal type')).toBeVisible()
    await expect(dialog.getByLabel('Explorer: filter by artifact type')).toBeVisible()
    await expect(dialog.getByLabel('Explorer: filter by severity')).toBeVisible()
    await expect(dialog.getByLabel('Group findings')).toBeVisible()

    // Each finding carries structured context: a diagnostic and a next-step action (AC-08, AC-09).
    await expect(dialog.getByText('Diagnostic:').first()).toBeVisible()

    // Provenance classification: the historical composite reference is a WARNING, diagnosed as ambiguous —
    // never claimed as a missing Work Item (AC-12, AC-14).
    await dialog.getByLabel('Explorer: filter by signal type').selectOption('provenance')
    await expect(dialog.getByText(/not a single canonical Work Item id/i).first()).toBeVisible()
    await expect(dialog.getByText('AN-005, AN-006, AN-007', { exact: false }).first()).toBeVisible()
    await expect(dialog.getByText(/missing Work Item AN-005, AN-006, AN-007/)).toHaveCount(0)

    // Navigation from a finding opens the canonical artifact detail (AC-09). The ambiguous finding belongs
    // to INI-055; its review action navigates there.
    await dialog.getByRole('button', { name: /Inspect reference|Review Initiative/ }).first().click()
    await expect(page).toHaveURL(/\/initiatives\/INI-055/)
  })

  test('the explorer closes on Escape and returns focus; usable at 375px without overflow (AC-10, AC-24)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/planning')
    const insights = page.locator('section').filter({ hasText: 'Execution Insights' })
    await expect(insights).toBeVisible()

    const trigger = insights.getByRole('button', { name: 'View all findings' })
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'All findings' })
    await expect(dialog).toBeVisible()

    // No horizontal overflow with the drawer open at phone width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    // Escape closes it and focus returns to the trigger.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})
