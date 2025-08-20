import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RulesPanel from './RulesPanel'
import { useAppStore } from '@/state/store'
import type { IgnoreRule, TransformRule } from '@/types/domain'

// Mock the store
const mockAddIgnoreRule = vi.fn()
const mockUpdateIgnoreRule = vi.fn()
const mockRemoveIgnoreRule = vi.fn()
const mockAddTransformRule = vi.fn()
const mockUpdateTransformRule = vi.fn()
const mockRemoveTransformRule = vi.fn()
const mockSetRulesPanelExpanded = vi.fn()
const mockClearCache = vi.fn()

vi.mock('@/state/store', () => ({
  useAppStore: vi.fn()
}))

// Mock framer-motion to avoid test environment issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  X: () => <div data-testid="x-icon">×</div>,
  Eye: () => <div data-testid="eye-icon">👁</div>,
  EyeOff: () => <div data-testid="eye-off-icon">👁‍🗨</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
  AlertCircle: () => <div data-testid="alert-icon">⚠️</div>,
  ChevronDown: () => <div data-testid="chevron-down">▼</div>,
  ChevronRight: () => <div data-testid="chevron-right">▶</div>
}))

describe('RulesPanel', () => {
  const mockIgnoreRules: IgnoreRule[] = [
    {
      id: 'ignore1',
      type: 'keyPath',
      pattern: 'user.id',
      enabled: true
    },
    {
      id: 'ignore2',
      type: 'regex',
      pattern: '\\d{4}-\\d{2}-\\d{2}',
      enabled: false
    }
  ]

  const mockTransformRules: TransformRule[] = [
    {
      id: 'transform1',
      type: 'lowercase',
      targetPath: 'user.name',
      enabled: true
    },
    {
      id: 'transform2',
      type: 'round',
      targetPath: 'price',
      options: { decimals: 2 },
      enabled: true
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the store with default values
    ;(useAppStore as any).mockReturnValue({
      options: {
        ignoreRules: mockIgnoreRules,
        transformRules: mockTransformRules
      },
      ui: {
        rulesPanelExpanded: true
      },
      addIgnoreRule: mockAddIgnoreRule,
      updateIgnoreRule: mockUpdateIgnoreRule,
      removeIgnoreRule: mockRemoveIgnoreRule,
      addTransformRule: mockAddTransformRule,
      updateTransformRule: mockUpdateTransformRule,
      removeTransformRule: mockRemoveTransformRule,
      setRulesPanelExpanded: mockSetRulesPanelExpanded,
      clearCache: mockClearCache
    })
  })

  describe('Component Rendering', () => {
    it('should render collapsed state', () => {
      ;(useAppStore as any).mockReturnValue({
        options: { ignoreRules: [], transformRules: [] },
        ui: { rulesPanelExpanded: false },
        addIgnoreRule: mockAddIgnoreRule,
        updateIgnoreRule: mockUpdateIgnoreRule,
        removeIgnoreRule: mockRemoveIgnoreRule,
        addTransformRule: mockAddTransformRule,
        updateTransformRule: mockUpdateTransformRule,
        removeTransformRule: mockRemoveTransformRule,
        setRulesPanelExpanded: mockSetRulesPanelExpanded,
        clearCache: mockClearCache
      })

      render(<RulesPanel />)
      
      expect(screen.getByText('Rules Panel')).toBeInTheDocument()
      expect(screen.getByText('0 of 0 active')).toBeInTheDocument()
      expect(screen.queryByText('Ignore Rules')).not.toBeInTheDocument()
    })

    it('should render expanded state with rules', () => {
      render(<RulesPanel />)
      
      expect(screen.getByText('Rules Panel')).toBeInTheDocument()
      expect(screen.getByText('3 of 4 active')).toBeInTheDocument()
      expect(screen.getByText('Ignore Rules')).toBeInTheDocument()
      expect(screen.getByText('Transform Rules')).toBeInTheDocument()
    })

    it('should render ignore rules correctly', () => {
      render(<RulesPanel />)
      
      // Check for ignore rule entries
      expect(screen.getByText('user.id')).toBeInTheDocument()
      expect(screen.getByText('\\d{4}-\\d{2}-\\d{2}')).toBeInTheDocument()
      expect(screen.getByText('Key Path')).toBeInTheDocument()
      expect(screen.getByText('Regular Expression')).toBeInTheDocument()
    })

    it('should render transform rules correctly', () => {
      render(<RulesPanel />)
      
      // Check for transform rule entries
      expect(screen.getByText('user.name')).toBeInTheDocument()
      expect(screen.getByText('price')).toBeInTheDocument()
      expect(screen.getByText('Lowercase')).toBeInTheDocument()
      expect(screen.getByText('Round Numbers')).toBeInTheDocument()
      expect(screen.getByText('Convert to lowercase')).toBeInTheDocument()
      expect(screen.getByText('Round to 2 decimal places')).toBeInTheDocument()
    })

    it('should show empty states when no rules exist', () => {
      ;(useAppStore as any).mockReturnValue({
        options: { ignoreRules: [], transformRules: [] },
        ui: { rulesPanelExpanded: true },
        addIgnoreRule: mockAddIgnoreRule,
        updateIgnoreRule: mockUpdateIgnoreRule,
        removeIgnoreRule: mockRemoveIgnoreRule,
        addTransformRule: mockAddTransformRule,
        updateTransformRule: mockUpdateTransformRule,
        removeTransformRule: mockRemoveTransformRule,
        setRulesPanelExpanded: mockSetRulesPanelExpanded,
        clearCache: mockClearCache
      })

      render(<RulesPanel />)
      
      expect(screen.getByText('No ignore rules defined')).toBeInTheDocument()
      expect(screen.getByText('No transform rules defined')).toBeInTheDocument()
    })
  })

  describe('Panel Expansion', () => {
    it('should toggle panel expansion when header is clicked', () => {
      render(<RulesPanel />)
      
      const header = screen.getByText('Rules Panel')
      fireEvent.click(header)
      
      expect(mockSetRulesPanelExpanded).toHaveBeenCalledWith(false)
    })

    it('should show correct chevron icon based on expansion state', () => {
      render(<RulesPanel />)
      
      expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
    })
  })

  describe('Ignore Rule Management', () => {
    it('should show add ignore rule form when button is clicked', () => {
      render(<RulesPanel />)
      
      const addButton = screen.getAllByText('Add Rule')[0] // First "Add Rule" button is for ignore rules
      fireEvent.click(addButton)
      
      expect(screen.getByText('Add Ignore Rule')).toBeInTheDocument()
      expect(screen.getByLabelText('Rule Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Pattern')).toBeInTheDocument()
    })

    it('should validate ignore rule form', () => {
      render(<RulesPanel />)
      
      // Open form
      const addButton = screen.getAllByText('Add Rule')[0]
      fireEvent.click(addButton)
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: 'Add Rule' })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Pattern is required')).toBeInTheDocument()
      expect(mockAddIgnoreRule).not.toHaveBeenCalled()
    })

    it('should add ignore rule when form is valid', () => {
      render(<RulesPanel />)
      
      // Open form
      const addButton = screen.getAllByText('Add Rule')[0]
      fireEvent.click(addButton)
      
      // Fill form
      const patternInput = screen.getByLabelText('Pattern')
      fireEvent.change(patternInput, { target: { value: 'user.email' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Add Rule' })
      fireEvent.click(submitButton)
      
      expect(mockAddIgnoreRule).toHaveBeenCalledWith({
        type: 'keyPath',
        pattern: 'user.email',
        enabled: true
      })
      expect(mockClearCache).toHaveBeenCalled()
    })

    it('should toggle ignore rule enabled state', () => {
      render(<RulesPanel />)
      
      // Find the first eye icon (enabled rule)
      const eyeIcons = screen.getAllByTestId('eye-icon')
      fireEvent.click(eyeIcons[0])
      
      expect(mockUpdateIgnoreRule).toHaveBeenCalledWith('ignore1', { enabled: false })
      expect(mockClearCache).toHaveBeenCalled()
    })

    it('should remove ignore rule', () => {
      render(<RulesPanel />)
      
      // Find the first X icon
      const removeButtons = screen.getAllByTestId('x-icon')
      fireEvent.click(removeButtons[0])
      
      expect(mockRemoveIgnoreRule).toHaveBeenCalledWith('ignore1')
      expect(mockClearCache).toHaveBeenCalled()
    })
  })

  describe('Transform Rule Management', () => {
    it('should show add transform rule form when button is clicked', () => {
      render(<RulesPanel />)
      
      const addButtons = screen.getAllByText('Add Rule')
      const transformAddButton = addButtons[1] // Second "Add Rule" button is for transform rules
      fireEvent.click(transformAddButton)
      
      expect(screen.getByText('Add Transform Rule')).toBeInTheDocument()
      expect(screen.getByLabelText('Transform Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Target Path')).toBeInTheDocument()
    })

    it('should show transform-specific options', () => {
      render(<RulesPanel />)
      
      // Open form
      const addButtons = screen.getAllByText('Add Rule')
      fireEvent.click(addButtons[1])
      
      // Select round transform
      const typeSelect = screen.getByLabelText('Transform Type')
      fireEvent.change(typeSelect, { target: { value: 'round' } })
      
      expect(screen.getByLabelText('Decimal Places')).toBeInTheDocument()
    })

    it('should add transform rule when form is valid', () => {
      render(<RulesPanel />)
      
      // Open form
      const addButtons = screen.getAllByText('Add Rule')
      fireEvent.click(addButtons[1])
      
      // Fill form
      const targetPathInput = screen.getByLabelText('Target Path')
      fireEvent.change(targetPathInput, { target: { value: 'user.email' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Add Rule' })
      fireEvent.click(submitButton)
      
      expect(mockAddTransformRule).toHaveBeenCalledWith({
        type: 'lowercase',
        targetPath: 'user.email',
        enabled: true
      })
      expect(mockClearCache).toHaveBeenCalled()
    })

    it('should toggle transform rule enabled state', () => {
      render(<RulesPanel />)
      
      // Find all eye icons and click one that should be for a transform rule
      const eyeIcons = screen.getAllByTestId('eye-icon')
      // Click the last eye icon (should be a transform rule)
      const lastEyeIcon = eyeIcons[eyeIcons.length - 1]
      fireEvent.click(lastEyeIcon)
      
      // Verify that a transform rule was updated (either transform1 or transform2)
      expect(mockUpdateTransformRule).toHaveBeenCalledWith(
        expect.stringMatching(/^transform[12]$/), 
        { enabled: false }
      )
      expect(mockClearCache).toHaveBeenCalled()
    })

    it('should remove transform rule', () => {
      render(<RulesPanel />)
      
      // Find all remove buttons and click one that should be for a transform rule
      const removeButtons = screen.getAllByTestId('x-icon')
      // Click the last remove button (should be a transform rule)
      const lastRemoveButton = removeButtons[removeButtons.length - 1]
      fireEvent.click(lastRemoveButton)
      
      // Verify that a transform rule was removed (either transform1 or transform2)
      expect(mockRemoveTransformRule).toHaveBeenCalledWith(
        expect.stringMatching(/^transform[12]$/)
      )
      expect(mockClearCache).toHaveBeenCalled()
    })
  })

  describe('Form Validation', () => {
    it('should validate regex patterns', () => {
      render(<RulesPanel />)
      
      // Open ignore rule form
      const addButton = screen.getAllByText('Add Rule')[0]
      fireEvent.click(addButton)
      
      // Select regex type
      const typeSelect = screen.getByLabelText('Rule Type')
      fireEvent.change(typeSelect, { target: { value: 'regex' } })
      
      // Enter invalid regex
      const patternInput = screen.getByLabelText('Pattern')
      fireEvent.change(patternInput, { target: { value: '[invalid regex' } })
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: 'Add Rule' })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Invalid regex pattern')).toBeInTheDocument()
      expect(mockAddIgnoreRule).not.toHaveBeenCalled()
    })

    it('should validate transform rule decimal places', () => {
      render(<RulesPanel />)
      
      // Open transform rule form
      const addButtons = screen.getAllByText('Add Rule')
      fireEvent.click(addButtons[1])
      
      // Select round type
      const typeSelect = screen.getByLabelText('Transform Type')
      fireEvent.change(typeSelect, { target: { value: 'round' } })
      
      // Fill target path
      const targetPathInput = screen.getByLabelText('Target Path')
      fireEvent.change(targetPathInput, { target: { value: 'price' } })
      
      // Enter invalid decimal places
      const decimalsInput = screen.getByLabelText('Decimal Places')
      fireEvent.change(decimalsInput, { target: { value: '25' } })
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: 'Add Rule' })
      fireEvent.click(submitButton)
      
      expect(screen.getByText('Decimals must be between 0 and 20')).toBeInTheDocument()
      expect(mockAddTransformRule).not.toHaveBeenCalled()
    })
  })

  describe('Rule Type Labels and Descriptions', () => {
    it('should display correct rule type labels', () => {
      render(<RulesPanel />)
      
      expect(screen.getByText('Key Path')).toBeInTheDocument()
      expect(screen.getByText('Regular Expression')).toBeInTheDocument()
      expect(screen.getByText('Lowercase')).toBeInTheDocument()
      expect(screen.getByText('Round Numbers')).toBeInTheDocument()
    })

    it('should display correct transform descriptions', () => {
      render(<RulesPanel />)
      
      expect(screen.getByText('Convert to lowercase')).toBeInTheDocument()
      expect(screen.getByText('Round to 2 decimal places')).toBeInTheDocument()
    })
  })

  describe('Store Integration', () => {
    it('should call useAppStore', () => {
      render(<RulesPanel />)
      
      expect(useAppStore).toHaveBeenCalled()
    })

    it('should clear cache when rules change', () => {
      render(<RulesPanel />)
      
      // Any rule modification should clear cache
      const eyeIcons = screen.getAllByTestId('eye-icon')
      fireEvent.click(eyeIcons[0])
      
      expect(mockClearCache).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<RulesPanel />)
      
      // Open ignore rule form
      const addButton = screen.getAllByText('Add Rule')[0]
      fireEvent.click(addButton)
      
      expect(screen.getByLabelText('Rule Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Pattern')).toBeInTheDocument()
    })

    it('should have proper button titles', () => {
      render(<RulesPanel />)
      
      // Check for title attributes on action buttons
      const eyeButtons = screen.getAllByTestId('eye-icon')
      expect(eyeButtons[0].closest('button')).toHaveAttribute('title', 'Disable rule')
      
      const removeButtons = screen.getAllByTestId('x-icon')
      expect(removeButtons[0].closest('button')).toHaveAttribute('title', 'Remove rule')
    })
  })

  describe('Help Information', () => {
    it('should display help information', () => {
      const { container } = render(<RulesPanel />)
      
      expect(screen.getByText('How Rules Work:')).toBeInTheDocument()
      // Check if the help text exists anywhere in the container
      expect(container.textContent).toContain('exclude fields from diff comparison entirely')
      expect(container.textContent).toContain('modify values before comparison')
    })
  })
})
