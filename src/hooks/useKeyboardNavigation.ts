'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardNavigationOptions {
  onExpandAll?: () => void
  onCollapseAll?: () => void
  onToggleSearch?: () => void
  onEscape?: () => void
  onFocusSearch?: () => void
  enableShortcuts?: boolean
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions = {}) {
  const {
    onExpandAll,
    onCollapseAll,
    onToggleSearch,
    onEscape,
    onFocusSearch,
    enableShortcuts = true
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableShortcuts) return

    // Don't handle shortcuts when typing in input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.isContentEditable
    ) {
      // Allow Escape to blur input fields
      if (event.key === 'Escape' && onEscape) {
        onEscape()
      }
      return
    }

    // Handle keyboard shortcuts
    switch (event.key) {
      case 'e':
      case 'E':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onExpandAll?.()
        }
        break
      
      case 'c':
      case 'C':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onCollapseAll?.()
        }
        break
      
      case 'f':
      case 'F':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault()
          onFocusSearch?.()
        }
        break
      
      case '/':
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault()
          onToggleSearch?.()
        }
        break
      
      case 'Escape':
        onEscape?.()
        break
    }
  }, [enableShortcuts, onExpandAll, onCollapseAll, onToggleSearch, onEscape, onFocusSearch])

  useEffect(() => {
    if (enableShortcuts) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, enableShortcuts])

  return {
    // Expose handler for components that need custom handling
    handleKeyDown
  }
}
