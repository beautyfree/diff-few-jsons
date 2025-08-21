'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/state/store'

export default function NotificationContainer() {
  const notifications = useAppStore(state => state.ui.notifications)
  const removeNotification = useAppStore(state => state.removeNotification)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      default:
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
    }
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
    }
  }

  const getTextStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-800 dark:text-emerald-200'
      case 'error':
        return 'text-red-800 dark:text-red-200'
      case 'warning':
        return 'text-amber-800 dark:text-amber-200'
      case 'info':
        return 'text-blue-800 dark:text-blue-200'
      default:
        return 'text-blue-800 dark:text-blue-200'
    }
  }

  const getButtonStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-400'
      case 'error':
        return 'text-red-600 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-400'
      case 'warning':
        return 'text-amber-600 dark:text-amber-400 hover:bg-amber-600 dark:hover:bg-amber-400'
      case 'info':
        return 'text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-400'
      default:
        return 'text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-400'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div className={`flex items-start space-x-2 p-4 rounded-lg shadow-xl max-w-sm backdrop-blur-sm ${getNotificationStyles(notification.type)}`}>
              {getNotificationIcon(notification.type)}
              <div className="flex-1">
                <p className={`text-sm font-medium ${getTextStyles(notification.type)}`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className={`p-1 rounded hover:bg-opacity-20 transition-colors ${getButtonStyles(notification.type)}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
