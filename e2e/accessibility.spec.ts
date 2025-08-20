import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should not have accessibility violations on home page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Check that focus is visible
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+f') // or 'Meta+f' on Mac
    
    // Search input should be focused
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeFocused()
  })

  test('should have proper ARIA landmarks', async ({ page }) => {
    // Check for main landmarks
    await expect(page.locator('[role="main"]')).toBeVisible()
    
    // Check for search landmark
    await expect(page.locator('[role="search"]')).toBeVisible()
    
    // Check for region landmarks
    const regions = page.locator('[role="region"]')
    const regionCount = await regions.count()
    expect(regionCount).toBeGreaterThan(0)
  })

  test('should have accessible forms and controls', async ({ page }) => {
    // Check that all buttons have accessible names
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()
      
      if (isVisible) {
        // Each visible button should have an accessible name
        const accessibleName = await button.getAttribute('aria-label') ||
                              await button.getAttribute('title') ||
                              await button.textContent()
        
        expect(accessibleName?.trim()).toBeTruthy()
      }
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    
    if (headingCount > 0) {
      // Should start with h1 or h2 (since we might not have h1 on every page)
      const firstHeading = headings.first()
      const firstHeadingTag = await firstHeading.evaluate(el => el.tagName.toLowerCase())
      expect(['h1', 'h2']).toContain(firstHeadingTag)
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    // Run axe with specific color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toEqual([])
  })

  test('should be usable with screen reader', async ({ page }) => {
    // Test live regions
    const liveRegions = page.locator('[aria-live]')
    const liveRegionCount = await liveRegions.count()
    expect(liveRegionCount).toBeGreaterThan(0)
    
    // Test that live regions have proper politeness levels
    for (let i = 0; i < liveRegionCount; i++) {
      const liveRegion = liveRegions.nth(i)
      const ariaLive = await liveRegion.getAttribute('aria-live')
      expect(['polite', 'assertive', 'off']).toContain(ariaLive || '')
    }
  })

  test('should handle focus management properly', async ({ page }) => {
    // Test that focus is managed properly when interacting with the app
    await page.keyboard.press('Tab')
    
    let previousFocus = await page.locator(':focus')
    
    // Tab through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const currentFocus = await page.locator(':focus')
      
      // Focus should move to a different element
      const isSameElement = await previousFocus.evaluate((prev, current) => 
        prev === current, await currentFocus.elementHandle())
      
      if (i > 0) { // Skip first iteration as focus might stay on same element
        expect(isSameElement).toBeFalsy()
      }
      
      previousFocus = currentFocus
    }
  })

  test('should work with high contrast mode', async ({ page }) => {
    // Simulate high contrast mode by forcing colors
    await page.addStyleTag({
      content: `
        * {
          background-color: black !important;
          color: white !important;
        }
      `
    })
    
    // Run accessibility scan with high contrast styles
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    // Should not have any critical accessibility violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical'
    )
    
    expect(criticalViolations).toEqual([])
  })

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Check that animations are reduced or disabled
    const animatedElements = page.locator('[style*="animation"], [class*="animate"]')
    const animatedCount = await animatedElements.count()
    
    if (animatedCount > 0) {
      // With reduced motion, animations should be minimal or instant
      for (let i = 0; i < animatedCount; i++) {
        const element = animatedElements.nth(i)
        const computedStyle = await element.evaluate(el => 
          window.getComputedStyle(el).animationDuration
        )
        
        // Animation duration should be very short or 0 with reduced motion
        expect(['0s', '0.01s']).toContain(computedStyle)
      }
    }
  })
})
