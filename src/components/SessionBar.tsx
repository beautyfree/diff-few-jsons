'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/state/store'
import type { Session } from '@/types/domain'
import { 
  Save, 
  Download, 
  Upload, 
  FileText, 
  Sun, 
  Moon, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  X
} from 'lucide-react'

interface SessionBarProps {
  className?: string
}

interface NotificationState {
  show: boolean
  type: 'success' | 'error'
  message: string
}

function SessionBar({ className = '' }: SessionBarProps) {
  const store = useAppStore()
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  })
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

  // Check if localStorage is available
  const isLocalStorageAvailable = useCallback(() => {
    try {
      const test = 'localStorage-test'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }, [])

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }, [])

  // Create session object from current state
  const createSession = useCallback((): Session => {
    return {
      versions: store.versions,
      options: store.options,
      selection: store.selection,
      ui: store.ui,
      meta: {
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        appVersion: '1.0.0'
      }
    }
  }, [store.versions, store.options, store.selection, store.ui])

  // Save session to localStorage
  const saveToLocalStorage = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      showNotification('error', 'localStorage is not available in this browser')
      return
    }

    try {
      const session = createSession()
      const sessionKey = `json-diff-session-${Date.now()}`
      localStorage.setItem(sessionKey, JSON.stringify(session))
      
      // Also save as "latest" for quick access
      localStorage.setItem('json-diff-session-latest', JSON.stringify(session))
      
      showNotification('success', 'Session saved to browser storage')
    } catch (error) {
      showNotification('error', 'Failed to save session to localStorage')
      console.error('Save to localStorage error:', error)
    }
  }, [createSession, isLocalStorageAvailable, showNotification])

  // Export session as JSON file
  const exportSession = useCallback(() => {
    try {
      const session = createSession()
      const blob = new Blob([JSON.stringify(session, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `json-diff-session-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showNotification('success', 'Session exported successfully')
    } catch (error) {
      showNotification('error', 'Failed to export session')
      console.error('Export session error:', error)
    }
  }, [createSession, showNotification])

  // Load session from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (!isLocalStorageAvailable()) {
      showNotification('error', 'localStorage is not available in this browser')
      return
    }

    try {
      const sessionData = localStorage.getItem('json-diff-session-latest')
      if (!sessionData) {
        showNotification('error', 'No saved session found in browser storage')
        return
      }

      const session: Session = JSON.parse(sessionData)
      
      // Restore state
      store.reset()
      session.versions.forEach(version => {
        store.addVersion(version)
      })
      store.setTheme(session.ui.theme)
      
      showNotification('success', 'Session loaded from browser storage')
    } catch (error) {
      showNotification('error', 'Failed to load session from localStorage')
      console.error('Load from localStorage error:', error)
    }
  }, [isLocalStorageAvailable, showNotification, store])

  // Import session from file
  const importSession = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const sessionData = e.target?.result as string
        const session: Session = JSON.parse(sessionData)
        
        // Validate session structure
        if (!session.versions || !session.options || !session.ui) {
          throw new Error('Invalid session file format')
        }
        
        // Restore state
        store.reset()
        session.versions.forEach(version => {
          store.addVersion(version)
        })
        store.setTheme(session.ui.theme)
        
        showNotification('success', `Session imported successfully (${session.versions.length} versions)`)
      } catch (error) {
        showNotification('error', 'Failed to import session - invalid file format')
        console.error('Import session error:', error)
      }
    }
    reader.onerror = () => {
      showNotification('error', 'Failed to read session file')
    }
    reader.readAsText(file)
  }, [showNotification, store])

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      importSession(file)
      // Reset file input
      if (fileInputRef) {
        fileInputRef.value = ''
      }
    }
  }, [importSession, fileInputRef])

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = store.ui.theme === 'light' ? 'dark' : 'light'
    store.setTheme(newTheme)
    showNotification('success', `Switched to ${newTheme} theme`)
  }, [store, showNotification])

  // Auto-save to localStorage periodically
  useEffect(() => {
    if (!isLocalStorageAvailable()) return

    const autoSaveInterval = setInterval(() => {
      if (store.versions.length > 0) {
        try {
          const session = createSession()
          localStorage.setItem('json-diff-session-autosave', JSON.stringify(session))
        } catch (error) {
          console.warn('Auto-save failed:', error)
        }
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [store.versions.length, createSession, isLocalStorageAvailable])

  return (
    <div className={`relative p-6 bg-card rounded-lg shadow-sm border border-border ${className}`}>
      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="text-lg font-semibold text-foreground">Session</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Save to localStorage */}
          {isLocalStorageAvailable() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={saveToLocalStorage}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Save session to browser storage"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>
          )}

          {/* Export Session */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportSession}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            title="Export session as JSON file"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>

          {/* Import Session */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef?.click()}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            title="Import session from JSON file"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </motion.button>

          {/* Load from localStorage */}
          {isLocalStorageAvailable() && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadFromLocalStorage}
              className="flex items-center space-x-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              title="Load latest session from browser storage"
            >
              <FileText className="w-4 h-4" />
              <span>Load</span>
            </motion.button>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center space-x-1 px-3 py-2 text-sm rounded-md transition-all duration-300 bg-secondary text-secondary-foreground hover:bg-accent"
            title={`Switch to ${store.ui.theme === 'light' ? 'dark' : 'light'} theme`}
          >
            <motion.div
              animate={{ rotate: store.ui.theme === 'light' ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {store.ui.theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </motion.div>
            <span>{store.ui.theme === 'light' ? 'Dark' : 'Light'}</span>
          </motion.button>
        </div>
      </div>

      {/* Storage Info */}
      {!isLocalStorageAvailable() && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Limited Storage</p>
              <p>Browser storage is not available. You can still export and import sessions as JSON files.</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={setFileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import session file"
      />

      {/* Notifications */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`flex items-start space-x-2 p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  notification.type === 'success' 
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-400' 
                    : 'text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SessionBar
