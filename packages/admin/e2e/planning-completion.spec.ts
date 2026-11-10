import { test, expect } from '@playwright/test'

// WI-078 — evidence-based completion E2E over the fixture Epic EP-900 (standalone, one success
// criterion, no Work Items). Drives the real Admin server and Core: verify → record evidence →
// human-gated completion. Every write is canonical; completion is never automatic.

test.describe('Planning completion (WI-078)', () => {
  test.describe.configure({ mode: 'serial' })

  test('an Epic is NEEDS_WORK until its outcome is verified, then human-completes with a decision', async ({ page }) => {
    await page.goto('/planning/epics/EP-900')
    const review = page.locator('section').filter({ hasText: 'Completion Review' })
    await expect(review).toBeVisible()
    // Canonical, evidence-based readiness — not the old structural "preconditions" flag.
    await expect(review.getByText('NEEDS WORK')).toBeVisible()
    await expect(review.getByText('not-verified')).toBeVisible()
    // Complete is disabled until ready.
    await expect(review.getByRole('button', { name: 'Complete epic' })).toBeDisabled()

    // Record evidence for the single success criterion.
    await review.getByRole('button', { name: 'Record evidence' }).first().click()
    const drawer = page.getByRole('dialog', { name: 'Record evidence' })
    await drawer.getByRole('combobox').first().selectOption('passed')
    await drawer.getByPlaceholder('What the evidence shows (not just a checkbox)').fill('Demonstrated in the acceptance run; recorded in the report.')
    await drawer.getByPlaceholder('File, test, ADR or report').fill('reports/ep-900.md')
    await drawer.getByRole('button', { name: 'Save evidence' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    // Now READY, and the criterion shows as passed.
    await expect(review.getByText('READY TO COMPLETE')).toBeVisible()
    await expect(review.getByText('passed')).toBeVisible()

    // Complete through the human-gated dialog.
    await review.getByRole('button', { name: 'Complete epic' }).click()
    const dialog = page.getByRole('dialog', { name: 'Complete epic' })
    await dialog.getByPlaceholder('your name (optional)').fill('reviewer')
    await dialog.getByRole('button', { name: 'Complete epic' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    // The Epic is completed and the recorded human decision is shown.
    await expect(page.locator('p').filter({ hasText: /EP-900/ }).getByText('completed')).toBeVisible()
    await expect(page.getByText(/Completed \(READY TO COMPLETE\).*by reviewer/)).toBeVisible()
  })
})
