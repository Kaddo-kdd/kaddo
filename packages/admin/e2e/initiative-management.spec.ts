import { test, expect } from '@playwright/test'

// WI-079 — Initiative Management & evidence-based completion E2E over the dedicated fixture INI-900
// (one pending candidate, one materialized candidate delivered by WI-900/completed, one success
// criterion). Drives the real Admin server and Core end to end: edit a candidate, remove it with a
// justification, then verify evidence-based completion is human-gated — NEEDS_WORK until the outcome is
// verified, and completion is an explicit decision (never an automatic status transition).

test.describe('Initiative management & completion (WI-079)', () => {
  test.describe.configure({ mode: 'serial' })

  test('edit a pending candidate, remove it with a justification, then human-complete once verified', async ({ page }) => {
    await page.goto('/initiatives/INI-900')

    await expect(page.getByRole('heading', { name: /Candidates/ })).toBeVisible()

    // Completion must NOT be reachable through a plain status transition (AC-22 bypass prevention).
    await expect(page.getByRole('button', { name: 'completed', exact: true })).toHaveCount(0)

    // Scenario A — edit the pending candidate; its id is preserved. ('Edit', not 'Edit assignments'.)
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    const edit = page.getByRole('dialog', { name: 'Edit candidate' })
    await expect(edit).toBeVisible()
    await edit.getByRole('textbox').first().fill('Pending SSO task (refined)') // Title is the first field
    await edit.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('Pending SSO task (refined)').first()).toBeVisible()

    // Scenario B — remove the pending candidate (justification required).
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    const remove = page.getByRole('dialog', { name: 'Remove candidate' })
    await remove.getByPlaceholder('Why is this candidate being dropped?').fill('Descoped for this cycle.')
    await remove.getByRole('button', { name: 'Remove candidate' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('Pending SSO task (refined)')).toHaveCount(0)

    // Scenario D — with scope delivered but the outcome unverified, the Initiative is NEEDS_WORK.
    const review = page.locator('section').filter({ hasText: 'Completion Review' })
    await expect(review.getByText('NEEDS WORK')).toBeVisible()
    await expect(review.getByText('not-verified')).toBeVisible()
    await expect(review.getByRole('button', { name: 'Complete initiative' })).toBeDisabled()

    // Scenario E — record outcome evidence for the single success criterion → READY.
    await review.getByRole('button', { name: 'Record evidence' }).first().click()
    const drawer = page.getByRole('dialog', { name: 'Record evidence' })
    await drawer.getByRole('combobox').first().selectOption('passed')
    await drawer.getByPlaceholder('What the evidence shows (not just a checkbox)').fill('SSO verified end to end in the acceptance run.')
    await drawer.getByPlaceholder('File, test, ADR or report').fill('reports/ini-900.md')
    await drawer.getByRole('button', { name: 'Save evidence' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(review.getByText('READY TO COMPLETE')).toBeVisible()
    await expect(review.getByText('passed')).toBeVisible()

    // Scenario F — complete through the human-gated dialog (an explicit decision, never automatic).
    await review.getByRole('button', { name: 'Complete initiative' }).click()
    const dialog = page.getByRole('dialog', { name: 'Complete initiative' })
    await dialog.getByPlaceholder('your name (optional)').fill('reviewer')
    await dialog.getByRole('button', { name: 'Complete initiative' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    // The Initiative is completed.
    await expect(page.locator('span').filter({ hasText: 'Status:' }).getByText('completed')).toBeVisible()
  })
})
