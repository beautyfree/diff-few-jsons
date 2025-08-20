'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, useAppSelectors } from '@/state/store'
import type { DiffNode, SearchResult } from '@/types/domain'
import { Search, X, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react'
import { 
  slideVariants, 
  listItemVariants,
  staggerContainerVariants,
  searchResultVariants,
  springConfigs 
} from '@/utils/motion'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface SearchBarProps {
  className?: string
}

interface SearchMatch {
  node: DiffNode
  score: number
  matchType: 'path' | 'value' | 'both'
  pathMatch?: string
  valueMatch?: string
}

function SearchBar({ className = '' }: SearchBarProps) {
  const currentDiff = useAppSelectors.useCurrentDiff()
  const { setSearchQuery } = useAppStore()
  const [query, setQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [announceMessage, setAnnounceMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Search through diff nodes recursively
  const searchNodes = useCallback((nodes: DiffNode[], searchTerm: string): SearchMatch[] => {
    if (!searchTerm.trim()) return []
    
    const matches: SearchMatch[] = []
    const lowerSearchTerm = searchTerm.toLowerCase()
    
    const traverse = (node: DiffNode) => {
      let score = 0
      let matchType: 'path' | 'value' | 'both' = 'path'
      let pathMatch: string | undefined
      let valueMatch: string | undefined
      
      // Search in path
      if (node.path.toLowerCase().includes(lowerSearchTerm)) {
        score += 10
        pathMatch = node.path
      }
      
      // Search in values
      const beforeStr = node.before !== undefined ? JSON.stringify(node.before) : ''
      const afterStr = node.after !== undefined ? JSON.stringify(node.after) : ''
      
      if (beforeStr.toLowerCase().includes(lowerSearchTerm)) {
        score += 5
        valueMatch = beforeStr
        matchType = pathMatch ? 'both' : 'value'
      }
      
      if (afterStr.toLowerCase().includes(lowerSearchTerm)) {
        score += 5
        valueMatch = afterStr
        matchType = pathMatch ? 'both' : 'value'
      }
      
      // Add to matches if we found something
      if (score > 0) {
        matches.push({
          node,
          score,
          matchType,
          pathMatch,
          valueMatch
        })
      }
      
      // Recursively search children
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    
    nodes.forEach(traverse)
    
    // Sort by score (highest first)
    return matches.sort((a, b) => b.score - a.score)
  }, [])

  // Get search results
  const searchResults = useMemo(() => {
    if (!currentDiff || !query.trim()) return []
    return searchNodes([currentDiff.root], query)
  }, [currentDiff, query, searchNodes])

  // Update global search query
  useEffect(() => {
    setSearchQuery(query)
  }, [query, setSearchQuery])

  // Reset current match index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0)
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return
    
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (e.shiftKey) {
          // Previous match
          setCurrentMatchIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          )
        } else {
          // Next match
          setCurrentMatchIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'Escape':
        setQuery('')
        setIsExpanded(false)
        break
    }
  }, [searchResults.length])

  // Handle search input change
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (newQuery.trim()) {
      // Announce search results
      const resultCount = searchResults.length
      setAnnounceMessage(`Found ${resultCount} ${resultCount === 1 ? 'result' : 'results'} for "${newQuery}"`)
    }
  }, [searchResults.length])

  // Clear announce message after a delay
  React.useEffect(() => {
    if (announceMessage) {
      const timer = setTimeout(() => setAnnounceMessage(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announceMessage])

  // Focus search input
  const handleFocusSearch = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // Toggle search (focus if not focused, clear if focused and has content)
  const handleToggleSearch = useCallback(() => {
    if (document.activeElement === inputRef.current) {
      if (query) {
        setQuery('')
        setCurrentMatchIndex(0)
      }
    } else {
      inputRef.current?.focus()
    }
  }, [query])

  // Set up keyboard navigation
  useKeyboardNavigation({
    onFocusSearch: handleFocusSearch,
    onToggleSearch: handleToggleSearch,
    onEscape: () => {
      if (document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    },
    enableShortcuts: true
  })

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('')
    setCurrentMatchIndex(0)
  }, [])

  // Navigate to specific match
  const navigateToMatch = useCallback((index: number) => {
    setCurrentMatchIndex(index)
  }, [])

  // Get current match
  const currentMatch = searchResults[currentMatchIndex]

  return (
    <motion.div 
      className={`relative ${className}`}
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      transition={springConfigs.standard}
      role="search"
      aria-label="Search JSON diff tree"
    >
      {/* Live region for announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>
      {/* Search Input */}
      <motion.div 
        className="relative"
        variants={listItemVariants}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <motion.div
          whileFocus={{ scale: 1.02 }}
          transition={springConfigs.fast}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search paths and values..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
            aria-label="Search input"
            aria-describedby="search-instructions"
            aria-expanded={query ? true : false}
            aria-owns={query && searchResults.length > 0 ? "search-results" : undefined}
            role="combobox"
            autoComplete="off"
          />
        </motion.div>
        
        {query && (
          <motion.button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springConfigs.fast}
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}
      </motion.div>

      {/* Hidden instructions for screen readers */}
      <div id="search-instructions" className="sr-only">
        Use arrow keys to navigate search results, Enter to select, Escape to clear. Press / or Ctrl/Cmd+F to focus search.
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {query && (
          <motion.div
            variants={searchResultVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springConfigs.smooth}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-hidden"
            id="search-results"
            role="listbox"
            aria-label="Search results"
          >
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No matches found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {/* Results Header */}
                <motion.div 
                  className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200"
                  variants={listItemVariants}
                >
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
                    <div className="flex items-center space-x-2">
                      <span>Use ↑↓ to navigate, Enter to select</span>
                    </div>
                  </div>
                </motion.div>

                {/* Results List */}
                <motion.div 
                  className="divide-y divide-gray-100"
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={`${result.node.path}-${index}`}
                      variants={listItemVariants}
                      transition={{ delay: index * 0.05 }}
                      className={`px-4 py-3 cursor-pointer ${
                        index === currentMatchIndex 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => navigateToMatch(index)}
                      whileHover={{ 
                        backgroundColor: index === currentMatchIndex ? '#dbeafe' : '#f9fafb',
                        x: 2
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={springConfigs.fast}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Path */}
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {result.node.path || 'root'}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              result.node.kind === 'added' ? 'bg-green-100 text-green-800' :
                              result.node.kind === 'removed' ? 'bg-red-100 text-red-800' :
                              result.node.kind === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {result.node.kind}
                            </span>
                          </div>

                          {/* Match Details */}
                          <div className="text-sm text-gray-600 space-y-1">
                            {result.pathMatch && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Path:</span>
                                <code className="bg-gray-100 px-1 rounded text-xs">
                                  {result.pathMatch}
                                </code>
                              </div>
                            )}
                            
                            {result.valueMatch && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Value:</span>
                                <code className="bg-gray-100 px-1 rounded text-xs max-w-xs truncate">
                                  {result.valueMatch}
                                </code>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Navigation Indicators */}
                        <div className="flex items-center space-x-1 ml-2">
                          {index === currentMatchIndex && (
                            <motion.div 
                              className="flex items-center space-x-1 text-blue-600"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1, ...springConfigs.fast }}
                            >
                              <motion.div
                                animate={{ y: [-2, 2, -2] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <ArrowUp className="h-4 w-4" />
                              </motion.div>
                              <motion.div
                                animate={{ y: [2, -2, 2] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </motion.div>
                            </motion.div>
                          )}
                          <span className="text-xs text-gray-400">
                            {index + 1}/{searchResults.length}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Stats */}
      {query && searchResults.length > 0 && (
        <motion.div 
          className="mt-2 text-xs text-gray-500"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfigs.fast}
        >
          <span>
            {currentMatchIndex + 1} of {searchResults.length} matches
          </span>
          {currentMatch && (
            <span className="ml-2">
              • {currentMatch.matchType === 'both' ? 'Path & Value' : 
                  currentMatch.matchType === 'path' ? 'Path' : 'Value'} match
            </span>
          )}
        </motion.div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <motion.div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  )
}

export default SearchBar
