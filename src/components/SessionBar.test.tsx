import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SessionBar from './SessionBar'
import { useAppStore } from '@/state/store'
import type { Session } from '@/types/domain'

// Mock the store
const mockStore = {
  versions: [],
  options: { ignoreRules: [], transformRules: [], arrayStrategy: 'index' as const, arrayKeyPath: undefined },
  selection: { mode: 'timeline' as const, index: 0 },
  ui: { theme: 'light' as const, hideUnchanged: false, searchQuery: '', rulesPanelExpanded: false },
  reset: vi.fn(),
  addVersion: vi.fn(),
  updateOptions: vi.fn(),
  setSelection: vi.fn(),
  setTheme: vi.fn(),
  setHideUnchanged: vi.fn(),
  setSearchQuery: vi.fn(),
  setRulesPanelExpanded: vi.fn()
}

vi.mock('@/state/store', () => ({
  useAppStore: vi.fn()
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon">💾</div>,
  Download: () => <div data-testid="download-icon">⬇️</div>,
  Upload: () => <div data-testid="upload-icon">⬆️</div>,
  Sun: () => <div data-testid="sun-icon">☀️</div>,
  Moon: () => <div data-testid="moon-icon">🌙</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
  AlertCircle: () => <div data-testid="alert-icon">⚠️</div>,
  CheckCircle: () => <div data-testid="check-icon">✅</div>,
  X: () => <div data-testid="x-icon">×</div>,
  FileText: () => <div data-testid="file-icon">📄</div>
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock URL.createObjectURL and related APIs
const mockCreateObjectURL = vi.fn(() => 'mock-url')
const mockRevokeObjectURL = vi.fn()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
})

// Mock FileReader
class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: (() => void) | null = null
  result: string | null = null

  readAsText(file: File) {
    setTimeout(() => {
      if (file.name.includes('invalid')) {
        this.onerror?.()
      } else if (file.size === 12) { // "invalid json" length
        // Return invalid JSON content that will cause parse error
        this.result = 'invalid json'
        this.onload?.({ target: { result: this.result } })
      } else {
        this.result = JSON.stringify({
          versions: [],
          options: { ignoreRules: [], transformRules: [], arrayStrategy: 'index', arrayKeyPath: undefined },
          selection: { mode: 'timeline', index: 0 },
          ui: { theme: 'light', hideUnchanged: false, searchQuery: '', rulesPanelExpanded: false },
          meta: { createdAt: '2023-01-01T00:00:00.000Z', modifiedAt: '2023-01-01T00:00:00.000Z', appVersion: '1.0.0' }
        })
        this.onload?.({ target: { result: this.result } })
      }
    }, 0)
  }
}

global.FileReader = MockFileReader as any

