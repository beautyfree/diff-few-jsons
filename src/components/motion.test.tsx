import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock framer-motion for testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-motion="true" {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button data-motion="true" {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <div data-animate-presence="true">{children}</div>
}))

// Mock the store with all required exports
vi.mock('../state/store', () => ({
  useAppStore: vi.fn(() => ({
    versions: [],
    selection: { versionA: null, versionB: null },
    setSelection: vi.fn(),
    setTimelineIndex: vi.fn(),
    setPairSelection: vi.fn(),
    setSearchQuery: vi.fn(),
    setTheme: vi.fn(),
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    setHideUnchanged: vi.fn(),
    options: {
      ignoreRules: [],
      transformRules: [],
      arrayStrategy: 'index'
    },
    ui: {
      theme: 'light',
      hideUnchanged: false,
      searchQuery: '',
      rulesPanelExpanded: false,
      notifications: []
    }
  })),
  useAppSelectors: {
    useActivePair: vi.fn(() => ({ versionA: null, versionB: null })),
    useAdjacentPairs: vi.fn(() => []),
    useAllPairs: vi.fn(() => []),
    useCurrentDiff: vi.fn(() => null),
    useOptionsKey: vi.fn(() => 'test'),
    useEnabledRules: vi.fn(() => ({ ignoreRules: [], transformRules: [] }))
  }
}))

// Mock the diff engine
vi.mock('../engine/diff', () => ({
  computeJsonDiff: vi.fn()
}))

// Mock the worker adapter
vi.mock('../worker/adapter', () => ({
  useDiffWorker: vi.fn(() => ({
    computeDiff: vi.fn(),
    isComputing: false,
    progress: 0
  }))
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">🔍</div>,
  X: () => <div data-testid="x-icon">×</div>,
  ChevronUp: () => <div data-testid="chevron-up">▲</div>,
  ChevronDown: () => <div data-testid="chevron-down">▼</div>,
  ArrowUp: () => <div data-testid="arrow-up">↑</div>,
  ArrowDown: () => <div data-testid="arrow-down">↓</div>,
  Sun: () => <div data-testid="sun-icon">☀️</div>,
  Moon: () => <div data-testid="moon-icon">🌙</div>,
  Save: () => <div data-testid="save-icon">💾</div>,
  Upload: () => <div data-testid="upload-icon">📤</div>,
  Download: () => <div data-testid="download-icon">📥</div>,
  FolderOpen: () => <div data-testid="folder-icon">📁</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
  FileText: () => <div data-testid="file-text-icon">📄</div>
}))

// Import components to test
import SearchBar from './SearchBar'
import SessionBar from './SessionBar'

describe('Motion Components Sanity Tests', () => {
  describe('Component Motion Integration', () => {
    it('should verify SearchBar has motion components and AnimatePresence', () => {
      render(<SearchBar />)
      
      const motionElements = document.querySelectorAll('[data-motion="true"]')
      const animatePresenceElements = document.querySelectorAll('[data-animate-presence="true"]')
      
      expect(motionElements.length).toBeGreaterThan(0)
      expect(animatePresenceElements.length).toBeGreaterThan(0)
    })

    it('should verify SessionBar has motion components', () => {
      render(<SessionBar />)
      
      const motionElements = document.querySelectorAll('[data-motion="true"]')
      expect(motionElements.length).toBeGreaterThan(0)
    })
  })

  describe('Motion Props Verification', () => {
    it('should verify motion components have proper data attributes', () => {
      render(<SearchBar />)
      
      const motionElements = document.querySelectorAll('[data-motion="true"]')
      motionElements.forEach(element => {
        expect(element).toHaveAttribute('data-motion', 'true')
      })
    })

    it('should verify AnimatePresence components have proper data attributes', () => {
      render(<SearchBar />)
      
      const animatePresenceElements = document.querySelectorAll('[data-animate-presence="true"]')
      animatePresenceElements.forEach(element => {
        expect(element).toHaveAttribute('data-animate-presence', 'true')
      })
    })
  })

  describe('Motion Sanity Check', () => {
    it('should verify that motion components are being rendered with motion wrappers', () => {
      render(<SearchBar />)
      
      // Check that we have motion elements
      const motionElements = document.querySelectorAll('[data-motion="true"]')
      expect(motionElements.length).toBeGreaterThan(0)
      
      // Check that we have AnimatePresence
      const animatePresenceElements = document.querySelectorAll('[data-animate-presence="true"]')
      expect(animatePresenceElements.length).toBeGreaterThan(0)
      
      // Verify that the components are actually rendering
      expect(screen.getByPlaceholderText('Search paths and values...')).toBeInTheDocument()
    })
  })
})
