'use client'

import React from 'react'
import { JsonVersion } from '@/types/domain'

interface SideBySideDiffProps {
  versionA: JsonVersion
  versionB: JsonVersion
  className?: string
  hideUnchanged?: boolean
}

export default function SideBySideDiff({ versionA, versionB, className = '', hideUnchanged = false }: SideBySideDiffProps) {
  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2)
    } catch {
      return 'Invalid JSON'
    }
  }

  const jsonA = formatJson(versionA.payload)
  const jsonB = formatJson(versionB.payload)

  const linesA = jsonA.split('\n')
  const linesB = jsonB.split('\n')

  // Create a unified diff view with line numbers
  const unifiedLines: Array<{
    lineA: string | null
    lineB: string | null
    type: 'unchanged' | 'added' | 'removed' | 'modified'
    lineNumberA?: number
    lineNumberB?: number
  }> = []

  let lineNumberA = 1
  let lineNumberB = 1

  // Simple line-by-line comparison
  const maxLines = Math.max(linesA.length, linesB.length)
  
  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i] || null
    const lineB = linesB[i] || null
    
    if (lineA === lineB) {
      // Same line
      unifiedLines.push({
        lineA,
        lineB,
        type: 'unchanged',
        lineNumberA: lineNumberA++,
        lineNumberB: lineNumberB++
      })
    } else if (lineA === null) {
      // Added line
      unifiedLines.push({
        lineA: null,
        lineB,
        type: 'added',
        lineNumberB: lineNumberB++
      })
    } else if (lineB === null) {
      // Removed line
      unifiedLines.push({
        lineA,
        lineB: null,
        type: 'removed',
        lineNumberA: lineNumberA++
      })
    } else {
      // Modified line
      unifiedLines.push({
        lineA,
        lineB,
        type: 'modified',
        lineNumberA: lineNumberA++,
        lineNumberB: lineNumberB++
      })
    }
  }

  // Group unchanged lines and add context separators (same logic as UnifiedDiff)
  const processedLines = hideUnchanged ? (() => {
    const result: Array<typeof unifiedLines[0] | { type: 'separator', content: string }> = []
    let unchangedGroup: typeof unifiedLines = []
    
    for (let i = 0; i < unifiedLines.length; i++) {
      const line = unifiedLines[i]
      
      if (line.type === 'unchanged') {
        unchangedGroup.push(line)
      } else {
        // Process accumulated unchanged lines
        if (unchangedGroup.length > 0) {
          if (unchangedGroup.length <= 6) {
            // Show all if 6 or fewer unchanged lines
            result.push(...unchangedGroup)
          } else {
            // Show first 3 and last 3, with separator in between
            result.push(...unchangedGroup.slice(0, 3))
            result.push({
              type: 'separator',
              content: `... ${unchangedGroup.length - 6} unchanged lines ...`
            })
            result.push(...unchangedGroup.slice(-3))
          }
          unchangedGroup = []
        }
        
        // Add the changed line
        result.push(line)
      }
    }
    
    // Process any remaining unchanged lines
    if (unchangedGroup.length > 0) {
      if (unchangedGroup.length <= 6) {
        result.push(...unchangedGroup)
      } else {
        result.push(...unchangedGroup.slice(0, 3))
        result.push({
          type: 'separator',
          content: `... ${unchangedGroup.length - 6} unchanged lines ...`
        })
        result.push(...unchangedGroup.slice(-3))
      }
    }
    
    return result
  })() : unifiedLines

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 py-2 flex">
        <div className="flex-1 text-sm font-medium text-foreground">
          {versionA.label}
        </div>
        <div className="flex-1 text-sm font-medium text-foreground border-l border-border pl-4">
          {versionB.label}
        </div>
      </div>

      {/* Content */}
      <div className="font-mono text-sm overflow-x-auto">
                {processedLines.map((line, index) => {
          if ('type' in line && line.type === 'separator') {
            return (
              <div key={index} className="flex min-h-[1.2rem]">
                <div className="flex-1 border-r border-border px-2 py-1 flex text-muted-foreground text-center justify-center">
                  <span className="text-xs italic">{line.content}</span>
                </div>
                <div className="flex-1 px-2 py-1 flex text-muted-foreground text-center justify-center">
                  <span className="text-xs italic">{line.content}</span>
                </div>
              </div>
            )
          }

          return (
            <div key={index} className="flex min-h-[1.2rem]">
              {/* Left side - Original */}
              <div className={`flex-1 border-r border-border px-2 py-1 flex ${
                line.type === 'removed' 
                  ? 'bg-diff-removed-bg text-diff-removed-text border-l-4 border-diff-removed' 
                  : line.type === 'modified'
                    ? 'bg-diff-modified-bg text-diff-modified-text' 
                    : 'bg-card text-foreground'
              }`}>
                <span className="text-muted-foreground mr-2 w-8 text-right flex-shrink-0">
                  {line.lineNumberA || ''}
                </span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.lineA || '\u00A0'}</span>
              </div>

              {/* Right side - Modified */}
              <div className={`flex-1 px-2 py-1 flex ${
                line.type === 'added' 
                  ? 'bg-diff-added-bg text-diff-added-text border-l-4 border-diff-added' 
                  : line.type === 'modified'
                    ? 'bg-diff-modified-bg text-diff-modified-text' 
                    : 'bg-card text-foreground'
              }`}>
                <span className="text-muted-foreground mr-2 w-8 text-right flex-shrink-0">
                  {line.lineNumberB || ''}
                </span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.lineB || '\u00A0'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-muted border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-diff-removed-bg border-l-4 border-diff-removed"></div>
            <span>Removed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-diff-added-bg border-l-4 border-diff-added"></div>
            <span>Added</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-diff-modified-bg"></div>
            <span>Modified (Left)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-diff-modified-bg"></div>
            <span>Modified (Right)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
