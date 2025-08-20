'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, X, Info } from 'lucide-react'
import { useAppStore } from '@/state/store'
import { 
  slideVariants,
  listItemVariants,
  springConfigs
} from '@/utils/motion'

interface ConsentProps {
  className?: string
}

interface ConsentState {
  serverProcessing: boolean
  dataRetention: boolean
  analytics: boolean
  timestamp: string
}

export function Consent({ className = '' }: ConsentProps) {
  const { addNotification } = useAppStore()
  const [showConsent, setShowConsent] = useState(false)
  const [consentState, setConsentState] = useState<ConsentState>({
    serverProcessing: false,
    dataRetention: false,
    analytics: false,
    timestamp: new Date().toISOString()
  })

  // Check if consent is needed on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem('user-consent')
    if (!savedConsent) {
      setShowConsent(true)
    } else {
      try {
        const parsed = JSON.parse(savedConsent) as ConsentState
        setConsentState(parsed)
      } catch (error) {
        // Invalid consent data, show consent dialog
        setShowConsent(true)
      }
    }
  }, [])

  const handleConsentChange = (key: keyof ConsentState, value: boolean) => {
    setConsentState(prev => ({
      ...prev,
      [key]: value,
      timestamp: new Date().toISOString()
    }))
  }

  const handleSaveConsent = () => {
    localStorage.setItem('user-consent', JSON.stringify(consentState))
    setShowConsent(false)
    
    addNotification({
      id: 'consent-saved',
      type: 'success',
      title: 'Consent saved',
      message: 'Your privacy preferences have been saved.',
      duration: 3000
    })
  }

  const handleDeclineAll = () => {
    const declinedConsent: ConsentState = {
      serverProcessing: false,
      dataRetention: false,
      analytics: false,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('user-consent', JSON.stringify(declinedConsent))
    setConsentState(declinedConsent)
    setShowConsent(false)
    
    addNotification({
      id: 'consent-declined',
      type: 'info',
      title: 'Privacy mode enabled',
      message: 'All processing will happen locally in your browser.',
      duration: 5000
    })
  }

  const handleRevokeConsent = () => {
    localStorage.removeItem('user-consent')
    setShowConsent(true)
    
    addNotification({
      id: 'consent-revoked',
      type: 'info',
      title: 'Consent revoked',
      message: 'Please review and update your privacy preferences.',
      duration: 4000
    })
  }

  const getConsentStatus = () => {
    if (consentState.serverProcessing) {
      return {
        status: 'enabled',
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: 'Server processing enabled',
        description: 'Large files may be processed on the server for better performance.'
      }
    } else {
      return {
        status: 'disabled',
        icon: <Shield className="w-4 h-4 text-blue-500" />,
        text: 'Local processing only',
        description: 'All data processing happens locally in your browser for maximum privacy.'
      }
    }
  }

  const consentStatus = getConsentStatus()

  return (
    <>
      {/* Consent Status Indicator */}
      <motion.div 
        className={`flex items-center space-x-2 text-sm ${className}`}
        variants={listItemVariants}
        initial="hidden"
        animate="visible"
      >
        {consentStatus.icon}
        <div>
          <div className="font-medium text-gray-900">{consentStatus.text}</div>
          <div className="text-gray-600">{consentStatus.description}</div>
        </div>
        <motion.button
          onClick={handleRevokeConsent}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Update privacy preferences"
        >
          <Info className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Consent Dialog */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              variants={listItemVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Privacy & Consent
                  </h2>
                </div>
                <motion.button
                  onClick={handleDeclineAll}
                  className="text-gray-400 hover:text-gray-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                <div className="text-gray-600">
                  <p className="mb-4">
                    We respect your privacy. Please review and choose your preferences for data processing:
                  </p>
                </div>

                {/* Server Processing Consent */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="serverProcessing"
                      checked={consentState.serverProcessing}
                      onChange={(e) => handleConsentChange('serverProcessing', e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="serverProcessing" className="block font-medium text-gray-900">
                        Server-side processing
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Allow large JSON files to be processed on our servers for better performance. 
                        Data is not stored and is deleted immediately after processing.
                      </p>
                      {consentState.serverProcessing && (
                        <motion.div
                          className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800">
                              <strong>Note:</strong> This will send your data to our servers for processing. 
                              We do not store or share your data.
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Retention Consent */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="dataRetention"
                      checked={consentState.dataRetention}
                      onChange={(e) => handleConsentChange('dataRetention', e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="dataRetention" className="block font-medium text-gray-900">
                        Session storage
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Save your session data (versions, rules, preferences) locally in your browser 
                        for convenience across browser sessions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics Consent */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={consentState.analytics}
                      onChange={(e) => handleConsentChange('analytics', e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="block font-medium text-gray-900">
                        Usage analytics
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Help us improve by sharing anonymous usage statistics. No personal data is collected.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-2">Privacy Commitment</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your data never leaves your browser unless you explicitly consent</li>
                    <li>• No personal information is collected or stored</li>
                    <li>• All processing is done locally by default</li>
                    <li>• You can change these preferences at any time</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <motion.button
                  onClick={handleDeclineAll}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Decline All
                </motion.button>
                <motion.button
                  onClick={handleSaveConsent}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Preferences
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Consent
