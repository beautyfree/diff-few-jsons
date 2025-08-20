'use client'

import React, { useState, Fragment } from 'react'
import { useAppStore } from '@/state/store'
import { Eye, Split } from 'lucide-react'
import SideBySideDiff from './SideBySideDiff'
import UnifiedDiff from './UnifiedDiff'

interface SequentialDiffsProps {
  className?: string
}

export default function SequentialDiffs({ className = '' }: SequentialDiffsProps) {
  const { versions } = useAppStore()
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('unified')
  const [hideUnchanged, setHideUnchanged] = useState(false)

  // Generate sequential pairs
  const sequentialPairs = versions.length >= 2 
    ? Array.from({ length: versions.length - 1 }, (_, i) => ({
        versionA: versions[i],
        versionB: versions[i + 1]
      }))
    : []



  return (
    <div className={`space-y-6 p-6 bg-card rounded-lg shadow-sm border border-border ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Sequential Differences</h2>
        <span className="text-sm text-muted-foreground">
          {Math.max(0, versions.length - 1)} comparison{versions.length !== 2 ? 's' : ''}
        </span>
      </div>

      {versions.length < 2 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Add at least 2 JSON files to see sequential differences</p>
        </div>
      ) : (
        <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">View Mode</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                viewMode === 'side-by-side'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <Split className="w-4 h-4" />
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                viewMode === 'unified'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              <Eye className="w-4 h-4" />
              Unified
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hideUnchanged"
              checked={hideUnchanged}
              onChange={(e) => setHideUnchanged(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="hideUnchanged" className="text-sm text-foreground cursor-pointer">
              Hide unchanged lines
            </label>
          </div>
        </div>
      </div>

      {sequentialPairs.map((pair) => (
        <Fragment key={`${pair.versionA.id}-${pair.versionB.id}`}>
          {viewMode === 'side-by-side' ? (
            <div className="overflow-x-auto">
              <SideBySideDiff 
                versionA={pair.versionA} 
                versionB={pair.versionB}
                hideUnchanged={hideUnchanged}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <UnifiedDiff 
                versionA={pair.versionA} 
                versionB={pair.versionB}
                hideUnchanged={hideUnchanged}
              />
            </div>
          )}
        </Fragment>
      ))}
        </div>
      )}
    </div>
  )
}
