import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}))

// Mock the store
vi.mock('@/state/store', () => ({
  useAppStore: vi.fn(() => ({
    versions: [],
    selection: { mode: 'timeline', index: 0 },
    options: { ignoreRules: [], transformRules: [], arrayStrategy: 'index' },
    setSelection: vi.fn(),
    setPairSelection: vi.fn(),
    setTimelineIndex: vi.fn(),
    setHideUnchanged: vi.fn(),
    setSearchQuery: vi.fn(),
    setTheme: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn()
  })),
  useAppSelectors: {
    useCurrentDiff: vi.fn(() => null),
    useAdjacentPairs: vi.fn(() => []),
    useAllPairs: vi.fn(() => []),
    useIsDiffCached: vi.fn(() => false)
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  X: () => <span data-testid="x-icon">X</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">ChevronRight</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
  Link: () => <span data-testid="link-icon">Link</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  Save: () => <span data-testid="save-icon">Save</span>,
  Download: () => <span data-testid="download-icon">Download</span>,
  Moon: () => <span data-testid="moon-icon">Moon</span>,
  Sun: () => <span data-testid="sun-icon">Sun</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  SkipBack: () => <span data-testid="skip-back-icon">SkipBack</span>,
  SkipForward: () => <span data-testid="skip-forward-icon">SkipForward</span>
}))

// Mock keyboard navigation hook
vi.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn()
}))

// Import components after mocks
import DiffTreeView from '@/components/DiffTreeView'
import PairMatrix from '@/components/PairMatrix'
import SearchBar from '@/components/SearchBar'
import RulesPanel from '@/components/RulesPanel'
import SessionBar from '@/components/SessionBar'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  describe('DiffTreeView Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<DiffTreeView />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA roles and labels', () => {
      render(<DiffTreeView />)
      
      // Should have a region role with proper label
      expect(screen.getByRole('region', { name: /json diff tree view/i })).toBeInTheDocument()
      
      // Should have a live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have accessible form controls', () => {
      render(<DiffTreeView />)
      
      // Should have accessible checkbox
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-describedby')
    })
  })

  describe('PairMatrix Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<PairMatrix />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper grid structure', () => {
      // Mock some versions for the matrix to render
      const mockUseAppStore = vi.mocked(require('@/state/store').useAppStore)
      mockUseAppStore.mockReturnValue({
        versions: [
          { id: 'v1', label: 'Version 1', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' }, payload: {} },
          { id: 'v2', label: 'Version 2', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' }, payload: {} }
        ],
        selection: { mode: 'timeline', index: 0 },
        setPairSelection: vi.fn(),
        setSelection: vi.fn(),
        setTimelineIndex: vi.fn(),
        setHideUnchanged: vi.fn(),
        setSearchQuery: vi.fn(),
        setTheme: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn()
      })

      render(<PairMatrix />)
      
      // Should have grid role
      expect(screen.getByRole('grid')).toBeInTheDocument()
      
      // Should have live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  describe('SearchBar Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<SearchBar />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper search functionality', () => {
      render(<SearchBar />)
      
      // Should have search region
      expect(screen.getByRole('search')).toBeInTheDocument()
      
      // Should have combobox input
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      
      // Should have live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument()
      
      // Should have accessible instructions
      expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument()
    })

    it('should have proper ARIA attributes on input', () => {
      render(<SearchBar />)
      
      const input = screen.getByRole('combobox')
      expect(input).toHaveAttribute('aria-describedby', 'search-instructions')
      expect(input).toHaveAttribute('aria-expanded')
      expect(input).toHaveAttribute('autoComplete', 'off')
    })
  })

  describe('RulesPanel Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<RulesPanel />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible form controls', () => {
      const mockUseAppStore = vi.mocked(require('@/state/store').useAppStore)
      mockUseAppStore.mockReturnValue({
        versions: [],
        selection: { mode: 'timeline', index: 0 },
        options: {
          ignoreRules: [
            { id: 'rule1', type: 'keyPath', pattern: 'test' }
          ],
          transformRules: [],
          arrayStrategy: 'index'
        },
        setSelection: vi.fn(),
        setPairSelection: vi.fn(),
        setTimelineIndex: vi.fn(),
        setHideUnchanged: vi.fn(),
        setSearchQuery: vi.fn(),
        setTheme: vi.fn(),
        addNotification: vi.fn(),
        removeNotification: vi.fn(),
        addIgnoreRule: vi.fn(),
        removeIgnoreRule: vi.fn(),
        updateIgnoreRule: vi.fn(),
        addTransformRule: vi.fn(),
        removeTransformRule: vi.fn(),
        updateTransformRule: vi.fn(),
        clearCache: vi.fn()
      })

      render(<RulesPanel />)
      
      // Should have buttons with proper titles
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Each button should have either title or aria-label
        expect(
          button.hasAttribute('title') || 
          button.hasAttribute('aria-label') ||
          button.textContent?.trim()
        ).toBeTruthy()
      })
    })
  })

  describe('SessionBar Accessibility', () => {
    it('should not have accessibility violations', async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      })

      const { container } = render(<SessionBar />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible buttons', () => {
      render(<SessionBar />)
      
      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(
          button.hasAttribute('aria-label') ||
          button.hasAttribute('title') ||
          button.textContent?.trim()
        ).toBeTruthy()
      })
    })

    it('should have proper theme toggle accessibility', () => {
      render(<SessionBar />)
      
      // Theme toggle should have proper attributes
      const themeButton = screen.getByRole('button', { name: /switch to.*theme/i })
      expect(themeButton).toHaveAttribute('title')
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('should use semantic colors with sufficient contrast', () => {
      // This test ensures we're using proper semantic colors
      // The actual contrast testing would be done by axe-core
      render(<DiffTreeView />)
      
      // Check that we have semantic color indicators in the legend
      expect(screen.getByText('Added')).toBeInTheDocument()
      expect(screen.getByText('Removed')).toBeInTheDocument()
      expect(screen.getByText('Modified')).toBeInTheDocument()
      expect(screen.getByText('Unchanged')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should have proper focus management', () => {
      render(<SearchBar />)
      
      const input = screen.getByRole('combobox')
      input.focus()
      expect(input).toHaveFocus()
      
      // Should be able to tab to other focusable elements
      expect(input).toHaveAttribute('tabIndex')
    })

    it('should provide keyboard shortcuts information', () => {
      render(<DiffTreeView />)
      
      // Should show keyboard shortcuts in help text
      expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument()
      expect(screen.getByText(/ctrl.*cmd.*e.*expand/i)).toBeInTheDocument()
      expect(screen.getByText(/ctrl.*cmd.*c.*collapse/i)).toBeInTheDocument()
    })
  })
})
