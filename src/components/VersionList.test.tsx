import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import VersionList from './VersionList'
import { useAppStore } from '@/state/store'
import type { JsonVersion } from '@/types/domain'

// Mock the store
vi.mock('@/state/store', () => ({
  useAppStore: vi.fn()
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  Reorder: {
    Group: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    Item: ({ children, ...props }: any) => <li {...props}>{children}</li>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('VersionList', () => {
  const mockUpdateVersion = vi.fn()
  const mockRemoveVersion = vi.fn()
  const mockReorderVersions = vi.fn()

  const mockVersions: JsonVersion[] = [
    {
      id: '1',
      label: 'First Version',
      timestamp: '2024-01-01T10:00:00.000Z',
      source: { type: 'paste', ref: 'pasted content' },
      payload: { name: 'John', age: 30 }
    },
    {
      id: '2',
      label: 'Second Version',
      timestamp: '2024-01-01T11:00:00.000Z',
      source: { type: 'file', ref: 'test.json' },
      payload: { name: 'Jane', age: 25 }
    },
    {
      id: '3',
      label: 'Third Version',
      timestamp: '2024-01-01T12:00:00.000Z',
      source: { type: 'url', ref: 'https://example.com/api/data.json' },
      payload: { name: 'Bob', age: 35 }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppStore as any).mockReturnValue({
      versions: mockVersions,
      updateVersion: mockUpdateVersion,
      removeVersion: mockRemoveVersion,
      reorderVersions: mockReorderVersions
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component rendering', () => {
    it('should render empty state when no versions', () => {
      ;(useAppStore as any).mockReturnValue({
        versions: [],
        updateVersion: mockUpdateVersion,
        removeVersion: mockRemoveVersion,
        reorderVersions: mockReorderVersions
      })

      render(<VersionList />)

      expect(screen.getByText('No versions yet')).toBeInTheDocument()
      expect(screen.getByText('Upload some JSON to get started')).toBeInTheDocument()
    })

    it('should render versions when they exist', () => {
      render(<VersionList />)

      expect(screen.getByText('JSON Versions')).toBeInTheDocument()
      expect(screen.getByText('3 versions')).toBeInTheDocument()

      // Check that all version labels are displayed
      expect(screen.getByText('First Version')).toBeInTheDocument()
      expect(screen.getByText('Second Version')).toBeInTheDocument()
      expect(screen.getByText('Third Version')).toBeInTheDocument()
    })

    it('should show source information', () => {
      render(<VersionList />)

      expect(screen.getByText('Pasted content')).toBeInTheDocument()
      expect(screen.getByText('File: test.json')).toBeInTheDocument()
      expect(screen.getByText('URL: https://example.com/api/data.json')).toBeInTheDocument()
    })

    it('should show JSON preview for each version', () => {
      render(<VersionList />)

      // Check that JSON previews are shown
      const previews = screen.getAllByText(/{"name":/)
      expect(previews).toHaveLength(3)
    })

    it('should show edit and remove buttons for each version', () => {
      render(<VersionList />)

      const editButtons = screen.getAllByTitle('Edit version')
      const removeButtons = screen.getAllByTitle('Remove version')

      expect(editButtons).toHaveLength(3)
      expect(removeButtons).toHaveLength(3)
    })

    it('should handle single version correctly', () => {
      ;(useAppStore as any).mockReturnValue({
        versions: [mockVersions[0]],
        updateVersion: mockUpdateVersion,
        removeVersion: mockRemoveVersion,
        reorderVersions: mockReorderVersions
      })

      render(<VersionList />)

      expect(screen.getByText('1 version')).toBeInTheDocument()
      expect(screen.getByText('First Version')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and titles', () => {
      render(<VersionList />)

      const editButtons = screen.getAllByTitle('Edit version')
      const removeButtons = screen.getAllByTitle('Remove version')

      expect(editButtons).toHaveLength(3)
      expect(removeButtons).toHaveLength(3)

      editButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Edit version')
      })

      removeButtons.forEach(button => {
        expect(button).toHaveAttribute('title', 'Remove version')
      })
    })
  })

  describe('Store integration', () => {
    it('should use store for version management', () => {
      render(<VersionList />)
      
      // Verify that useAppStore was called
      expect(useAppStore).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    it('should handle very long labels', () => {
      const longLabelVersion = {
        ...mockVersions[0],
        label: 'This is a very long label that should be truncated when it exceeds the available space in the UI'
      }

      ;(useAppStore as any).mockReturnValue({
        versions: [longLabelVersion],
        updateVersion: mockUpdateVersion,
        removeVersion: mockRemoveVersion,
        reorderVersions: mockReorderVersions
      })

      render(<VersionList />)

      expect(screen.getByText(longLabelVersion.label)).toBeInTheDocument()
    })

    it('should handle very long JSON payloads', () => {
      const largePayloadVersion = {
        ...mockVersions[0],
        payload: {
          data: 'x'.repeat(200) // Very long string
        }
      }

      ;(useAppStore as any).mockReturnValue({
        versions: [largePayloadVersion],
        updateVersion: mockUpdateVersion,
        removeVersion: mockRemoveVersion,
        reorderVersions: mockReorderVersions
      })

      render(<VersionList />)

      // Should show truncated preview
      const preview = screen.getByText(/{"data":"x{50}/)
      expect(preview).toBeInTheDocument()
      expect(preview.textContent).toContain('...')
    })
  })
})
