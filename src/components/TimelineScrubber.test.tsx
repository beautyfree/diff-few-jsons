import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TimelineScrubber from './TimelineScrubber'
import { useAppStore } from '@/state/store'
import type { JsonVersion } from '@/types/domain'

// Mock the store
const mockUseActivePair = vi.fn()
vi.mock('@/state/store', () => ({
  useAppStore: vi.fn(),
  useAppSelectors: {
    useActivePair: () => mockUseActivePair()
  }
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('TimelineScrubber', () => {
  const mockSetTimelineIndex = vi.fn()
  const mockVersions: JsonVersion[] = [
    {
      id: 'v1',
      label: 'Version 1',
      timestamp: '2023-01-01T10:00:00Z',
      source: { type: 'paste' },
      payload: { data: 'first' }
    },
    {
      id: 'v2',
      label: 'Version 2', 
      timestamp: '2023-01-01T11:00:00Z',
      source: { type: 'file', ref: 'data.json' },
      payload: { data: 'second' }
    },
    {
      id: 'v3',
      label: 'Version 3',
      timestamp: '2023-01-01T12:00:00Z',
      source: { type: 'url', ref: 'https://api.example.com/data' },
      payload: { data: 'third' }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the store with default values
    ;(useAppStore as any).mockReturnValue({
      versions: mockVersions,
      selection: { mode: 'timeline', index: 0 },
      setTimelineIndex: mockSetTimelineIndex
    })

    // Mock the selector
    mockUseActivePair.mockReturnValue({
      a: 'v1',
      b: 'v2'
    })

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Component Rendering', () => {
    it('should render empty state when less than 2 versions', () => {
      ;(useAppStore as any).mockReturnValue({
        versions: [mockVersions[0]],
        selection: { mode: 'timeline', index: 0 },
        setTimelineIndex: mockSetTimelineIndex
      })

      render(<TimelineScrubber />)
      
      expect(screen.getByText('Add at least 2 JSON versions to see the timeline')).toBeInTheDocument()
    })

    it('should render timeline with multiple versions', () => {
      render(<TimelineScrubber />)
      
      // Check for play button
      expect(screen.getByLabelText(/play timeline/i)).toBeInTheDocument()
      
      // Check for version counter
      expect(screen.getByText('1 of 3')).toBeInTheDocument()
      
      // Check for speed control
      expect(screen.getByLabelText(/speed/i)).toBeInTheDocument()
      
      // Check for keyboard shortcuts help
      expect(screen.getByText(/use ← → arrow keys/i)).toBeInTheDocument()
    })

    it('should render version information', () => {
      render(<TimelineScrubber />)
      
      // Should show version labels
      expect(screen.getByText('Version 1')).toBeInTheDocument()
      expect(screen.getByText('Version 2')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should call useAppStore', () => {
      render(<TimelineScrubber />)
      
      expect(useAppStore).toHaveBeenCalled()
    })

    it('should handle different selection modes', () => {
      // Test pair selection mode
      ;(useAppStore as any).mockReturnValue({
        versions: mockVersions,
        selection: { mode: 'pair', a: 'v1', b: 'v3' },
        setTimelineIndex: mockSetTimelineIndex
      })
      
      render(<TimelineScrubber />)
      
      // Should still render but with index 0 (fallback for pair mode)
      expect(screen.getByText('1 of 3')).toBeInTheDocument()
    })
  })

  describe('Basic Interactions', () => {
    it('should render play button', () => {
      render(<TimelineScrubber />)
      
      const playButton = screen.getByLabelText(/play timeline/i)
      expect(playButton).toBeInTheDocument()
    })

    it('should render speed control', () => {
      render(<TimelineScrubber />)
      
      const speedSelect = screen.getByLabelText(/speed/i)
      expect(speedSelect).toBeInTheDocument()
      expect(speedSelect).toHaveValue('1000')
    })
  })
})
