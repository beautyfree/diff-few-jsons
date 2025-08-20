'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/state/store'
import type { JsonVersion } from '@/types/domain'

interface UploadError {
  id: string
  message: string
  type: 'parse' | 'network' | 'validation' | 'duplicate'
}

interface UploadStatus {
  id: string
  status: 'idle' | 'loading' | 'success' | 'error'
  progress?: number
}

function UploadPanel() {
  const { addVersion, versions } = useAppStore()
  const [errors, setErrors] = useState<UploadError[]>([])
  const [statuses, setStatuses] = useState<UploadStatus[]>([])
  const [pasteText, setPasteText] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [isUrlLoading, setIsUrlLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Generate unique ID for uploads
  const generateId = () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Add error to the list
  const addError = useCallback((error: UploadError) => {
    setErrors(prev => [...prev, error])
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== error.id))
    }, 5000)
  }, [])

  // Update status for an upload
  const updateStatus = useCallback((id: string, status: UploadStatus['status'], progress?: number) => {
    setStatuses(prev => {
      const existing = prev.find(s => s.id === id)
      if (existing) {
        return prev.map(s => s.id === id ? { ...s, status, progress } : s)
      }
      return [...prev, { id, status, progress }]
    })
  }, [])

  // Validate and parse JSON
  const parseJsonInput = useCallback((input: string, source: string): unknown => {
    try {
      const parsed = JSON.parse(input)
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Input must be a JSON object or array')
      }
      return parsed
    } catch (error) {
      throw new Error(`Invalid JSON in ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [])

  // Check for duplicates by content hash
  const isDuplicate = useCallback((content: unknown): boolean => {
    const contentStr = JSON.stringify(content)
    return versions.some(version => JSON.stringify(version.payload) === contentStr)
  }, [versions])

  // Handle paste input
  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) return

    const id = generateId()
    updateStatus(id, 'loading')

    try {
      const parsed = parseJsonInput(pasteText, 'pasted content')
      
      if (isDuplicate(parsed)) {
        updateStatus(id, 'error')
        addError({
          id,
          message: 'This JSON content already exists in your versions',
          type: 'duplicate'
        })
        return
      }

      const version: JsonVersion = {
        id: `paste_${Date.now()}`,
        label: `Pasted JSON ${versions.length + 1}`,
        timestamp: new Date().toISOString(),
        source: {
          type: 'paste',
          ref: 'pasted content'
        },
        payload: parsed
      }

      addVersion(version)
      updateStatus(id, 'success')
      setPasteText('')
    } catch (error) {
      updateStatus(id, 'error')
      addError({
        id,
        message: error instanceof Error ? error.message : 'Failed to parse pasted content',
        type: 'parse'
      })
    }
  }, [pasteText, versions.length, parseJsonInput, isDuplicate, addVersion, updateStatus, addError])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const id = generateId()
      updateStatus(id, 'loading')

      try {
        // Validate file type
        if (!file.name.endsWith('.json')) {
          throw new Error('Only JSON files are supported')
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB')
        }

        const text = await file.text()
        const parsed = parseJsonInput(text, file.name)
        
        if (isDuplicate(parsed)) {
          updateStatus(id, 'error')
          addError({
            id,
            message: `File "${file.name}" contains duplicate content`,
            type: 'duplicate'
          })
          continue
        }

        const version: JsonVersion = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          label: file.name.replace('.json', ''),
          timestamp: new Date().toISOString(),
          source: {
            type: 'file',
            ref: file.name
          },
          payload: parsed
        }

        addVersion(version)
        updateStatus(id, 'success')
      } catch (error) {
        updateStatus(id, 'error')
        addError({
          id,
          message: `Failed to process "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: error instanceof Error && error.message.includes('JSON') ? 'parse' : 'validation'
        })
      }
    }
  }, [parseJsonInput, isDuplicate, addVersion, updateStatus, addError])

  // Handle URL fetch
  const handleUrlFetch = useCallback(async () => {
    if (!urlInput.trim()) return

    const id = generateId()
    setIsUrlLoading(true)
    updateStatus(id, 'loading')

    try {
      const url = new URL(urlInput)
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()
      const parsed = parseJsonInput(text, url.toString())
      
      if (isDuplicate(parsed)) {
        updateStatus(id, 'error')
        addError({
          id,
          message: 'This URL contains duplicate content',
          type: 'duplicate'
        })
        return
      }

      const version: JsonVersion = {
        id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: url.hostname,
        timestamp: new Date().toISOString(),
        source: {
          type: 'url',
          ref: url.toString()
        },
        payload: parsed
      }

      addVersion(version)
      updateStatus(id, 'success')
      setUrlInput('')
    } catch (error) {
      updateStatus(id, 'error')
      addError({
        id,
        message: `Failed to fetch from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'network'
      })
    } finally {
      setIsUrlLoading(false)
    }
  }, [urlInput, parseJsonInput, isDuplicate, addVersion, updateStatus, addError])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files)
    // Reset input to allow selecting the same file again
    if (e.target) {
      e.target.value = ''
    }
  }, [handleFileUpload])

  return (
    <div className="space-y-6 p-6 bg-card rounded-lg shadow-sm border border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Upload JSON</h2>
        <span className="text-sm text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? 's' : ''} loaded
        </span>
      </div>

      {/* Error Toasts */}
      <AnimatePresence>
        {errors.map(error => (
          <motion.div
            key={error.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-md border-l-4 ${
              error.type === 'parse' ? 'bg-red-50 border-red-400 text-red-700' :
              error.type === 'network' ? 'bg-orange-50 border-orange-400 text-orange-700' :
              error.type === 'validation' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
              'bg-blue-50 border-blue-400 text-blue-700'
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {error.type === 'parse' && (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {error.type === 'network' && (
                  <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {error.type === 'validation' && (
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {error.type === 'duplicate' && (
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Paste Zone */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Paste JSON
        </label>
        <div className="flex space-x-2">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your JSON here..."
            className="flex-1 min-h-[100px] px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-card text-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handlePasteSubmit()
              }
            }}
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteText.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* File Upload Zone */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Upload Files
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary'
          }`}
        >
                      <svg className="mx-auto h-12 w-12 text-muted-foreground" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Select files
            </button>
                          <p className="mt-2 text-sm text-muted-foreground">
                or drag and drop JSON files here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* URL Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          Fetch from URL
        </label>
        <div className="flex space-x-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/api/data.json"
            className="flex-1 px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUrlFetch()
              }
            }}
          />
          <button
            onClick={handleUrlFetch}
            disabled={!urlInput.trim() || isUrlLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUrlLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Fetching...
              </div>
            ) : (
              'Fetch'
            )}
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      {statuses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Recent Uploads</h3>
          <div className="space-y-1">
            {statuses.slice(-5).map(status => (
              <div key={status.id} className="flex items-center text-sm">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  status.status === 'loading' ? 'bg-yellow-400 animate-pulse' :
                  status.status === 'success' ? 'bg-green-400' :
                  'bg-red-400'
                }`} />
                <span className="text-muted-foreground">
                  {status.status === 'loading' && 'Processing...'}
                  {status.status === 'success' && 'Upload successful'}
                  {status.status === 'error' && 'Upload failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadPanel
