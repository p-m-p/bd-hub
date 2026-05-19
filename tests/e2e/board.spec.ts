import { expect, test } from '@playwright/test'

test('board loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Beads Dashboard/)
})
