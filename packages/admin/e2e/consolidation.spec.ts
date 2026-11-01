import { test, expect } from '@playwright/test'

// WI-073 — Knowledge Consolidation Explorer smoke tests, driven against the real Admin server over a
// fixture project. The fixture ships no plan, so the flow starts from the empty state, generates a
// plan, and explores it. The analysis is deterministic and never modifies knowledge/.

async function ensurePlan(page: import('@playwright/test').Page) {
  await page.goto('/reports/consolidation')
  const emptyBtn = page.getByRole('button', { name: 'Generate Consolidation Plan' })
  if (await emptyBtn.isVisible().catch(() => false)) await emptyBtn.click()
  await expect(page.getByText('Total opportunities')).toBeVisible()
}

test.describe('Knowledge Consolidation Explorer', () => {
  test('appears as a fourth Reports card and a Knowledge shortcut', async ({ page }) => {
    await page.goto('/reports')
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await expect(page.getByText('Knowledge Consolidation')).toBeVisible()
    await page.goto('/knowledge')
    await expect(page.getByRole('button', { name: 'Review Knowledge Consolidation' })).toBeVisible()
  })

  test('shows the usage guide, empty state and generates a plan', async ({ page }) => {
    await page.goto('/reports/consolidation')
    // UX-07 — usage guide.
    await expect(page.getByText('How to use Knowledge Consolidation')).toBeVisible()
    // VS-02 — no plan yet, then generate.
    await expect(page.getByText('No consolidation plan yet')).toBeVisible()
    await page.getByRole('button', { name: 'Generate Consolidation Plan' }).click()
    await expect(page.getByText('Total opportunities')).toBeVisible()
    await expect(page.getByText('Opportunities by category')).toBeVisible()
  })

  test('UX-01/UX-10: selecting an opportunity opens a drawer with evidence and the handoff action', async ({ page }) => {
    await ensurePlan(page)
    // The learning card is compact (source + category + classification), not the full title.
    const card = page.getByRole('button').filter({ hasText: 'WI-050' }).first()
    await expect(card).toBeVisible()
    await card.click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    await expect(drawer.getByRole('heading', { name: 'What was detected?' })).toBeVisible()
    await expect(drawer.getByRole('heading', { name: 'Evidence' })).toBeVisible()
    await expect(drawer.getByRole('heading', { name: 'Recommended next step' })).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Copy Agent Handoff' })).toBeVisible()
    // UX-02 — the detail is in the drawer, not duplicated at the end of the page.
    await expect(page.locator('main').getByText('Review with an agent')).toHaveCount(1)
  })

  test('UX-03/UX-05: Escape closes the drawer and preserves the active filter', async ({ page }) => {
    await ensurePlan(page)
    await page.getByLabel('Classification filter').selectOption('observed')
    // The suggested learning is filtered out.
    await expect(page.getByRole('button').filter({ hasText: 'WI-050' })).toHaveCount(0)
    // Open the first observed opportunity, then close with Escape.
    const card = page.locator('[id^="opp-card-"]').first()
    await card.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    // Filter is preserved after closing.
    await expect(page.getByLabel('Classification filter')).toHaveValue('observed')
  })

  test('UX-12: Coverage distinguishes Reload from Regenerate', async ({ page }) => {
    await ensurePlan(page)
    const coverage = page.getByRole('region', { name: 'Coverage' })
    await expect(coverage.getByRole('button', { name: 'Reload' })).toBeVisible()
    await expect(coverage.getByRole('button', { name: 'Regenerate' })).toBeVisible()
    await expect(page.getByText('re-reads the saved plan')).toBeVisible()
  })
})
