import { test, expect } from '@playwright/test'

// WI-089 — a new Epic (no Initiatives, no Work Items) shows the Initiative-first recommendation on its
// Overview, from the same Core recommendation the CLI and MCP use. Create Initiative leads; Associate and
// Create Work Item Directly stay available (AC-02/AC-08/AC-09). Read-only: viewing never mutates (AC-11).

test.describe('Epic next-step recommendation (WI-089)', () => {
  test('a new Epic recommends creating or associating an Initiative, keeping the direct Work Item option', async ({ page }) => {
    // EP-010 in the fixture has an outcome and success criteria but no Initiatives and no Work Items.
    await page.goto('/planning/epics/EP-010')
    await expect(page.getByText('Recommended next step', { exact: true })).toBeVisible()
    await expect(page.getByText(/Create or associate an Initiative/)).toBeVisible()
    // Initiative-first is the primary action; the direct Work Item path stays available (never an error).
    await expect(page.getByRole('button', { name: 'Create Initiative' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Associate existing Initiative/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Create Work Item directly/ })).toBeVisible()
  })

  test('viewing the recommendation never writes to the project (AC-11)', async ({ page }) => {
    const writes: string[] = []
    page.on('request', (r) => { if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(r.method())) writes.push(`${r.method()} ${r.url()}`) })
    await page.goto('/planning/epics/EP-010')
    await expect(page.getByText('Recommended next step', { exact: true })).toBeVisible()
    expect(writes).toEqual([])
  })
})
