import { describe, it, expect } from 'vitest'

describe('Basic Test Setup', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have proper environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})
