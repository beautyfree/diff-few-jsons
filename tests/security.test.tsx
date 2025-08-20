import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Consent from '@/components/Consent'
import {
  getConsentState,
  hasServerProcessingConsent,
  createConsentHeaders,
  makeConsentAwareApiCall,
  isApiAvailable,
  getPrivacyStatus,
  validateConsentState
} from '@/utils/consent'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => <div className={className} data-testid="shield-icon" {...props} />,
  AlertTriangle: ({ className, ...props }: any) => <div className={className} data-testid="alert-triangle-icon" {...props} />,
  CheckCircle: ({ className, ...props }: any) => <div className={className} data-testid="check-circle-icon" {...props} />,
  X: ({ className, ...props }: any) => <div className={className} data-testid="x-icon" {...props} />,
  Info: ({ className, ...props }: any) => <div className={className} data-testid="info-icon" {...props} />,
}))

// Mock useAppStore
vi.mock('@/state/store', () => ({
  useAppStore: () => ({
    addNotification: vi.fn(),
  }),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = vi.fn()

describe('Security and Privacy Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Consent Component', () => {
    it('should show consent dialog when no consent is saved', () => {
      render(<Consent />)
      
      expect(screen.getByText(/Privacy & Consent/i)).toBeInTheDocument()
      expect(screen.getByText(/Server-side processing/i)).toBeInTheDocument()
      expect(screen.getByText(/Session storage/i)).toBeInTheDocument()
      expect(screen.getByText(/Usage analytics/i)).toBeInTheDocument()
    })

    it('should save consent preferences to localStorage', () => {
      render(<Consent />)
      
      // Enable server processing
      const serverToggle = screen.getByLabelText(/Server-side processing/i)
      fireEvent.click(serverToggle)
      
      // Enable data retention
      const retentionToggle = screen.getByLabelText(/Session storage/i)
      fireEvent.click(retentionToggle)
      
      // Save preferences
      const saveButton = screen.getByText(/Save Preferences/i)
      fireEvent.click(saveButton)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user-consent',
        expect.stringContaining('"serverProcessing":true')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user-consent',
        expect.stringContaining('"dataRetention":true')
      )
    })

    it('should show privacy status indicator', () => {
      // Mock existing consent
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }))
      
      render(<Consent />)
      
      // Should show status indicator
      expect(screen.getByText(/Server processing enabled/i)).toBeInTheDocument()
      expect(screen.getByText(/Large files may be processed on the server/i)).toBeInTheDocument()
    })
  })

  describe('Consent Utilities', () => {
    it('should check consent state correctly', () => {
      const consent = getConsentState()
      
      expect(consent).toBeNull() // No consent saved initially
    })

    it('should create consent headers for API calls', () => {
      // Mock consent state
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }))
      
      const headers = createConsentHeaders()
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-user-consent': 'true'
      })
    })

    it('should validate consent state correctly', () => {
      const validConsent = {
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }
      
      const invalidConsent = {
        serverProcessing: true,
        // Missing required fields
      }
      
      expect(validateConsentState(validConsent)).toBe(true)
      expect(validateConsentState(invalidConsent)).toBe(false)
    })

    it('should check server processing consent', () => {
      // No consent
      expect(hasServerProcessingConsent()).toBe(false)
      
      // With consent
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }))
      
      expect(hasServerProcessingConsent()).toBe(true)
    })

    it('should get privacy status', () => {
      const status = getPrivacyStatus()
      
      expect(status).toEqual({
        serverProcessing: false,
        dataRetention: false,
        analytics: false,
        apiAvailable: false,
        lastUpdated: null
      })
    })

    it('should make consent-aware API calls', async () => {
      // Mock successful API call
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 'success' })
      })
      
      // Mock consent
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }))
      
      const result = await makeConsentAwareApiCall('/api/diff', { data: 'test' })
      
      expect(fetch).toHaveBeenCalledWith('/api/diff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-consent': 'true'
        },
        body: JSON.stringify({ data: 'test' })
      })
      
      expect(result).toEqual({ result: 'success' })
    })

    it('should check API availability', () => {
      // API should not be available without consent
      expect(isApiAvailable()).toBe(false)
      
      // With consent, API should be available
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        serverProcessing: true,
        dataRetention: false,
        analytics: false,
        timestamp: new Date().toISOString()
      }))
      
      expect(isApiAvailable()).toBe(true)
    })
  })
})
