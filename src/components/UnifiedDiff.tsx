'use client'

import React from 'react'
import { JsonVersion } from '@/types/domain'
import CopyButton from './CopyButton'

interface UnifiedDiffProps {
  versionA: JsonVersion
  versionB: JsonVersion
  className?: string
  hideUnchanged?: boolean
}

export default function UnifiedDiff({ versionA, versionB, className = '', hideUnchanged = false }: UnifiedDiffProps) {
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

  // Create a unified diff view
  const unifiedLines: Array<{
    content: string
    type: 'unchanged' | 'added' | 'removed'
    lineNumber?: number
  }> = []

  let lineNumberA = 1
  let lineNumberB = 1

  // Simple line-by-line comparison for unified view
  const maxLines = Math.max(linesA.length, linesB.length)
  
  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i]
    const lineB = linesB[i]
    
    if (lineA === lineB && lineA !== undefined) {
      // Same line - show once
      unifiedLines.push({
        content: lineA,
        type: 'unchanged',
        lineNumber: lineNumberA
      })
      lineNumberA++
      lineNumberB++
    } else {
      // Different lines - show removal then addition
      if (lineA !== undefined) {
        unifiedLines.push({
          content: lineA,
          type: 'removed',
          lineNumber: lineNumberA
        })
        lineNumberA++
      }
      if (lineB !== undefined) {
        unifiedLines.push({
          content: lineB,
          type: 'added',
          lineNumber: lineNumberB
        })
        lineNumberB++
      }
    }
  }

  // Group unchanged lines and add context separators
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
    <div className={`bg-card border border-border rounded-lg overflow-hidden font-mono text-sm ${className}`}>
      {/* Header */}
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">
          {versionA.label} → {versionB.label}
        </div>
        <CopyButton versionA={versionA} versionB={versionB} />
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {processedLines.map((line, index) => {
          if ('type' in line && line.type === 'separator') {
            return (
              <div
                key={index}
                className="flex px-2 py-1 text-muted-foreground text-center justify-center"
              >
                <span className="text-xs italic">{line.content}</span>
              </div>
            )
          }
          
          return (
            <div
              key={index}
              className={`flex px-2 py-1 min-h-[1.2rem] border-l-4 ${
                line.type === 'removed' 
                              ? 'bg-diff-removed-bg text-diff-removed-text border-diff-removed'
            : line.type === 'added'
            ? 'bg-diff-added-bg text-diff-added-text border-diff-added'
                    : 'bg-card text-foreground border-card'
              }`}
            >
              {/* Prefix */}
              <span className="text-muted-foreground mr-2 w-4 flex-shrink-0">
                {line.type === 'removed' ? '-' : line.type === 'added' ? '+' : ' '}
              </span>
              
              {/* Line number */}
              <span className="text-muted-foreground mr-2 w-8 text-right flex-shrink-0">
                {line.lineNumber || ''}
              </span>
              
              {/* Content */}
              <span className="whitespace-pre-wrap break-words flex-1">
                {line.content || '\u00A0'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="bg-muted border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-diff-removed-bg border border-diff-removed"></span>
            <span>- Removed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-diff-added-bg border border-diff-added"></span>
            <span>+ Added</span>
          </div>
        </div>
      </div>
    </div>
  )
}