describe('SessionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppStore as any).mockReturnValue(mockStore)
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    localStorageMock.removeItem.mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Component Rendering', () => {
    it('should render session controls', () => {
      render(<SessionBar />)
      
      expect(screen.getByText('Session')).toBeInTheDocument()
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Import')).toBeInTheDocument()
      expect(screen.getByText('Load')).toBeInTheDocument()
    })

    it('should render theme toggle', () => {
      render(<SessionBar />)
      
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    })

    it('should render session info', () => {
      render(<SessionBar />)
      
      expect(screen.getByText('Versions')).toBeInTheDocument()
      expect(screen.getByText('0 JSON objects loaded')).toBeInTheDocument()
      expect(screen.getByText('Rules')).toBeInTheDocument()
      expect(screen.getByText('0 total rules (0 active)')).toBeInTheDocument()
      expect(screen.getByText('Theme')).toBeInTheDocument()
      expect(screen.getByText('light')).toBeInTheDocument() // lowercase as rendered by capitalize class
    })

    it('should hide localStorage buttons when not available', () => {
      // Mock localStorage as unavailable
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      render(<SessionBar />)
      
      expect(screen.queryByText('Save')).not.toBeInTheDocument()
      expect(screen.queryByText('Load')).not.toBeInTheDocument()
      expect(screen.getByText('Limited Storage')).toBeInTheDocument()
    })
  })

  describe('Theme Toggle', () => {
    it('should toggle theme when clicked', () => {
      render(<SessionBar />)
      
      const themeButton = screen.getByText('Dark').closest('button')
      fireEvent.click(themeButton!)
      
      expect(mockStore.setTheme).toHaveBeenCalledWith('dark')
    })

    it('should show correct theme icon and text for dark theme', () => {
      mockStore.ui.theme = 'dark'
      render(<SessionBar />)
      
      expect(screen.getByText('Light')).toBeInTheDocument()
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    })
  })

  describe('Session Persistence', () => {
    it('should save session to localStorage', () => {
      render(<SessionBar />)
      
      const saveButton = screen.getByText('Save').closest('button')
      fireEvent.click(saveButton!)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^json-diff-session-\d+$/),
        expect.stringContaining('"versions"')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'json-diff-session-latest',
        expect.stringContaining('"versions"')
      )
    })

    it('should load session from localStorage', () => {
      const mockSession: Session = {
        versions: [{ id: 'v1', label: 'Test', timestamp: '2023-01-01T00:00:00.000Z', source: { type: 'paste' }, payload: {} }],
        options: { ignoreRules: [], transformRules: [], arrayStrategy: 'index', arrayKeyPath: undefined },
        selection: { mode: 'timeline', index: 0 },
        ui: { theme: 'dark', hideUnchanged: true, searchQuery: 'test', rulesPanelExpanded: true },
        meta: { createdAt: '2023-01-01T00:00:00.000Z', modifiedAt: '2023-01-01T00:00:00.000Z', appVersion: '1.0.0' }
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))
      
      render(<SessionBar />)
      
      const loadButton = screen.getByText('Load').closest('button')
      fireEvent.click(loadButton!)
      
      expect(mockStore.reset).toHaveBeenCalled()
      expect(mockStore.addVersion).toHaveBeenCalledWith(mockSession.versions[0])
      expect(mockStore.setTheme).toHaveBeenCalledWith('dark')
      expect(mockStore.setHideUnchanged).toHaveBeenCalledWith(true)
    })

    it('should handle localStorage errors gracefully', () => {
      // Reset localStorage to be available first
      localStorageMock.setItem.mockImplementation((key) => {
        if (key !== 'localStorage-test') {
          throw new Error('Storage quota exceeded')
        }
      })
      
      render(<SessionBar />)
      
      const saveButton = screen.getByText('Save').closest('button')
      fireEvent.click(saveButton!)
      
      // Should show error notification
      expect(screen.getByText(/Failed to save session/)).toBeInTheDocument()
    })

    it('should handle missing session in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      render(<SessionBar />)
      
      const loadButton = screen.getByText('Load').closest('button')
      fireEvent.click(loadButton!)
      
      // Should show error notification
      expect(screen.getByText(/No saved session found/)).toBeInTheDocument()
    })
  })

  describe('Session Export/Import', () => {
    it('should export session as JSON file', () => {
      render(<SessionBar />)
      
      const exportButton = screen.getByText('Export').closest('button')
      fireEvent.click(exportButton!)
      
      // Should show success notification
      expect(screen.getByText('Session exported successfully')).toBeInTheDocument()
    })

    it('should import session from file', async () => {
      render(<SessionBar />)
      
      const importButton = screen.getByText('Import').closest('button')
      fireEvent.click(importButton!)
      
      // Find the hidden file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeTruthy()
      
      // Simulate file selection
      const file = new File(['{"versions":[]}'], 'session.json', { type: 'application/json' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(mockStore.reset).toHaveBeenCalled()
      })
    })

    it('should handle invalid session file', async () => {
      render(<SessionBar />)
      
      const importButton = screen.getByText('Import').closest('button')
      fireEvent.click(importButton!)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['invalid json'], 'valid-session.json', { type: 'application/json' }) // Remove 'invalid' from filename
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      // Wait for the FileReader to process and show error (it will try to parse invalid JSON)
      await waitFor(() => {
        expect(screen.getByText('Failed to import session - invalid file format')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('should handle file read errors', async () => {
      render(<SessionBar />)
      
      const importButton = screen.getByText('Import').closest('button')
      fireEvent.click(importButton!)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(['content'], 'invalid.json', { type: 'application/json' })
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to read session file/)).toBeInTheDocument()
      })
    })
  })

  describe('Notifications', () => {
    it('should show success notification', async () => {
      render(<SessionBar />)
      
      const exportButton = screen.getByText('Export').closest('button')
      fireEvent.click(exportButton!)
      
      expect(screen.getByText('Session exported successfully')).toBeInTheDocument()
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })

    it('should show error notification', async () => {
      localStorageMock.setItem.mockImplementation((key) => {
        if (key !== 'localStorage-test') {
          throw new Error('Storage error')
        }
      })
      
      render(<SessionBar />)
      
      const saveButton = screen.getByText('Save').closest('button')
      fireEvent.click(saveButton!)
      
      expect(screen.getByText(/Failed to save session/)).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
    })

    it('should auto-hide notifications after 3 seconds', async () => {
      vi.useFakeTimers()
      
      render(<SessionBar />)
      
      const exportButton = screen.getByText('Export').closest('button')
      fireEvent.click(exportButton!)
      
      expect(screen.getByText('Session exported successfully')).toBeInTheDocument()
      
      // Fast forward time to trigger setTimeout
      await vi.advanceTimersByTimeAsync(3100) // Slightly more than 3 seconds
      
      // The notification should be hidden after timeout
      expect(screen.queryByText('Session exported successfully')).not.toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('should allow manual dismissal of notifications', () => {
      render(<SessionBar />)
      
      const exportButton = screen.getByText('Export').closest('button')
      fireEvent.click(exportButton!)
      
      expect(screen.getByText('Session exported successfully')).toBeInTheDocument()
      
      const closeButton = screen.getByTestId('x-icon').closest('button')
      fireEvent.click(closeButton!)
      
      expect(screen.queryByText('Session exported successfully')).not.toBeInTheDocument()
    })
  })

  describe('Auto-save', () => {
    it('should auto-save to localStorage periodically', async () => {
      vi.useFakeTimers()
      
      mockStore.versions = [{ id: 'v1', label: 'Test', timestamp: '2023-01-01T00:00:00.000Z', source: { type: 'paste' }, payload: {} }]
      
      render(<SessionBar />)
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000)
      
      // Check if auto-save was called
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'json-diff-session-autosave',
        expect.stringContaining('"versions"')
      )
      
      vi.useRealTimers()
    })

    it('should not auto-save when no versions exist', async () => {
      vi.useFakeTimers()
      
      mockStore.versions = []
      
      render(<SessionBar />)
      
      vi.advanceTimersByTime(30000)
      
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        'json-diff-session-autosave',
        expect.any(String)
      )
      
      vi.useRealTimers()
    })

    it('should handle auto-save errors gracefully', async () => {
      vi.useFakeTimers()
      
      mockStore.versions = [{ id: 'v1', label: 'Test', timestamp: '2023-01-01T00:00:00.000Z', source: { type: 'paste' }, payload: {} }]
      localStorageMock.setItem.mockImplementation((key) => {
        if (key === 'json-diff-session-autosave') {
          throw new Error('Auto-save failed')
        }
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      render(<SessionBar />)
      
      vi.advanceTimersByTime(30000)
      
      // Check if console.warn was called for auto-save error
      expect(consoleSpy).toHaveBeenCalledWith('Auto-save failed:', expect.any(Error))
      
      consoleSpy.mockRestore()
      vi.useRealTimers()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      render(<SessionBar />)
      
      expect(screen.getByTitle('Save session to browser storage')).toBeInTheDocument()
      expect(screen.getByTitle('Export session as JSON file')).toBeInTheDocument()
      expect(screen.getByTitle('Import session from JSON file')).toBeInTheDocument()
      expect(screen.getByTitle('Load latest session from browser storage')).toBeInTheDocument()
      // Theme title changes based on current theme
      expect(screen.getByTitle(/Switch to .* theme/)).toBeInTheDocument()
    })

    it('should have proper file input attributes', () => {
      render(<SessionBar />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput.accept).toBe('.json')
      expect(fileInput.type).toBe('file')
    })
  })

  describe('Session Statistics', () => {
    it('should display correct version count', () => {
      mockStore.versions = [
        { id: 'v1', label: 'Test 1', timestamp: '2023-01-01T00:00:00.000Z', source: { type: 'paste' }, payload: {} },
        { id: 'v2', label: 'Test 2', timestamp: '2023-01-02T00:00:00.000Z', source: { type: 'file' }, payload: {} }
      ]
      
      render(<SessionBar />)
      
      expect(screen.getByText('2 JSON objects loaded')).toBeInTheDocument()
    })

    it('should display correct rule counts', () => {
      mockStore.options = {
        ignoreRules: [
          { id: 'i1', type: 'keyPath', pattern: 'test', enabled: true },
          { id: 'i2', type: 'regex', pattern: 'test', enabled: false }
        ],
        transformRules: [
          { id: 't1', type: 'lowercase', targetPath: 'test', enabled: true }
        ],
        arrayStrategy: 'index',
        arrayKeyPath: undefined
      }
      
      render(<SessionBar />)
      
      expect(screen.getByText('3 total rules (2 active)')).toBeInTheDocument()
    })
  })
})
