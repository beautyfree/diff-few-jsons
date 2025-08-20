import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import UploadPanel from './UploadPanel'
import { useAppStore } from '@/state/store'

// Mock the store
vi.mock('@/state/store', () => ({
  useAppStore: vi.fn()
}))

// Mock fetch for URL tests
global.fetch = vi.fn()

describe('UploadPanel', () => {
  const mockAddVersion = vi.fn()
  const mockVersions: any[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAppStore as any).mockReturnValue({
      addVersion: mockAddVersion,
      versions: mockVersions
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component rendering', () => {
    it('should render all main sections', () => {
      render(<UploadPanel />)

      // Check main sections are present
      expect(screen.getByText('Upload JSON')).toBeInTheDocument()
      expect(screen.getByText('Paste JSON')).toBeInTheDocument()
      expect(screen.getByText('Upload Files')).toBeInTheDocument()
      expect(screen.getByText('Fetch from URL')).toBeInTheDocument()
    })

    it('should show version count', () => {
      render(<UploadPanel />)
      expect(screen.getByText('0 versions loaded')).toBeInTheDocument()
    })

    it('should show version count with content', () => {
      const versionsWithContent = [
        { id: '1', label: 'Test', timestamp: '2024-01-01', source: { type: 'paste', ref: 'test' }, payload: {} }
      ]

      ;(useAppStore as any).mockReturnValue({
        addVersion: mockAddVersion,
        versions: versionsWithContent
      })

      render(<UploadPanel />)
      expect(screen.getByText('1 version loaded')).toBeInTheDocument()
    })

    it('should have all required input elements', () => {
      render(<UploadPanel />)

      // Check for textarea
      expect(screen.getByPlaceholderText('Paste your JSON here...')).toBeInTheDocument()
      
      // Check for file upload button
      expect(screen.getByText('Select files')).toBeInTheDocument()
      
      // Check for URL input
      expect(screen.getByPlaceholderText('https://example.com/api/data.json')).toBeInTheDocument()
      
      // Check for action buttons
      expect(screen.getByText('Add')).toBeInTheDocument()
      expect(screen.getByText('Fetch')).toBeInTheDocument()
    })

    it('should have proper section headers', () => {
      render(<UploadPanel />)

      // Check for section headers
      expect(screen.getByText('Paste JSON')).toBeInTheDocument()
      expect(screen.getByText('Upload Files')).toBeInTheDocument()
      expect(screen.getByText('Fetch from URL')).toBeInTheDocument()
    })

    it('should show file size limit information', () => {
      render(<UploadPanel />)
      expect(screen.getByText('Maximum file size: 10MB')).toBeInTheDocument()
    })

    it('should show drag and drop instructions', () => {
      render(<UploadPanel />)
      expect(screen.getByText('or drag and drop JSON files here')).toBeInTheDocument()
    })
  })

  describe('Button states', () => {
    it('should disable buttons when inputs are empty', () => {
      render(<UploadPanel />)

      const addButton = screen.getByText('Add')
      const fetchButton = screen.getByText('Fetch')

      expect(addButton).toBeDisabled()
      expect(fetchButton).toBeDisabled()
    })
  })

  describe('Store integration', () => {
    it('should use store for version management', () => {
      render(<UploadPanel />)
      
      // Verify that useAppStore was called
      expect(useAppStore).toHaveBeenCalled()
    })
  })
})
