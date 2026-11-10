import { test, expect } from '@playwright/test'

// WI-076 — Planning Management E2E: build a Plan → Milestone → Epic → Initiative association from
// Admin, over the throwaway fixture project (PLAN-001, EP-001/EP-002, INI-050 in epic, INI-051
// standalone). Every write goes through the real Admin server and Core; nothing here is a stub.

test.describe('Planning Management (WI-076)', () => {
  // Writes mutate the shared throwaway project, so run these in order within one worker.
  test.describe.configure({ mode: 'serial' })

  test('creates a Plan, adds a milestone, creates an Epic and shows it on the plan', async ({ page }) => {
    await page.goto('/planning')

    // Create a Delivery Plan from the overview (review → confirm two-step). The generated id is read
    // from the URL so the test is robust to a reused server where ids already advanced.
    await page.getByRole('button', { name: '+ Create Plan' }).first().click()
    await page.getByPlaceholder('e.g. Technical Roadmap').fill('E2E Roadmap')
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Confirm & create' }).click()
    await expect(page.getByRole('heading', { name: 'E2E Roadmap' })).toBeVisible()
    await page.waitForURL(/\/planning\/plans\/PLAN-\d+/)
    const planId = page.url().match(/PLAN-\d+/)![0]

    // Add a milestone to the new plan.
    await page.getByRole('button', { name: 'Manage Milestones' }).click()
    await page.getByRole('button', { name: '+ Add Milestone' }).click()
    await page.getByPlaceholder('RM-01').fill('RM-10')
    await page.getByPlaceholder('Milestone title').fill('E2E Milestone')
    await page.getByRole('button', { name: 'Save milestones' }).click()
    // RM-10 appears both in the Milestones section and the Completion Review (WI-078) — assert at least one.
    await expect(page.getByText('RM-10').first()).toBeVisible()
    await expect(page.getByText('E2E Milestone').first()).toBeVisible()

    // Create an Epic from the plan detail (plan is pre-selected).
    await page.getByRole('button', { name: '+ Create Epic' }).click()
    await page.getByPlaceholder('e.g. Runtime Performance').fill('E2E Epic')
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'E2E Epic' })).toBeVisible()
    // The Epic carries the plan reference it was created under.
    await expect(page.getByText(new RegExp(`EP-\\d+ .* ${planId}`))).toBeVisible()
  })

  test('associates an Initiative with an Epic and reflects it on both sides', async ({ page }) => {
    // Create a dedicated Epic so the flow does not depend on prior state.
    await page.goto('/planning')
    await page.getByRole('button', { name: '+ Create Epic' }).first().click()
    await page.getByPlaceholder('e.g. Runtime Performance').fill('E2E Assoc Epic')
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'E2E Assoc Epic' })).toBeVisible()
    await page.waitForURL(/\/planning\/epics\/EP-\d+/)
    const epicId = page.url().match(/EP-\d+/)![0]

    await page.getByRole('button', { name: '+ Associate Initiative' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Associate Initiative' })
    // INI-052 is reserved for this flow so read-only tests can keep relying on INI-051 being standalone.
    await dialog.getByRole('button', { name: /Associatable Initiative/ }).click()
    // Primary action is "Associate" for a standalone Initiative, "Confirm reassignment" otherwise.
    await dialog.getByRole('button', { name: /^(Associate|Confirm reassignment)$/ }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    // Epic side now lists the Initiative with a Remove action.
    await expect(page.getByText('INI-052')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()

    // Initiative side shows the Planning Context pointing at this Epic.
    await page.goto('/initiatives/INI-052')
    await expect(page.getByText('Planning Context')).toBeVisible()
    await expect(page.getByText(new RegExp(epicId))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Remove association' })).toBeVisible()
  })

  test('warns that detaching an Epic from its Plan also removes the milestone association', async ({ page }) => {
    await page.goto('/planning/epics/EP-001') // fixture Epic on PLAN-001 / RM-08
    await page.getByRole('button', { name: 'Edit Epic' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Epic' })
    // Detach the Plan (Related Plan → None): the milestone-removal warning must appear explicitly.
    await dialog.getByRole('combobox').first().selectOption('')
    await expect(dialog.getByText(/milestone association \(RM-08\)/)).toBeVisible()
    // Cancel — assert the warning only; do not mutate the shared fixture.
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('a metadata edit never changes the Epic lifecycle state', async ({ page }) => {
    await page.goto('/planning/epics/EP-001')
    const subheading = page.locator('p').filter({ hasText: /EP-001/ })
    await expect(subheading.getByText('in-progress')).toBeVisible()
    await page.getByRole('button', { name: 'Edit Epic' }).click()
    await expect(page.getByText('Expected outcome')).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    // Still in-progress after a metadata save (editing never triggers a lifecycle transition).
    await expect(subheading.getByText('in-progress')).toBeVisible()
  })
})
