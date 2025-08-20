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

  const generateGitDiff = (versionA: any, versionB: any, labelA: string, labelB: string) => {
    const jsonA = JSON.stringify(versionA, null, 2)
    const jsonB = JSON.stringify(versionB, null, 2)
    
    const linesA = jsonA.split('\n')
    const linesB = jsonB.split('\n')
    
    // Generate random commit-like hashes
    const hashA = Math.random().toString(36).substr(2, 8)
    const hashB = Math.random().toString(36).substr(2, 8)
    
    const diffLines = [
      `diff --git a/${labelA}.json b/${labelB}.json`,
      `index ${hashA}..${hashB} 100644`,
      `--- a/${labelA}.json`,
      `+++ b/${labelB}.json`
    ]
    
    // Find chunks of changes
    const chunks: Array<{
      startA: number
      countA: number
      startB: number
      countB: number
      lines: string[]
    }> = []
    
    let currentChunk: typeof chunks[0] | null = null
    const maxLines = Math.max(linesA.length, linesB.length)
    
    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i]
      const lineB = linesB[i]
      
      if (lineA === lineB && lineA !== undefined) {
        // Unchanged line
        if (currentChunk) {
          // Add context line to current chunk
          currentChunk.lines.push(` ${lineA}`)
        }
      } else {
        // Different lines - start new chunk if needed
        if (!currentChunk) {
          currentChunk = {
            startA: Math.max(0, i - 2), // Include some context
            countA: 0,
            startB: Math.max(0, i - 2),
            countB: 0,
            lines: []
          }
          
          // Add context lines before the change
          for (let j = Math.max(0, i - 2); j < i; j++) {
            if (linesA[j] !== undefined) {
              currentChunk.lines.push(` ${linesA[j]}`)
              currentChunk.countA++
              currentChunk.countB++
            }
          }
        }
        
        // Add changed lines
        if (lineA !== undefined) {
          currentChunk.lines.push(`-${lineA}`)
          currentChunk.countA++
        }
        if (lineB !== undefined) {
          currentChunk.lines.push(`+${lineB}`)
          currentChunk.countB++
        }
        
        // Check if we should close this chunk
        const nextUnchangedCount = (() => {
          let count = 0
          for (let j = i + 1; j < maxLines && count < 6; j++) {
            if (linesA[j] === linesB[j] && linesA[j] !== undefined) {
              count++
            } else {
              break
            }
          }
          return count
        })()
        
        if (nextUnchangedCount >= 6 || i === maxLines - 1) {
          // Add a few context lines after the change
          for (let j = i + 1; j < Math.min(maxLines, i + 4); j++) {
            if (linesA[j] === linesB[j] && linesA[j] !== undefined) {
              currentChunk.lines.push(` ${linesA[j]}`)
              currentChunk.countA++
              currentChunk.countB++
            }
          }
          
          chunks.push(currentChunk)
          currentChunk = null
        }
      }
    }
    
    // Generate chunk headers and content
    chunks.forEach(chunk => {
      diffLines.push(`@@ -${chunk.startA + 1},${chunk.countA} +${chunk.startB + 1},${chunk.countB} @@`)
      diffLines.push(...chunk.lines)
    })
    
    return diffLines.join('\n')
  }

  const copyToClipboard = async (versionA: any, versionB: any, labelA: string, labelB: string, index: number) => {
    try {
      const gitDiff = generateGitDiff(versionA.payload, versionB.payload, labelA, labelB)
      await navigator.clipboard.writeText(gitDiff)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  if (versions.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Add at least 2 JSON files to see sequential differences</p>
      </div>
    )
  }

  return (
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

      {sequentialPairs.map((pair, index) => (
        <div key={`${pair.versionA.id}-${pair.versionB.id}`} className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {pair.versionA.label} → {pair.versionB.label}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(pair.versionA, pair.versionB, pair.versionA.label, pair.versionB.label, index)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Git Diff
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
