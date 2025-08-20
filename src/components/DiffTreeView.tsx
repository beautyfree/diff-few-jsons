'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, useAppSelectors } from '@/state/store'
import type { DiffNode, ChangeKind } from '@/types/domain'
import { 
  slideVariants, 
  listItemVariants,
  staggerContainerVariants,
  treeNodeVariants,
  springConfigs 
} from '@/utils/motion'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface DiffTreeViewProps {
  className?: string
}

interface TreeNodeProps {
  node: DiffNode
  level: number
  path: string
  isExpanded: boolean
  onToggle: (path: string) => void
  hideUnchanged: boolean
}

function TreeNode({ node, level, path, isExpanded, onToggle, hideUnchanged }: TreeNodeProps) {
  const indent = level * 20

  // Skip unchanged nodes if hideUnchanged is true
  if (hideUnchanged && node.kind === 'unchanged') {
    return null
  }

  const hasChildren = node.children && node.children.length > 0
  const canExpand = hasChildren && node.children!.some(child => 
    !hideUnchanged || child.kind !== 'unchanged'
  )

  const handleToggle = useCallback(() => {
    if (canExpand) {
      onToggle(path)
    }
  }, [canExpand, onToggle, path])

  const getChangeIcon = (kind: ChangeKind) => {
    switch (kind) {
      case 'added':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">+</span>
          </div>
        )
      case 'removed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">−</span>
          </div>
        )
      case 'modified':
        return (
          <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">~</span>
          </div>
        )
      case 'unchanged':
        return (
          <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xs">=</span>
          </div>
        )
    }
  }

  const getChangeColor = (kind: ChangeKind) => {
    switch (kind) {
      case 'added':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'removed':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'modified':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'unchanged':
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getChangeLabel = (kind: ChangeKind) => {
    switch (kind) {
      case 'added':
        return 'Added'
      case 'removed':
        return 'Removed'
      case 'modified':
        return 'Modified'
      case 'unchanged':
        return 'Unchanged'
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') {
      return Array.isArray(value) ? `[${value.length} items]` : `{${Object.keys(value).length} keys}`
    }
    return String(value)
  }

  return (
    <motion.div 
      className="select-none"
      variants={treeNodeVariants}
      initial="hidden"
      animate="visible"
      role="treeitem"
      aria-expanded={canExpand ? isExpanded : undefined}
      aria-level={level + 1}
      aria-label={`${node.path}: ${getChangeLabel(node.kind)} ${node.before !== undefined ? `from ${formatValue(node.before)}` : ''} ${node.after !== undefined ? `to ${formatValue(node.after)}` : ''}`}
    >
      <motion.div
        className={`flex items-center py-1 px-2 rounded ${
          canExpand ? 'cursor-pointer' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        tabIndex={canExpand ? 0 : -1}
        whileHover={{ 
          backgroundColor: canExpand ? '#f3f4f6' : undefined,
          scale: canExpand ? 1.02 : 1
        }}
        whileTap={{ scale: canExpand ? 0.98 : 1 }}
        transition={springConfigs.fast}
      >
        {/* Expand/Collapse Icon */}
        <div className="w-4 h-4 mr-2 flex items-center justify-center">
          {canExpand && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ ...springConfigs.fast }}
              className="text-gray-500"
              whileHover={{ scale: 1.2 }}
            >
              ▶
            </motion.div>
          )}
        </div>

        {/* Change Type Icon */}
        <motion.div 
          className="mr-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, ...springConfigs.fast }}
        >
          {getChangeIcon(node.kind)}
        </motion.div>

        {/* Node Path */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-800 truncate">
              {node.path || 'root'}
            </span>
            
            {/* Change Type Badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getChangeColor(node.kind)}`}>
              {getChangeLabel(node.kind)}
            </span>

            {/* Change Count Badge */}
            {node.meta?.countChanged && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {node.meta.countChanged} changes
              </span>
            )}
          </div>

          {/* Value Display */}
          {(node.before !== undefined || node.after !== undefined) && (
            <div className="mt-1 text-xs text-gray-600">
              {node.kind === 'modified' && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">Before:</span>
                    <span className="font-mono">{formatValue(node.before)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">After:</span>
                    <span className="font-mono">{formatValue(node.after)}</span>
                  </div>
                </div>
              )}
              {node.kind === 'added' && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">Value:</span>
                  <span className="font-mono">{formatValue(node.after)}</span>
                </div>
              )}
              {node.kind === 'removed' && (
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">Value:</span>
                  <span className="font-mono">{formatValue(node.before)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...springConfigs.smooth }}
            className="overflow-hidden"
          >
            {node.children!.map((child, index) => (
              <motion.div
                key={`${path}.${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, ...springConfigs.fast }}
              >
                <TreeNode
                  node={child}
                  level={level + 1}
                  path={`${path}.${index}`}
                  isExpanded={false} // Start collapsed for performance
                  onToggle={onToggle}
                  hideUnchanged={hideUnchanged}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DiffTreeView({ className = '' }: DiffTreeViewProps) {
  const currentDiff = useAppSelectors.useCurrentDiff()
  const { setHideUnchanged } = useAppStore()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [hideUnchanged, setHideUnchangedLocal] = useState(false)
  const [announceMessage, setAnnounceMessage] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
        setAnnounceMessage(`Collapsed ${path}`)
      } else {
        newSet.add(path)
        setAnnounceMessage(`Expanded ${path}`)
      }
      return newSet
    })
  }, [])

  const handleHideUnchangedToggle = useCallback((checked: boolean) => {
    setHideUnchangedLocal(checked)
    setHideUnchanged(checked)
    setAnnounceMessage(checked ? 'Hiding unchanged nodes' : 'Showing all nodes')
  }, [setHideUnchanged])

  // Clear announce message after a delay
  React.useEffect(() => {
    if (announceMessage) {
      const timer = setTimeout(() => setAnnounceMessage(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announceMessage])

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    if (!currentDiff?.root.children) return
    
    const getAllPaths = (nodes: DiffNode[], prefix = 'root'): string[] => {
      const paths: string[] = []
      nodes.forEach((node, index) => {
        const path = `${prefix}.${index}`
        paths.push(path)
        if (node.children && node.children.length > 0) {
          paths.push(...getAllPaths(node.children, path))
        }
      })
      return paths
    }

    const allPaths = getAllPaths(currentDiff.root.children)
    setExpandedNodes(new Set(allPaths))
    setAnnounceMessage(`Expanded all nodes (${allPaths.length} nodes)`)
  }, [currentDiff])

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set())
    setAnnounceMessage('Collapsed all nodes')
  }, [])

  // Set up keyboard navigation
  useKeyboardNavigation({
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    enableShortcuts: true
  })

  const expandedNodesSet = useMemo(() => expandedNodes, [expandedNodes])

  if (!currentDiff) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">
          Select a pair of versions to see the diff tree
        </p>
      </div>
    )
  }

  const { root, stats } = currentDiff

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      transition={springConfigs.standard}
      role="region"
      aria-label="JSON Diff Tree View"
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
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Diff Tree
          </h3>
          <p className="text-sm text-gray-600">
            {stats.nodes} nodes • {stats.computeMs}ms compute time
          </p>
        </div>

        {/* Controls */}
        <motion.div 
          className="flex items-center space-x-4"
          variants={listItemVariants}
        >
          <motion.div 
            className="flex items-center space-x-2 text-sm"
            whileHover={{ scale: 1.02 }}
            transition={springConfigs.fast}
          >
            <label className="flex items-center space-x-2 cursor-pointer">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springConfigs.fast}
            >
              <input
                type="checkbox"
                checked={hideUnchanged}
                onChange={(e) => handleHideUnchangedToggle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-describedby="hide-unchanged-desc"
              />
            </motion.div>
            <span>Hide unchanged</span>
            </label>
            <div id="hide-unchanged-desc" className="sr-only">
              Toggle to hide or show unchanged nodes in the diff tree
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Legend */}
      <motion.div 
        className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"
        variants={listItemVariants}
      >
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={springConfigs.fast}
        >
          <motion.div 
            className="w-3 h-3 bg-green-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, ...springConfigs.fast }}
          ></motion.div>
          <span>Added</span>
        </motion.div>
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={springConfigs.fast}
        >
          <motion.div 
            className="w-3 h-3 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, ...springConfigs.fast }}
          ></motion.div>
          <span>Removed</span>
        </motion.div>
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={springConfigs.fast}
        >
          <motion.div 
            className="w-3 h-3 bg-yellow-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, ...springConfigs.fast }}
          ></motion.div>
          <span>Modified</span>
        </motion.div>
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={springConfigs.fast}
        >
          <motion.div 
            className="w-3 h-3 bg-gray-300 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, ...springConfigs.fast }}
          ></motion.div>
          <span>Unchanged</span>
        </motion.div>
      </motion.div>

      {/* Tree Container */}
      <motion.div 
        className="border border-gray-200 rounded-lg overflow-hidden"
        variants={listItemVariants}
        role="tree"
        aria-label="JSON difference tree"
      >
        <div className="max-h-96 overflow-y-auto"
             role="group"
             aria-label="Tree nodes"
        >
          {root.children && root.children.length > 0 ? (
            <motion.div 
              className="py-2"
              variants={staggerContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {root.children.map((child, index) => (
                <motion.div
                  key={`root.${index}`}
                  variants={treeNodeVariants}
                  transition={{ delay: index * 0.05 }}
                >
                  <TreeNode
                    node={child}
                    level={0}
                    path={`root.${index}`}
                    isExpanded={expandedNodesSet.has(`root.${index}`)}
                    onToggle={handleToggleNode}
                    hideUnchanged={hideUnchanged}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="p-8 text-center text-gray-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springConfigs.smooth}
            >
              <p>No differences found</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Performance Info */}
      <motion.div 
        className="text-xs text-gray-500 text-center space-y-1"
        variants={listItemVariants}
      >
        <p>Use the expand/collapse controls to navigate large trees efficiently</p>
        <p><strong>Keyboard shortcuts:</strong> Ctrl/Cmd+E to expand all, Ctrl/Cmd+C to collapse all</p>
      </motion.div>
    </motion.div>
  )
}

export default DiffTreeView
