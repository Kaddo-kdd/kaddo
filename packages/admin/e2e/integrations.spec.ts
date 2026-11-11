import { test, expect } from '@playwright/test'

// VS-102 — Integration Adapter Foundation smoke test.
// The fixture configures the reference "mock-work-source" integration (available). Verifies the
// Integrations page lists it with capabilities, browses external work items, and imports one into a
// canonical Draft with human confirmation — then detects the duplicate on a second attempt.

test('Integrations page lists the configured integration and its capabilities', async ({ page }) => {
  await page.goto('/integrations')
  const active = page.locator('aside button[aria-current="page"]')
  await expect(active).toContainText('Integrations')
  await expect(page.getByText('Mock Work Source')).toBeVisible()
  await expect(page.getByText('mock-work-source')).toBeVisible()
  await expect(page.getByText('Import', { exact: false }).first()).toBeVisible()
})

test('browse external work items and import one as a Draft, then detect the duplicate', async ({ page }) => {
  await page.goto('/integrations')
  const main = page.locator('main')

  // The card's browse toggle is labelled "Browse" (it becomes "Hide items" once open); VS-103 shortened
  // it from "Browse work items" and this E2E selector was never updated — the cause of the stale-locator
  // 30s timeout. Match the real, current accessible name.
  await main.getByRole('button', { name: 'Browse', exact: true }).click()
  await expect(main.getByText('Open public registration to everyone')).toBeVisible()

  // Open the import preview for EXT-001 (the first listed item).
  await main.getByRole('button', { name: 'Import', exact: true }).first().click()
  await expect(main.getByText(/No project files have been modified yet/)).toBeVisible()
  await expect(main.getByText(/Captured intent:/)).toBeVisible()

  // Choose a Kaddo type (never inferred) and confirm the import.
  await main.getByLabel('Kaddo Work Item type').selectOption('feature')
  await main.getByRole('button', { name: 'Import as Draft' }).click()

  // Lands on the created Draft Work Item.
  await expect(page).toHaveURL(/\/work-items\/WI-/)
  await expect(main.getByText('draft', { exact: false }).first()).toBeVisible()

  // A second import attempt detects the existing link (no duplicate).
  await page.goto('/integrations')
  await main.getByRole('button', { name: 'Browse', exact: true }).click()
  await main.getByRole('button', { name: 'Import', exact: true }).first().click()
  await expect(main.getByText(/Already imported as/)).toBeVisible()
})
