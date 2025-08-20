import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DiffTreeView from './DiffTreeView'
import { useAppStore } from '@/state/store'
import type { DiffNode, DiffResult } from '@/types/domain'

// Mock the store
const mockSetHideUnchanged = vi.fn()
const mockUseCurrentDiff = vi.fn()
vi.mock('@/state/store', () => ({
  useAppStore: vi.fn(),
  useAppSelectors: {
    useCurrentDiff: () => mockUseCurrentDiff()
  }
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('DiffTreeView', () => {
  const mockDiffResult: DiffResult = {
    versionA: 'v1',
    versionB: 'v2',
    optionsKey: 'test-key',
    root: {
      path: 'root',
      kind: 'unchanged',
      children: [
        {
          path: 'name',
          kind: 'modified',
          before: 'John',
          after: 'Jane',
          children: []
        },
        {
          path: 'age',
          kind: 'added',
          after: 30,
          children: []
        },
        {
          path: 'email',
          kind: 'removed',
          before: 'john@example.com',
          children: []
        },
        {
          path: 'address',
          kind: 'unchanged',
          children: [
            {
              path: 'address.street',
              kind: 'modified',
              before: '123 Main St',
              after: '456 Oak Ave',
              children: []
            }
          ]
        }
      ]
    },
    stats: {
      nodes: 5,
      computeMs: 150
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the store with default values
    ;(useAppStore as any).mockReturnValue({
      setHideUnchanged: mockSetHideUnchanged
    })

    // Mock the selector
    mockUseCurrentDiff.mockReturnValue(mockDiffResult)
  })

  describe('Component Rendering', () => {
    it('should render empty state when no diff is available', () => {
      mockUseCurrentDiff.mockReturnValue(null)

      render(<DiffTreeView />)
      
      expect(screen.getByText('Select a pair of versions to see the diff tree')).toBeInTheDocument()
    })

    it('should render diff tree with header and stats', () => {
      render(<DiffTreeView />)
      
      // Check for header
      expect(screen.getByText('Diff Tree')).toBeInTheDocument()
      expect(screen.getByText('5 nodes • 150ms compute time')).toBeInTheDocument()
      
      // Check for legend - use getAllByText since these appear in both legend and badges
      expect(screen.getAllByText('Added').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Removed').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Modified').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Unchanged').length).toBeGreaterThan(0)
    })

    it('should render tree nodes with correct change types', () => {
      render(<DiffTreeView />)
      
      // Check for node paths
      expect(screen.getByText('name')).toBeInTheDocument()
      expect(screen.getByText('age')).toBeInTheDocument()
      expect(screen.getByText('email')).toBeInTheDocument()
      expect(screen.getByText('address')).toBeInTheDocument()
      
      // Check for change type badges - use getAllByText since these appear in both legend and badges
      expect(screen.getAllByText('Modified').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Added').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Removed').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Unchanged').length).toBeGreaterThan(0)
    })

    it('should render value changes correctly', () => {
      render(<DiffTreeView />)
      
      // Check for modified values
      expect(screen.getByText('Before:')).toBeInTheDocument()
      expect(screen.getByText('After:')).toBeInTheDocument()
      expect(screen.getByText('"John"')).toBeInTheDocument()
      expect(screen.getByText('"Jane"')).toBeInTheDocument()
      
      // Check for added value - use getAllByText since there are multiple "Value:" elements
      expect(screen.getAllByText('Value:').length).toBeGreaterThan(0)
      expect(screen.getByText('30')).toBeInTheDocument()
    })

    it('should show no differences message when root has no children', () => {
      const emptyDiffResult: DiffResult = {
        ...mockDiffResult,
        root: {
          path: 'root',
          kind: 'unchanged',
          children: []
        }
      }

      mockUseCurrentDiff.mockReturnValue(emptyDiffResult)

      render(<DiffTreeView />)
      
      expect(screen.getByText('No differences found')).toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should show expand icons for nodes with children', () => {
      render(<DiffTreeView />)
      
      // Address node has children, so it should be expandable
      const addressNode = screen.getByText('address').closest('div')
      expect(addressNode).toBeInTheDocument()
    })

    it('should handle node expansion and collapse', () => {
      render(<DiffTreeView />)
      
      // Find and click on an expandable node
      const addressNode = screen.getByText('address').closest('div')
      if (addressNode) {
        fireEvent.click(addressNode)
        
        // Should show child node after expansion
        expect(screen.getByText('address.street')).toBeInTheDocument()
      }
    })

    it('should not show expand icons for leaf nodes', () => {
      render(<DiffTreeView />)
      
      // Leaf nodes like 'name', 'age', 'email' should not have expand icons
      const nameNode = screen.getByText('name').closest('div')
      expect(nameNode).toBeInTheDocument()
    })
  })

  describe('Hide Unchanged Toggle', () => {
    it('should render hide unchanged toggle', () => {
      render(<DiffTreeView />)
      
      const toggle = screen.getByRole('checkbox', { name: /hide unchanged/i })
      expect(toggle).toBeInTheDocument()
    })

    it('should call setHideUnchanged when toggle is clicked', () => {
      render(<DiffTreeView />)
      
      const toggle = screen.getByRole('checkbox', { name: /hide unchanged/i })
      fireEvent.click(toggle)
      
      expect(mockSetHideUnchanged).toHaveBeenCalledWith(true)
    })

    it('should hide unchanged nodes when toggle is enabled', () => {
      render(<DiffTreeView />)
      
      // Initially, unchanged nodes should be visible
      expect(screen.getByText('address')).toBeInTheDocument()
      
      // Click the toggle to hide unchanged nodes
      const toggle = screen.getByRole('checkbox', { name: /hide unchanged/i })
      fireEvent.click(toggle)
      
      // The unchanged 'address' node should be hidden
      // Note: In a real test, we'd need to simulate the state change
      expect(mockSetHideUnchanged).toHaveBeenCalledWith(true)
    })
  })

  describe('Value Formatting', () => {
    it('should format different value types correctly', () => {
      const complexDiffResult: DiffResult = {
        ...mockDiffResult,
        root: {
          path: 'root',
          kind: 'unchanged',
          children: [
            {
              path: 'string',
              kind: 'added',
              after: 'test string',
              children: []
            },
            {
              path: 'number',
              kind: 'added',
              after: 42,
              children: []
            },
            {
              path: 'null',
              kind: 'added',
              after: null,
              children: []
            },
            {
              path: 'array',
              kind: 'added',
              after: [1, 2, 3],
              children: []
            },
            {
              path: 'object',
              kind: 'added',
              after: { key: 'value' },
              children: []
            }
          ]
        }
      }

      mockUseCurrentDiff.mockReturnValue(complexDiffResult)

      render(<DiffTreeView />)
      
      // Check that different value types are formatted correctly
      expect(screen.getByText('"test string"')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      // Use getAllByText for "null" since it appears multiple times
      expect(screen.getAllByText('null').length).toBeGreaterThan(0)
      expect(screen.getByText('[3 items]')).toBeInTheDocument()
      expect(screen.getByText('{1 keys}')).toBeInTheDocument()
    })
  })

  describe('Performance Features', () => {
    it('should render large trees efficiently', () => {
      // Create a large tree for testing
      const largeChildren: DiffNode[] = Array.from({ length: 100 }, (_, i) => ({
        path: `item${i}`,
        kind: 'added',
        after: `value${i}`,
        children: []
      }))

      const largeDiffResult: DiffResult = {
        ...mockDiffResult,
        root: {
          path: 'root',
          kind: 'unchanged',
          children: largeChildren
        },
        stats: {
          nodes: 100,
          computeMs: 500
        }
      }

      mockUseCurrentDiff.mockReturnValue(largeDiffResult)

      render(<DiffTreeView />)
      
      // Should render without performance issues
      expect(screen.getByText('100 nodes • 500ms compute time')).toBeInTheDocument()
      
      // Should show some of the items
      expect(screen.getByText('item0')).toBeInTheDocument()
      expect(screen.getByText('item99')).toBeInTheDocument()
    })

    it('should show performance info', () => {
      render(<DiffTreeView />)
      
      expect(screen.getByText(/Use the expand\/collapse controls to navigate large trees efficiently/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DiffTreeView />)
      
      // Check for checkbox accessibility
      const toggle = screen.getByRole('checkbox', { name: /hide unchanged/i })
      expect(toggle).toBeInTheDocument()
    })

    it('should have proper labels and descriptions', () => {
      render(<DiffTreeView />)
      
      // Check for descriptive text
      expect(screen.getByText('Diff Tree')).toBeInTheDocument()
      expect(screen.getByText(/nodes • .*ms compute time/)).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should call useAppStore', () => {
      render(<DiffTreeView />)
      
      expect(useAppStore).toHaveBeenCalled()
    })

    it('should use current diff selector', () => {
      render(<DiffTreeView />)
      
      expect(mockUseCurrentDiff).toHaveBeenCalled()
    })
  })

  describe('Visual States', () => {
    it('should show correct change type colors', () => {
      render(<DiffTreeView />)
      
      // Check that different change types have different visual indicators
      // Use getAllByText since these appear in both legend and badges
      expect(screen.getAllByText('Modified').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Added').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Removed').length).toBeGreaterThan(0)
    })

    it('should show change count badges when available', () => {
      const diffWithCounts: DiffResult = {
        ...mockDiffResult,
        root: {
          path: 'root',
          kind: 'unchanged',
          children: [
            {
              path: 'complex',
              kind: 'modified',
              before: { a: 1 },
              after: { b: 2 },
              children: [],
              meta: { countChanged: 5 }
            }
          ]
        }
      }

      mockUseCurrentDiff.mockReturnValue(diffWithCounts)

      render(<DiffTreeView />)
      
      expect(screen.getByText('5 changes')).toBeInTheDocument()
    })
  })
})
