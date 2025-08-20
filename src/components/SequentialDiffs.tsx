'use client'

import React, { useState } from 'react'
import { useAppStore } from '@/state/store'
import { Copy, Check, Eye, Split } from 'lucide-react'
import SideBySideDiff from './SideBySideDiff'
import UnifiedDiff from './UnifiedDiff'

export default function SequentialDiffs() {
  const { versions } = useAppStore()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('unified')
  const [hideUnchanged, setHideUnchanged] = useState(false)

  // Generate sequential pairs
  const sequentialPairs = versions.length >= 2 
    ? Array.from({ length: versions.length - 1 }, (_, i) => ({
        versionA: versions[i],
        versionB: versions[i + 1]
      }))
    : []

  const copyToClipboard = async (jsonA: any, jsonB: any, index: number) => {
    try {
      const diffText = JSON.stringify(jsonA, null, 2) + '\n\n---\n\n' + JSON.stringify(jsonB, null, 2)
      await navigator.clipboard.writeText(diffText)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (versions.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Add at least 2 JSON files to see sequential differences</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">View Mode</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                viewMode === 'side-by-side'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Split className="w-4 h-4" />
              Side by Side
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-3 py-1 text-sm rounded ${
                viewMode === 'unified'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            <label htmlFor="hideUnchanged" className="text-sm text-gray-700 cursor-pointer">
              Hide unchanged lines
            </label>
          </div>
        </div>
      </div>

      {sequentialPairs.map((pair, index) => (
        <div key={`${pair.versionA.id}-${pair.versionB.id}`} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {pair.versionA.label} → {pair.versionB.label}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(pair.versionA.payload, pair.versionB.payload, index)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy JSONs
                  </>
                )}
              </button>
            </div>
          </div>

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
        </div>
      ))}
    </div>
  )
}
