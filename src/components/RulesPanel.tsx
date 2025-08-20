'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/state/store'
import type { IgnoreRule, TransformRule } from '@/types/domain'
import { Plus, X, Eye, EyeOff, Settings, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface RulesPanelProps {
  className?: string
}

interface IgnoreRuleFormData {
  type: IgnoreRule['type']
  pattern: string
}

interface TransformRuleFormData {
  type: TransformRule['type']
  targetPath: string
  decimals?: number
  descending?: boolean
}

function RulesPanel({ className = '' }: RulesPanelProps) {
  const { 
    options, 
    ui,
    addIgnoreRule, 
    updateIgnoreRule, 
    removeIgnoreRule,
    addTransformRule,
    updateTransformRule,
    removeTransformRule,
    setRulesPanelExpanded,
    clearCache
  } = useAppStore()

  const [showIgnoreForm, setShowIgnoreForm] = useState(false)
  const [showTransformForm, setShowTransformForm] = useState(false)
  const [ignoreFormData, setIgnoreFormData] = useState<IgnoreRuleFormData>({ type: 'keyPath', pattern: '' })
  const [transformFormData, setTransformFormData] = useState<TransformRuleFormData>({ type: 'lowercase', targetPath: '' })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateIgnoreRule = useCallback((data: IgnoreRuleFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!data.pattern.trim()) {
      errors.pattern = 'Pattern is required'
      return errors
    }

    if (data.type === 'regex') {
      try {
        new RegExp(data.pattern)
      } catch (e) {
        errors.pattern = 'Invalid regex pattern'
      }
    }

    if (data.type === 'keyPath' && !data.pattern.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/)) {
      if (!data.pattern.includes('[') && !data.pattern.includes('*')) {
        errors.pattern = 'Invalid key path format. Use dot notation like "user.name" or wildcards like "user.*"'
      }
    }

    return errors
  }, [])

  const validateTransformRule = useCallback((data: TransformRuleFormData): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    if (!data.targetPath.trim()) {
      errors.targetPath = 'Target path is required'
    }

    if (data.type === 'round') {
      if (data.decimals === undefined || data.decimals < 0 || data.decimals > 20) {
        errors.decimals = 'Decimals must be between 0 and 20'
      }
    }

    return errors
  }, [])

  const handleAddIgnoreRule = useCallback(() => {
    const errors = validateIgnoreRule(ignoreFormData)
    setValidationErrors(errors)

    if (Object.keys(errors).length === 0) {
      addIgnoreRule({
        type: ignoreFormData.type,
        pattern: ignoreFormData.pattern,
        enabled: true
      })
      setIgnoreFormData({ type: 'keyPath', pattern: '' })
      setShowIgnoreForm(false)
      clearCache() // Clear cache when rules change
    }
  }, [ignoreFormData, validateIgnoreRule, addIgnoreRule, clearCache])

  const handleAddTransformRule = useCallback(() => {
    const errors = validateTransformRule(transformFormData)
    setValidationErrors(errors)

    if (Object.keys(errors).length === 0) {
      const rule: Omit<TransformRule, 'id'> = {
        type: transformFormData.type,
        targetPath: transformFormData.targetPath,
        enabled: true
      }

      if (transformFormData.type === 'round' && transformFormData.decimals !== undefined) {
        rule.options = { decimals: transformFormData.decimals }
      }

      if (transformFormData.type === 'sortArray') {
        rule.options = { descending: transformFormData.descending || false }
      }

      addTransformRule(rule)
      setTransformFormData({ type: 'lowercase', targetPath: '' })
      setShowTransformForm(false)
      clearCache() // Clear cache when rules change
    }
  }, [transformFormData, validateTransformRule, addTransformRule, clearCache])

  const handleToggleIgnoreRule = useCallback((id: string, enabled: boolean) => {
    updateIgnoreRule(id, { enabled })
    clearCache() // Clear cache when rules change
  }, [updateIgnoreRule, clearCache])

  const handleToggleTransformRule = useCallback((id: string, enabled: boolean) => {
    updateTransformRule(id, { enabled })
    clearCache() // Clear cache when rules change
  }, [updateTransformRule, clearCache])

  const handleRemoveIgnoreRule = useCallback((id: string) => {
    removeIgnoreRule(id)
    clearCache() // Clear cache when rules change
  }, [removeIgnoreRule, clearCache])

  const handleRemoveTransformRule = useCallback((id: string) => {
    removeTransformRule(id)
    clearCache() // Clear cache when rules change
  }, [removeTransformRule, clearCache])

  const getRuleTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'keyPath': return 'Key Path'
      case 'glob': return 'Glob Pattern'
      case 'regex': return 'Regular Expression'
      case 'round': return 'Round Numbers'
      case 'lowercase': return 'Lowercase'
      case 'uppercase': return 'Uppercase'
      case 'sortArray': return 'Sort Arrays'
      case 'custom': return 'Custom Transform'
      default: return type
    }
  }, [])

  const getTransformDescription = useCallback((rule: TransformRule) => {
    switch (rule.type) {
      case 'round':
        const decimals = (rule.options as any)?.decimals ?? 2
        return `Round to ${decimals} decimal places`
      case 'sortArray':
        const desc = (rule.options as any)?.descending
        return desc ? 'Sort descending' : 'Sort ascending'
      case 'lowercase':
        return 'Convert to lowercase'
      case 'uppercase':
        return 'Convert to uppercase'
      case 'custom':
        return 'Apply custom transformation'
      default:
        return ''
    }
  }, [])

  const totalRules = options.ignoreRules.length + options.transformRules.length
  const activeRules = options.ignoreRules.filter(r => r.enabled).length + options.transformRules.filter(r => r.enabled).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setRulesPanelExpanded(!ui.rulesPanelExpanded)}
          className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
        >
          {ui.rulesPanelExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          <Settings className="w-5 h-5" />
          <span>Rules Panel</span>
        </button>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{activeRules} of {totalRules} active</span>
        </div>
      </div>

      <AnimatePresence>
        {ui.rulesPanelExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-6"
          >
            {/* Ignore Rules Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-800">Ignore Rules</h3>
                <button
                  onClick={() => {
                    setShowIgnoreForm(true)
                    setValidationErrors({})
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Rule</span>
                </button>
              </div>

              {/* Ignore Rules List */}
              <div className="space-y-2">
                {options.ignoreRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    layout
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                          {getRuleTypeLabel(rule.type)}
                        </span>
                        <code className="text-sm font-mono text-gray-700">{rule.pattern}</code>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleIgnoreRule(rule.id, !rule.enabled)}
                        className={`p-1 rounded ${
                          rule.enabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                        } transition-colors`}
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveIgnoreRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Remove rule"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {options.ignoreRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No ignore rules defined</p>
                    <p className="text-sm">Add rules to exclude fields from diff comparison</p>
                  </div>
                )}
              </div>

              {/* Add Ignore Rule Form */}
              <AnimatePresence>
                {showIgnoreForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h4 className="font-medium text-gray-800">Add Ignore Rule</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="ignore-rule-type" className="block text-sm font-medium text-gray-700 mb-1">
                            Rule Type
                          </label>
                          <select
                            id="ignore-rule-type"
                            value={ignoreFormData.type}
                            onChange={(e) => setIgnoreFormData({ ...ignoreFormData, type: e.target.value as IgnoreRule['type'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="keyPath">Key Path</option>
                            <option value="glob">Glob Pattern</option>
                            <option value="regex">Regular Expression</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="ignore-rule-pattern" className="block text-sm font-medium text-gray-700 mb-1">
                            Pattern
                          </label>
                          <input
                            id="ignore-rule-pattern"
                            type="text"
                            value={ignoreFormData.pattern}
                            onChange={(e) => setIgnoreFormData({ ...ignoreFormData, pattern: e.target.value })}
                            placeholder={
                              ignoreFormData.type === 'keyPath' ? 'user.email' :
                              ignoreFormData.type === 'glob' ? '*.timestamp' :
                              '\\d{4}-\\d{2}-\\d{2}'
                            }
                            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              validationErrors.pattern ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.pattern && (
                            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>{validationErrors.pattern}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setShowIgnoreForm(false)
                            setValidationErrors({})
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddIgnoreRule}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add Rule
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Transform Rules Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-gray-800">Transform Rules</h3>
                <button
                  onClick={() => {
                    setShowTransformForm(true)
                    setValidationErrors({})
                  }}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Rule</span>
                </button>
              </div>

              {/* Transform Rules List */}
              <div className="space-y-2">
                {options.transformRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    layout
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {getRuleTypeLabel(rule.type)}
                        </span>
                        <code className="text-sm font-mono text-gray-700">{rule.targetPath}</code>
                      </div>
                      <div className="text-xs text-gray-600">
                        {getTransformDescription(rule)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleTransformRule(rule.id, !rule.enabled)}
                        className={`p-1 rounded ${
                          rule.enabled ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'
                        } transition-colors`}
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveTransformRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Remove rule"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {options.transformRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No transform rules defined</p>
                    <p className="text-sm">Add rules to modify values before comparison</p>
                  </div>
                )}
              </div>

              {/* Add Transform Rule Form */}
              <AnimatePresence>
                {showTransformForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                      <h4 className="font-medium text-gray-800">Add Transform Rule</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="transform-rule-type" className="block text-sm font-medium text-gray-700 mb-1">
                            Transform Type
                          </label>
                          <select
                            id="transform-rule-type"
                            value={transformFormData.type}
                            onChange={(e) => setTransformFormData({ ...transformFormData, type: e.target.value as TransformRule['type'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="lowercase">Lowercase</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="round">Round Numbers</option>
                            <option value="sortArray">Sort Arrays</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="transform-rule-target" className="block text-sm font-medium text-gray-700 mb-1">
                            Target Path
                          </label>
                          <input
                            id="transform-rule-target"
                            type="text"
                            value={transformFormData.targetPath}
                            onChange={(e) => setTransformFormData({ ...transformFormData, targetPath: e.target.value })}
                            placeholder="user.name"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              validationErrors.targetPath ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.targetPath && (
                            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>{validationErrors.targetPath}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Transform-specific options */}
                      {transformFormData.type === 'round' && (
                        <div>
                          <label htmlFor="transform-rule-decimals" className="block text-sm font-medium text-gray-700 mb-1">
                            Decimal Places
                          </label>
                          <input
                            id="transform-rule-decimals"
                            type="number"
                            min="0"
                            max="20"
                            value={transformFormData.decimals ?? 2}
                            onChange={(e) => setTransformFormData({ ...transformFormData, decimals: parseInt(e.target.value) })}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              validationErrors.decimals ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.decimals && (
                            <div className="flex items-center space-x-1 mt-1 text-red-600 text-sm">
                              <AlertCircle className="w-4 h-4" />
                              <span>{validationErrors.decimals}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {transformFormData.type === 'sortArray' && (
                        <div>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={transformFormData.descending || false}
                              onChange={(e) => setTransformFormData({ ...transformFormData, descending: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Sort in descending order</span>
                          </label>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setShowTransformForm(false)
                            setValidationErrors({})
                          }}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddTransformRule}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Add Rule
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rules Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How Rules Work:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• <strong>Ignore rules</strong> exclude fields from diff comparison entirely</li>
                    <li>• <strong>Transform rules</strong> modify values before comparison</li>
                    <li>• Rules are applied in the order they appear</li>
                    <li>• Disabled rules are ignored during computation</li>
                    <li>• Changes to rules will clear the diff cache</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RulesPanel
