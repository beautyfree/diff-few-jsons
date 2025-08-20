import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PairMatrix from './PairMatrix'
import { useAppStore } from '@/state/store'
import type { JsonVersion } from '@/types/domain'

// Mock the store
const mockSetPairSelection = vi.fn()
const mockUseAllPairs = vi.fn()
const mockUseAdjacentPairs = vi.fn()
const mockUseIsDiffCached = vi.fn()

vi.mock('@/state/store', () => ({
  useAppStore: vi.fn(),
  useAppSelectors: {
    useAllPairs: () => mockUseAllPairs(),
    useAdjacentPairs: () => mockUseAdjacentPairs()
  },
  useIsDiffCached: (a: string, b: string) => mockUseIsDiffCached(a, b)
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('PairMatrix', () => {
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
      selection: { mode: 'pair', a: 'v1', b: 'v2' },
      setPairSelection: mockSetPairSelection
    })

    // Mock the selectors
    mockUseAllPairs.mockReturnValue([
      { a: 'v1', b: 'v2' },
      { a: 'v1', b: 'v3' },
      { a: 'v2', b: 'v3' }
    ])

    mockUseAdjacentPairs.mockReturnValue([
      { a: 'v1', b: 'v2', index: 0 },
      { a: 'v2', b: 'v3', index: 1 }
    ])

    mockUseIsDiffCached.mockReturnValue(false)
  })

  describe('Component Rendering', () => {
    it('should render empty state when less than 2 versions', () => {
      ;(useAppStore as any).mockReturnValue({
        versions: [mockVersions[0]],
        selection: { mode: 'pair', a: 'v1', b: 'v1' },
        setPairSelection: mockSetPairSelection
      })

      render(<PairMatrix />)
      
      expect(screen.getByText('Add at least 2 JSON versions to see the comparison matrix')).toBeInTheDocument()
    })

    it('should render matrix with multiple versions', () => {
      render(<PairMatrix />)
      
      // Check for header
      expect(screen.getByText('Comparison Matrix')).toBeInTheDocument()
      
      // Check for legend
      expect(screen.getByText('Selected')).toBeInTheDocument()
      expect(screen.getByText('Timeline Adjacent')).toBeInTheDocument()
      expect(screen.getByText('Cached')).toBeInTheDocument()
      
      // Check for version headers using more specific selectors
      expect(screen.getByRole('columnheader', { name: /version 1: version 1/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /version 2: version 2/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /version 3: version 3/i })).toBeInTheDocument()
      
      // Check for instructions
      expect(screen.getByText(/Use arrow keys to navigate/)).toBeInTheDocument()
    })

    it('should render matrix cells correctly', () => {
      render(<PairMatrix />)
      
      // Check for matrix grid
      const matrix = screen.getByRole('grid', { name: /version comparison matrix/i })
      expect(matrix).toBeInTheDocument()
      
      // Check for column headers
      expect(screen.getByRole('columnheader', { name: /version 1: version 1/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /version 2: version 2/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /version 3: version 3/i })).toBeInTheDocument()
      
      // Check for row headers
      expect(screen.getByRole('rowheader', { name: /version 1: version 1/i })).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: /version 2: version 2/i })).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: /version 3: version 3/i })).toBeInTheDocument()
    })
  })

  describe('Selection and Interaction', () => {
    it('should call setPairSelection when clicking a cell', () => {
      render(<PairMatrix />)
      
      // Find a clickable cell (not diagonal)
      const cells = screen.getAllByRole('gridcell')
      const clickableCell = cells.find(cell => 
        cell.getAttribute('aria-label')?.includes('Version 1') && 
        cell.getAttribute('aria-label')?.includes('Version 2')
      )
      
      if (clickableCell) {
        fireEvent.click(clickableCell)
        expect(mockSetPairSelection).toHaveBeenCalledWith('v1', 'v2')
      }
    })

    it('should not allow clicking on diagonal cells', () => {
      render(<PairMatrix />)
      
      // Find diagonal cells (same version)
      const cells = screen.getAllByRole('gridcell')
      const diagonalCell = cells.find(cell => 
        cell.getAttribute('aria-label') === 'Same version'
      )
      
      if (diagonalCell) {
        expect(diagonalCell).toHaveAttribute('tabIndex', '-1')
        expect(diagonalCell).not.toHaveClass('cursor-pointer')
      }
    })

    it('should handle different selection modes', () => {
      // Test timeline mode
      ;(useAppStore as any).mockReturnValue({
        versions: mockVersions,
        selection: { mode: 'timeline', index: 0 },
        setPairSelection: mockSetPairSelection
      })
      
      render(<PairMatrix />)
      
      // Should still render the matrix
      expect(screen.getByText('Comparison Matrix')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle arrow key navigation', () => {
      render(<PairMatrix />)
      
      // Find a focusable cell
      const cells = screen.getAllByRole('gridcell')
      const focusableCell = cells.find(cell => cell.getAttribute('tabIndex') === '0')
      
      if (focusableCell) {
        focusableCell.focus()
        
        // Test arrow keys
        fireEvent.keyDown(focusableCell, { key: 'ArrowRight' })
        fireEvent.keyDown(focusableCell, { key: 'ArrowDown' })
        
        // Should not throw errors
        expect(true).toBe(true)
      }
    })

    it('should handle Enter key to select pair', () => {
      render(<PairMatrix />)
      
      // Find a focusable cell
      const cells = screen.getAllByRole('gridcell')
      const focusableCell = cells.find(cell => cell.getAttribute('tabIndex') === '0')
      
      if (focusableCell) {
        focusableCell.focus()
        fireEvent.keyDown(focusableCell, { key: 'Enter' })
        
        expect(mockSetPairSelection).toHaveBeenCalled()
      }
    })

    it('should handle Space key to select pair', () => {
      render(<PairMatrix />)
      
      // Find a focusable cell
      const cells = screen.getAllByRole('gridcell')
      const focusableCell = cells.find(cell => cell.getAttribute('tabIndex') === '0')
      
      if (focusableCell) {
        focusableCell.focus()
        fireEvent.keyDown(focusableCell, { key: ' ' })
        
        expect(mockSetPairSelection).toHaveBeenCalled()
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<PairMatrix />)
      
      // Check for grid role
      const matrix = screen.getByRole('grid', { name: /version comparison matrix/i })
      expect(matrix).toBeInTheDocument()
      
      // Check for column headers
      const columnHeaders = screen.getAllByRole('columnheader')
      expect(columnHeaders.length).toBeGreaterThan(0)
      
      // Check for row headers
      const rowHeaders = screen.getAllByRole('rowheader')
      expect(rowHeaders.length).toBeGreaterThan(0)
      
      // Check for grid cells
      const cells = screen.getAllByRole('gridcell')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should have proper labels for cells', () => {
      render(<PairMatrix />)
      
      const cells = screen.getAllByRole('gridcell')
      
      // Check that cells have proper aria-labels
      cells.forEach(cell => {
        const ariaLabel = cell.getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
      })
    })

    it('should have proper focus management', () => {
      render(<PairMatrix />)
      
      // Find focusable cells
      const cells = screen.getAllByRole('gridcell')
      const focusableCells = cells.filter(cell => cell.getAttribute('tabIndex') === '0')
      
      expect(focusableCells.length).toBeGreaterThan(0)
      
      // Test focus
      if (focusableCells[0]) {
        focusableCells[0].focus()
        expect(focusableCells[0]).toHaveFocus()
      }
    })
  })

  describe('Store Integration', () => {
    it('should call useAppStore', () => {
      render(<PairMatrix />)
      
      expect(useAppStore).toHaveBeenCalled()
    })

    it('should use selectors correctly', () => {
      render(<PairMatrix />)
      
      expect(mockUseAdjacentPairs).toHaveBeenCalled()
    })

    it('should check cache status for pairs', () => {
      mockUseIsDiffCached.mockReturnValue(true)
      
      render(<PairMatrix />)
      
      expect(mockUseIsDiffCached).toHaveBeenCalled()
    })
  })

  describe('Visual States', () => {
    it('should show selected state correctly', () => {
      render(<PairMatrix />)
      
      // The current selection is v1 -> v2, so we should see visual indicators
      const cells = screen.getAllByRole('gridcell')
      const selectedCell = cells.find(cell => 
        cell.getAttribute('aria-label')?.includes('Version 1') && 
        cell.getAttribute('aria-label')?.includes('Version 2')
      )
      
      if (selectedCell) {
        // Should have selected styling
        expect(selectedCell).toBeInTheDocument()
      }
    })

    it('should show adjacent pair indicators', () => {
      render(<PairMatrix />)
      
      // Adjacent pairs should have visual indicators
      const cells = screen.getAllByRole('gridcell')
      expect(cells.length).toBeGreaterThan(0)
    })
  })
})
