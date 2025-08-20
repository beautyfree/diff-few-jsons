'use client'

import React, { useState, useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import { useAppStore } from '@/state/store'
import type { JsonVersion } from '@/types/domain'

interface VersionListProps {
  className?: string
}

function VersionList({ className = '' }: VersionListProps) {
  const { versions, updateVersion, removeVersion, reorderVersions } = useAppStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editTimestamp, setEditTimestamp] = useState('')

  // Start editing a version
  const startEditing = useCallback((version: JsonVersion) => {
    setEditingId(version.id)
    setEditLabel(version.label)
    setEditTimestamp(version.timestamp)
  }, [])

  // Save edits
  const saveEdit = useCallback(() => {
    if (!editingId) return

    const version = versions.find(v => v.id === editingId)
    if (!version) return

    updateVersion(editingId, {
      ...version,
      label: editLabel.trim() || version.label,
      timestamp: editTimestamp
    })

    setEditingId(null)
    setEditLabel('')
    setEditTimestamp('')
  }, [editingId, editLabel, editTimestamp, versions, updateVersion])

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditLabel('')
    setEditTimestamp('')
  }, [])

  // Handle reordering
  const handleReorder = useCallback((newOrder: JsonVersion[]) => {
    // The Reorder component from framer-motion handles the reordering automatically
    // We just need to update the store with the new order
    const newOrderIds = newOrder.map(v => v.id)
    const currentOrderIds = versions.map(v => v.id)
    
    // Find the moved item and its new position
    for (let i = 0; i < newOrderIds.length; i++) {
      if (newOrderIds[i] !== currentOrderIds[i]) {
        const fromIndex = currentOrderIds.indexOf(newOrderIds[i])
        const toIndex = i
        reorderVersions(fromIndex, toIndex)
        break
      }
    }
  }, [reorderVersions, versions])

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }, [])

  // Get source icon
  const getSourceIcon = useCallback((source: JsonVersion['source']) => {
    switch (source.type) {
      case 'paste':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
        )
      case 'file':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      case 'url':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }, [])

  if (versions.length === 0) {
    return (
      <div className={`p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No versions yet</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Upload some JSON to get started
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">JSON Versions</h2>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Reorder.Group
        axis="y"
        values={versions}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {versions.map((version) => (
          <Reorder.Item
            key={version.id}
            value={version}
            className="cursor-move"
          >
            <motion.div
              layout
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                    </svg>
                  </div>

                  {/* Source Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getSourceIcon(version.source)}
                  </div>

                  {/* Version Info */}
                  <div className="flex-1 min-w-0">
                    {editingId === version.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Version label"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit()
                            } else if (e.key === 'Escape') {
                              cancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <input
                          type="datetime-local"
                          value={editTimestamp.slice(0, 16)}
                          onChange={(e) => setEditTimestamp(e.target.value + ':00.000Z')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEdit}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {version.label}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(version.timestamp)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {version.source.type === 'file' && `File: ${version.source.ref}`}
                          {version.source.type === 'url' && `URL: ${version.source.ref}`}
                          {version.source.type === 'paste' && 'Pasted content'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== version.id && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEditing(version)}
                        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        title="Edit version"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeVersion(version.id)}
                        className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                        title="Remove version"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* JSON Preview */}
              {editingId !== version.id && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600 max-h-20 overflow-hidden">
                  {JSON.stringify(version.payload).slice(0, 100)}
                  {JSON.stringify(version.payload).length > 100 && '...'}
                </div>
              )}
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}

export default VersionList
