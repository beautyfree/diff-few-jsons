import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Security and Privacy Tests', () => {
  describe('Middleware Security Headers', () => {
    it('should apply security headers to all requests', async () => {
      // Import middleware after setting up environment
      const { middleware } = await import('@/app/middleware')
      
      // Create a mock request
      const request = new NextRequest('http://localhost:3000/')
      
      // Call middleware
      const response = await middleware(request)
      
      // Check security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
      expect(response.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp')
      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
    })
  })

  describe('API Consent Gating', () => {
    it('should block API access when disabled via environment', async () => {
      // Disable API
      process.env.ENABLE_DIFF_API = 'false'
      
      const { middleware } = await import('@/app/middleware')
      
      // Create a request to the diff API
      const request = new NextRequest('http://localhost:3000/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-consent': 'true'
        }
      })
      
      const response = await middleware(request)
      
      // Should return 503 with API disabled message
      expect(response.status).toBe(503)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('Diff API is not enabled')
      expect(responseData.message).toContain('Server-side diffing is disabled')
      expect(responseData.code).toBe('API_DISABLED')
    })

    it('should require consent header for API access', async () => {
      // Enable API
      process.env.ENABLE_DIFF_API = 'true'
      
      const { middleware } = await import('@/app/middleware')
      
      // Create a request without consent header
      const request = new NextRequest('http://localhost:3000/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const response = await middleware(request)
      
      // Should return 403 with consent required message
      expect(response.status).toBe(403)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('User consent required')
      expect(responseData.message).toContain('Explicit consent is required')
      expect(responseData.code).toBe('CONSENT_REQUIRED')
      expect(responseData.privacy).toBeDefined()
      expect(responseData.privacy.dataRetention).toBe('none')
      expect(responseData.privacy.dataSharing).toBe('none')
    })

    it('should allow API access with proper consent', async () => {
      // Enable API
      process.env.ENABLE_DIFF_API = 'true'
      
      const { middleware } = await import('@/app/middleware')
      
      // Create a request with consent header
      const request = new NextRequest('http://localhost:3000/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-consent': 'true'
        }
      })
      
      const response = await middleware(request)
      
      // Should allow the request to proceed
      expect(response.headers.get('x-consent-verified')).toBe('true')
    })

    it('should require HTTPS in production', async () => {
      // Enable API and set production environment
      process.env.ENABLE_DIFF_API = 'true'
      process.env.NODE_ENV = 'production'
      
      const { middleware } = await import('@/app/middleware')
      
      // Create a request with HTTP protocol
      const request = new NextRequest('http://localhost:3000/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-consent': 'true',
          'x-forwarded-proto': 'http'
        }
      })
      
      const response = await middleware(request)
      
      // Should return 400 with HTTPS required message
      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toBe('HTTPS required')
      expect(responseData.message).toContain('Secure connection required')
      expect(responseData.code).toBe('HTTPS_REQUIRED')
    })
  })

  describe('Consent Component', () => {
    it('should show consent dialog when no consent is saved', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      // Import and render component
      const { render, screen } = require('@testing-library/react')
      const Consent = require('@/components/Consent').default
      
      render(<Consent />)
      
      // Should show consent dialog
      expect(screen.getByText('Privacy & Consent')).toBeInTheDocument()
      expect(screen.getByText('Server-side processing')).toBeInTheDocument()
      expect(screen.getByText('Session storage')).toBeInTheDocument()
      expect(screen.getByText('Usage analytics')).toBeInTheDocument()
    })

    it('should save consent preferences to localStorage', () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      const { render, screen, fireEvent } = require('@testing-library/react')
      const Consent = require('@/components/Consent').default
      
      render(<Consent />)
      
      // Enable server processing
      const serverProcessingCheckbox = screen.getByLabelText('Server-side processing')
      fireEvent.click(serverProcessingCheckbox)
      
      // Save preferences
      const saveButton = screen.getByText('Save Preferences')
      fireEvent.click(saveButton)
      
      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user-consent',
        expect.stringContaining('"serverProcessing":true')
      )
    })

    it('should show privacy status indicator', () => {
      // Mock localStorage with saved consent
      const savedConsent = {
        serverProcessing: false,
        dataRetention: true,
        analytics: false,
        timestamp: new Date().toISOString()
      }
      
      const localStorageMock = {
        getItem: vi.fn(() => JSON.stringify(savedConsent)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      const { render, screen } = require('@testing-library/react')
      const Consent = require('@/components/Consent').default
      
      render(<Consent />)
      
      // Should show privacy status
      expect(screen.getByText('Local processing only')).toBeInTheDocument()
      expect(screen.getByText(/All data processing happens locally/)).toBeInTheDocument()
    })
  })

  describe('Consent Utilities', () => {
    it('should check consent state correctly', () => {
      // Mock localStorage
      const savedConsent = {
        serverProcessing: true,
        dataRetention: false,
        analytics: true,
        timestamp: new Date().toISOString()
      }
      
      const localStorageMock = {
        getItem: vi.fn(() => JSON.stringify(savedConsent)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      const { 
        getConsentState, 
        hasServerProcessingConsent, 
        hasDataRetentionConsent,
        hasAnalyticsConsent 
      } = require('@/utils/consent')
      
      const consent = getConsentState()
      expect(consent).toEqual(savedConsent)
      expect(hasServerProcessingConsent()).toBe(true)
      expect(hasDataRetentionConsent()).toBe(false)
      expect(hasAnalyticsConsent()).toBe(true)
    })

    it('should create consent headers for API calls', () => {
      // Mock localStorage with server processing consent
      const savedConsent = {
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }
      
      const localStorageMock = {
        getItem: vi.fn(() => JSON.stringify(savedConsent)),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      const { createConsentHeaders } = require('@/utils/consent')
      
      const headers = createConsentHeaders()
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['x-user-consent']).toBe('true')
    })

    it('should validate consent state correctly', () => {
      const { validateConsentState } = require('@/utils/consent')
      
      const validConsent = {
        serverProcessing: true,
        dataRetention: false,
        analytics: true,
        timestamp: new Date().toISOString()
      }
      
      const invalidConsent = {
        serverProcessing: true,
        // Missing required fields
      }
      
      expect(validateConsentState(validConsent)).toBe(true)
      expect(validateConsentState(invalidConsent)).toBe(false)
      expect(validateConsentState(null)).toBe(false)
      expect(validateConsentState(undefined)).toBe(false)
    })
  })

  describe('CSP Configuration', () => {
    it('should have strict CSP headers configured', async () => {
      const nextConfig = require('@/next.config.js')
      const headers = await nextConfig.headers()
      
      const cspHeader = headers[0].headers.find(
        (h: any) => h.key === 'Content-Security-Policy'
      )
      
      expect(cspHeader).toBeDefined()
      expect(cspHeader.value).toContain("default-src 'self'")
      expect(cspHeader.value).toContain("script-src 'self'")
      expect(cspHeader.value).toContain("object-src 'none'")
      expect(cspHeader.value).toContain("frame-ancestors 'none'")
    })

    it('should have additional security headers configured', async () => {
      const nextConfig = require('@/next.config.js')
      const headers = await nextConfig.headers()
      
      const headerKeys = headers[0].headers.map((h: any) => h.key)
      
      expect(headerKeys).toContain('X-Content-Type-Options')
      expect(headerKeys).toContain('X-Frame-Options')
      expect(headerKeys).toContain('X-XSS-Protection')
      expect(headerKeys).toContain('Referrer-Policy')
    })
  })
})
