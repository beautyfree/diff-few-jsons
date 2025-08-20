import { test, expect } from '@playwright/test'

test('basic page load', async ({ page }) => {
  await page.goto('/')
  
  // Check that the page loads with the correct title
  await expect(page).toHaveTitle(/JSON Diff Timeline/)
  
  // Check that the main heading is present
  await expect(page.getByRole('heading', { name: 'JSON Diff Timeline' })).toBeVisible()
  
  // Check that the description is present
  await expect(page.getByText('Visualize JSON differences over time')).toBeVisible()
})
