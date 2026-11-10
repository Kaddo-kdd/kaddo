import { test, expect } from '@playwright/test'

// WI-077: runs only against the disposable project created by e2e/server.mjs.
test.describe('Collaboration and assignment management (WI-077)', () => {
  test.describe.configure({ mode: 'serial' })

  test('edits Work Item assignments through the accessible modal and persists them', async ({ page }) => {
    await page.goto('/work-items/WI-003')
    await page.getByRole('button', { name: 'Manage assignments' }).click()
    const dialog = page.getByRole('dialog', { name: /Manage assignments/ })
    await expect(dialog.getByLabel('Owners')).toBeFocused()
    await dialog.getByLabel('Owners').fill('e2e-owner')
    await dialog.getByLabel('Contributors').fill('e2e-contributor')
    await dialog.getByRole('button', { name: 'Save assignments' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByText('e2e-owner', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Manage assignments' }).click()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })

  test('edits Initiative assignments through the same modal', async ({ page }) => {
    // Mutate a dedicated Initiative (INI-053) so read-only tests can rely on INI-050's fixture owners.
    await page.goto('/initiatives/INI-053')
    await page.getByRole('button', { name: 'Edit assignments' }).click()
    const dialog = page.getByRole('dialog', { name: /Edit assignments/ })
    await dialog.getByLabel('Owners').fill('initiative-owner')
    await dialog.getByLabel('Contributors').fill('initiative-contributor')
    await dialog.getByRole('button', { name: 'Save assignments' }).click()
    await expect(dialog).toBeHidden()
    await page.reload()
    await expect(page.getByText(/Owners:\s*initiative-owner/)).toBeVisible()
  })

  test('shows collaboration and filters without Git blocking Planning', async ({ page }) => {
    await page.goto('/work-items/WI-003')
    await expect(page.getByRole('heading', { name: 'COLLABORATION' })).toBeVisible()
    await expect(page.getByText('Git availability')).toBeVisible()

    await page.goto('/initiatives/INI-050')
    await expect(page.getByRole('heading', { name: 'Collaboration overview' })).toBeVisible()
    await page.goto('/planning/epics/EP-001')
    await expect(page.getByRole('heading', { name: 'Collaboration overview' })).toBeVisible()
    await page.goto('/planning/plans/PLAN-001')
    await expect(page.getByRole('heading', { name: 'Collaboration overview' })).toBeVisible()

    await page.goto('/work-items')
    await page.getByRole('combobox', { name: 'Filter by assignment' }).selectOption('unassigned')
    await expect(page.getByRole('combobox', { name: 'Filter by assignment' })).toHaveValue('unassigned')
    await page.getByRole('combobox', { name: 'Filter by assignment' }).selectOption('all')
    await page.getByRole('combobox', { name: 'Filter by linked Git activity' }).selectOption('with')
    await expect(page.getByRole('combobox', { name: 'Filter by linked Git activity' })).toHaveValue('with')
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`stays within 375px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.addInitScript((value) => localStorage.setItem('kaddo-admin-theme', value), theme)
      for (const route of ['/work-items/WI-003', '/initiatives/INI-050', '/planning/epics/EP-001', '/planning/plans/PLAN-001', '/work-items']) {
        await page.goto(route)
        await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 375)
      }
    })
  }
})
