'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, useAppSelectors, useIsDiffCached } from '@/state/store'
import type { JsonVersion } from '@/types/domain'
import { 
  slideVariants, 
  staggerContainerVariants,
  listItemVariants,
  springConfigs 
} from '@/utils/motion'

interface PairMatrixProps {
  className?: string
}

// Matrix cell component that can use the useIsDiffCached hook
interface MatrixCellProps {
  versionA: JsonVersion
  versionB: JsonVersion
  isSelected: boolean
  isAdjacent: boolean
  label: string
  tooltip: string
  onClick: () => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  tabIndex: number
  className?: string
}

function MatrixCell({ 
  versionA, 
  versionB, 
  isSelected, 
  isAdjacent, 
  label, 
  tooltip, 
  onClick, 
  onKeyDown, 
  onMouseEnter, 
  onMouseLeave, 
  tabIndex, 
  className = '' 
}: MatrixCellProps) {
  const isCached = useIsDiffCached(versionA.id, versionB.id)
  
  return (
    <motion.div
      className={`relative ${className}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      tabIndex={tabIndex}
      role="gridcell"
      aria-label={label}
      title={tooltip}
      variants={listItemVariants}
      whileHover={{ scale: 1.05, transition: springConfigs.fast }}
      whileTap={{ scale: 0.95, transition: springConfigs.fast }}
      transition={{ delay: 0.02 }}
    >
      <div className="flex items-center justify-center p-2">
        <motion.div 
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            isSelected
              ? 'bg-blue-500 text-white shadow-lg'
              : isAdjacent
              ? 'bg-green-500 text-white shadow-md'
              : isCached
              ? 'bg-gray-300 text-gray-700'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          animate={{
            scale: isSelected ? 1.1 : isAdjacent ? 1.05 : 1
          }}
          transition={springConfigs.fast}
        >
          {isSelected ? '✓' : isAdjacent ? '→' : '•'}
        </motion.div>
      </div>

      {/* Status indicators */}
      <motion.div 
        className="absolute top-1 right-1 flex space-x-1"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springConfigs.fast}
      >
        {isCached && (
          <motion.div 
            className="w-2 h-2 bg-blue-400 rounded-full" 
            title="Cached"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springConfigs.fast}
          ></motion.div>
        )}
        {isAdjacent && (
          <motion.div 
            className="w-2 h-2 bg-green-400 rounded-full" 
            title="Timeline adjacent"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springConfigs.fast}
          ></motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

function PairMatrix({ className = '' }: PairMatrixProps) {
  const { versions, selection, setPairSelection } = useAppStore()
  const adjacentPairs = useAppSelectors.useAdjacentPairs()
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
  const [announceMessage, setAnnounceMessage] = useState('')
  const matrixRef = useRef<HTMLDivElement>(null)

  // Get current pair selection
  const currentPair = useMemo(() => 
    selection.mode === 'pair' 
      ? { a: selection.a, b: selection.b }
      : null
  , [selection])

  // Check if a pair is currently selected
  const isPairSelected = useCallback((a: string, b: string) => {
    if (currentPair) {
      return (currentPair.a === a && currentPair.b === b) || (currentPair.a === b && currentPair.b === a)
    }
    return false
  }, [currentPair])

  // Check if a pair is adjacent (timeline-adjacent)
  const isAdjacentPair = useCallback((a: string, b: string) => {
    return adjacentPairs.some(pair => 
      (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a)
    )
  }, [adjacentPairs])

  // Handle cell click
  const handleCellClick = useCallback((versionA: JsonVersion, versionB: JsonVersion) => {
    setPairSelection(versionA.id, versionB.id)
    setAnnounceMessage(`Selected comparison between ${versionA.label} and ${versionB.label}`)
  }, [setPairSelection])

  // Clear announce message after a delay
  React.useEffect(() => {
    if (announceMessage) {
      const timer = setTimeout(() => setAnnounceMessage(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announceMessage])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const totalVersions = versions.length
    const maxIndex = totalVersions - 1

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (rowIndex > 0) {
          setFocusedCell({ row: rowIndex - 1, col: colIndex })
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (rowIndex < maxIndex - 1) {
          setFocusedCell({ row: rowIndex + 1, col: colIndex })
        }
        break
      case 'ArrowLeft':
        event.preventDefault()
        if (colIndex > 0) {
          setFocusedCell({ row: rowIndex, col: colIndex - 1 })
        }
        break
      case 'ArrowRight':
        event.preventDefault()
        if (colIndex < maxIndex - 1) {
          setFocusedCell({ row: rowIndex, col: colIndex + 1 })
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (rowIndex !== colIndex) {
          handleCellClick(versions[rowIndex], versions[colIndex])
        }
        break
    }
  }, [versions, handleCellClick])

  // Handle mouse hover for tooltip
  const [hoveredPair, setHoveredPair] = useState<{ a: JsonVersion; b: JsonVersion } | null>(null)

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Get cell content for a pair (without cache check - that will be done in MatrixCell component)
  const getCellContent = useCallback((versionA: JsonVersion, versionB: JsonVersion) => {
    const isSelected = isPairSelected(versionA.id, versionB.id)
    const isAdjacent = isAdjacentPair(versionA.id, versionB.id)

    return {
      isSelected,
      isAdjacent,
      label: `${versionA.label} → ${versionB.label}`,
      tooltip: `${versionA.label} (${formatTimestamp(versionA.timestamp)}) → ${versionB.label} (${formatTimestamp(versionB.timestamp)})`
    }
  }, [isPairSelected, isAdjacentPair, formatTimestamp])

  if (versions.length < 2) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">
          Add at least 2 JSON versions to see the comparison matrix
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live region for announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Comparison Matrix
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Timeline Adjacent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>Cached</span>
          </div>
        </div>
      </div>

      {/* Matrix Container */}
      <motion.div 
        ref={matrixRef}
        className="relative overflow-auto border border-gray-200 rounded-lg"
        role="grid"
        aria-label="Version comparison matrix"
        variants={slideVariants}
        initial="hidden"
        animate="visible"
        transition={springConfigs.standard}
      >
        <div className="min-w-max">
          {/* Column Headers */}
          <motion.div 
            className="flex border-b border-gray-200"
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="w-24 h-12 flex-shrink-0"
              variants={listItemVariants}
            ></motion.div> {/* Empty corner */}
            {versions.map((version, index) => (
              <motion.div
                key={version.id}
                className="w-32 h-12 flex-shrink-0 border-l border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 bg-gray-50"
                role="columnheader"
                aria-label={`Version ${index + 1}: ${version.label}`}
                variants={listItemVariants}
                whileHover={{ scale: 1.02, transition: springConfigs.fast }}
              >
                <div className="text-center">
                  <div className="font-medium truncate px-1">{version.label}</div>
                  <div className="text-xs text-gray-500">{formatTimestamp(version.timestamp)}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Matrix Rows */}
          {versions.map((versionA, rowIndex) => (
            <motion.div 
              key={versionA.id} 
              className="flex border-b border-gray-200 last:border-b-0"
              variants={listItemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: rowIndex * 0.05 }}
            >
              {/* Row Header */}
              <motion.div
                className="w-24 h-16 flex-shrink-0 border-r border-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 bg-gray-50"
                role="rowheader"
                aria-label={`Version ${rowIndex + 1}: ${versionA.label}`}
                whileHover={{ scale: 1.02, transition: springConfigs.fast }}
              >
                <div className="text-center">
                  <div className="font-medium truncate px-1">{versionA.label}</div>
                  <div className="text-xs text-gray-500">{formatTimestamp(versionA.timestamp)}</div>
                </div>
              </motion.div>

              {/* Matrix Cells */}
              {versions.map((versionB, colIndex) => {
                const isSameVersion = rowIndex === colIndex
                const cellContent = !isSameVersion ? getCellContent(versionA, versionB) : null
                const isFocused = focusedCell?.row === rowIndex && focusedCell?.col === colIndex

                if (isSameVersion) {
                  return (
                    <motion.div
                      key={`${versionA.id}-${versionB.id}`}
                      className="w-32 h-16 flex-shrink-0 border-l border-gray-200 bg-gray-100 flex items-center justify-center"
                      role="gridcell"
                      aria-label="Same version"
                      variants={listItemVariants}
                      transition={{ delay: (rowIndex + colIndex) * 0.02 }}
                    >
                      <span className="text-xs text-gray-400">—</span>
                    </motion.div>
                  )
                }

                return (
                  <MatrixCell
                    key={`${versionA.id}-${versionB.id}`}
                    versionA={versionA}
                    versionB={versionB}
                    isSelected={cellContent?.isSelected || false}
                    isAdjacent={cellContent?.isAdjacent || false}
                    label={cellContent?.label || ''}
                    tooltip={cellContent?.tooltip || ''}
                    onClick={() => handleCellClick(versionA, versionB)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                    onMouseEnter={() => setHoveredPair({ a: versionA, b: versionB })}
                    onMouseLeave={() => setHoveredPair(null)}
                    tabIndex={isFocused ? 0 : -1}
                    className={`w-32 h-16 flex-shrink-0 border-l border-gray-200 relative ${
                      isFocused ? 'ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                  />
                )
              })}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredPair && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-10 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{
              left: hoveredPair ? '50%' : '0',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-medium">{hoveredPair.a.label} → {hoveredPair.b.label}</div>
            <div className="text-gray-300 text-xs">
              {formatTimestamp(hoveredPair.a.timestamp)} → {formatTimestamp(hoveredPair.b.timestamp)}
            </div>
            <div className="text-gray-300 text-xs mt-1">
              Click to compare these versions
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center">
        Use arrow keys to navigate, Enter or Space to select a pair
      </div>
    </div>
  )
}

export default PairMatrix
