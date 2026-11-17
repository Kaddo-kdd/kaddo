import { test, expect } from '@playwright/test'

// WI-086 — Plan Detail → Milestones is a compact, decision-oriented index. Verified/total comes from the
// same canonical evaluator as Evidence & completion; one milestone expands at a time; zero-criteria is an
// explicit empty state (never 0/0 = complete); an unreadable source element is diagnosed distinctly from a
// not-verified criterion; a criterion links to the single shared Record-evidence flow with milestone
// context. Epic→Work Item association stays canonically deduped (direct ∪ indirect, each WI once).
// Structural, resilient assertions — the suite is serial over a shared mutable fixture.

test.describe('Planning milestone tracking & data quality (WI-086)', () => {
  test('Milestones is a compact index with verified/total, one expansion at a time (AC-06/07)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()

    // Compact index: each milestone is one row; criteria are NOT all expanded up front.
    await expect(page.getByRole('button', { name: /RM-01/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /RM-09/ })).toBeVisible()
    await expect(page.getByText('Schema defined')).toHaveCount(0)

    // Verified/total badges come straight from the evaluator (passed/total), never a progress %.
    await expect(page.getByText('2/2 verified')).toBeVisible()          // RM-01 both passed
    await expect(page.getByText(/needs review/).first()).toBeVisible()  // e.g. RM-02 (one failed)

    // Expand RM-02 → only its criteria show, with Core-emitted statuses.
    await page.getByRole('button', { name: /RM-02/ }).click()
    await expect(page.getByText('Entities modeled')).toBeVisible()
    await expect(page.getByText('Migrations reversible')).toBeVisible()
    await expect(page.getByText('failed').first()).toBeVisible()

    // Selecting another milestone collapses the first (one at a time).
    await page.getByRole('button', { name: /RM-01/ }).click()
    await expect(page.getByText('Entities modeled')).toHaveCount(0)
    await expect(page.getByText('Schema defined')).toBeVisible()
  })

  test('a milestone with no exit criteria is an explicit empty state, never 0/0 complete (AC-10)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()
    await expect(page.getByText('no exit criteria declared')).toBeVisible() // RM-07 badge
    await page.getByRole('button', { name: /RM-07/ }).click()
    await expect(page.getByText(/No readable exit criteria are declared/)).toBeVisible()
  })

  test('an unreadable source element is diagnosed distinctly from not-verified (AC-15/16)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()
    await page.getByRole('button', { name: /RM-06/ }).click()
    // The readable criterion is shown as not-verified; the mapped element is called out separately.
    await expect(page.getByText('Cutover rehearsed')).toBeVisible()
    await expect(page.getByText(/not readable text/)).toBeVisible()
    await expect(page.getByText(/milestones\[\]\.exit_criteria/)).toBeVisible()
    // The raw object is never rendered as a criterion.
    await expect(page.getByText('[object Object]')).toHaveCount(0)
  })

  test('linked Epics are shown from the milestone context, and evidence opens with the right context (AC-11/12)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()
    // RM-08 carries EP-001 (epic.milestone = RM-08) — a canonical association, not invented.
    await expect(page.getByText('EP-001').first()).toBeVisible()

    await page.getByRole('button', { name: /RM-08/ }).click()
    // Record evidence from a specific criterion → the single shared drawer, carrying milestone + criterion.
    await page.getByRole('button', { name: 'Record evidence' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Record evidence' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Milestone RM-08/)).toBeVisible()
    await expect(dialog.getByText(/Benchmark evidence reviewed|Worker isolation verified/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()

    // A contextual link reaches the full Evidence & completion review via the existing section hash.
    await expect(page.getByText('Review in Evidence & completion')).toBeVisible()
  })

  test('saving milestone evidence updates the result in place and keeps the milestone selected (AC-13)', async ({ page }) => {
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()
    await page.getByRole('button', { name: /RM-03/ }).click()
    await expect(page.getByText('Endpoints documented')).toBeVisible()
    await page.getByRole('button', { name: 'Record evidence' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Record evidence' })
    await dialog.locator('select').first().selectOption('passed')
    await dialog.getByPlaceholder('What the evidence shows (not just a checkbox)').fill('Endpoints published in the API reference')
    await dialog.getByRole('button', { name: 'Save evidence' }).click()
    // Back on the same milestone, the criterion now reflects passed evidence.
    await expect(page.getByText('Endpoints published in the API reference')).toBeVisible()
  })

  test('Epic → Work Item association stays deduped: direct ∪ indirect listed once, independents excluded (AC-18/19)', async ({ page }) => {
    await page.goto('/planning/epics/EP-002')
    await page.getByRole('tab', { name: /Relations & delivery/ }).click()
    // WI-060 is reachable both directly (epic) and indirectly (initiative) — it must appear exactly once.
    await expect(page.getByText('WI-060')).toHaveCount(1)
    // An independent Work Item (no epic, no initiative) is never auto-linked into the Epic.
    await expect(page.getByText('Consolidation fixture rule')).toHaveCount(0)
  })

  test('milestone index works at 375px without horizontal overflow (AC-22)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/planning/plans/PLAN-001')
    await page.getByRole('tab', { name: /Milestones/ }).click()
    await page.getByRole('button', { name: /RM-02/ }).click()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
