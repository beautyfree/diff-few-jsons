'use client'

import React, { useState, useMemo } from 'react'
import { useAppStore } from '@/state/store'
import { Eye, Split, TrendingUp } from 'lucide-react'
import SideBySideDiff from './SideBySideDiff'
import UnifiedDiff from './UnifiedDiff'
import { motion, AnimatePresence } from 'framer-motion'

interface SequentialDiffsProps {
  className?: string
}

export default function SequentialDiffs({ className = '' }: SequentialDiffsProps) {
  const { versions } = useAppStore()
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('unified')
  const [hideUnchanged, setHideUnchanged] = useState(true)

  // Generate sequential pairs
  const sequentialPairs = useMemo(() => 
    versions.length >= 2 
      ? Array.from({ length: versions.length - 1 }, (_, i) => ({
          versionA: versions[i],
          versionB: versions[i + 1]
        }))
      : [], [versions]
  )

  return (
    <div className={`space-y-8 p-8 bg-card rounded-xl shadow-lg border border-border/50 backdrop-blur-sm ${className}`}>
      {/* Modern Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sequential Differences
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.max(0, versions.length - 1)} comparison{versions.length !== 2 ? 's' : ''} • Track changes over time
          </p>
        </div>
      </motion.div>

      {versions.length < 2 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No comparisons yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Add at least 2 JSON files to start comparing and tracking changes over time
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Modern Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border/30"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">View:</span>
                <div className="flex bg-background rounded-lg p-1 border border-border/50">
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                      viewMode === 'side-by-side'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Split className="w-4 h-4" />
                    Side by Side
                  </button>
                  <button
                    onClick={() => setViewMode('unified')}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${
                      viewMode === 'unified'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Unified
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hideUnchanged}
                    onChange={(e) => setHideUnchanged(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`flex items-center px-1 box-content w-5 h-4 rounded-full transition-all duration-200 ${
                    hideUnchanged ? 'bg-primary' : 'bg-muted'
                  }`}>
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 transform ${
                      hideUnchanged ? 'translate-x-2' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  Hide unchanged
                </span>
              </label>
            </div>
          </motion.div>

          {/* Diff Pairs */}
          <AnimatePresence>
            {sequentialPairs.map((pair, index) => (
              <motion.div
                key={`${pair.versionA.id}-${pair.versionB.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-background/50 rounded-xl border border-border/50 overflow-hidden shadow-sm">
                  {viewMode === 'side-by-side' ? (
                    <SideBySideDiff 
                      versionA={pair.versionA} 
                      versionB={pair.versionB}
                      hideUnchanged={hideUnchanged}
                    />
                  ) : (
                    <UnifiedDiff 
                      versionA={pair.versionA} 
                      versionB={pair.versionB}
                      hideUnchanged={hideUnchanged}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
