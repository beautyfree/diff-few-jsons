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

  // Smart comparison that matches fields and sorts first JSON under second
  const processedA = new Set<number>()
  const processedB = new Set<number>()
  
  // Helper function to extract field name from JSON line
  const getFieldName = (line: string): string | null => {
    const match = line.match(/^\s*"([^"]+)"\s*:/)
    return match ? match[1] : null
  }
  
  // First pass: find exact matches and track their positions
  const matches: Array<{a: number, b: number}> = []
  
  for (let i = 0; i < linesA.length; i++) {
    for (let j = 0; j < linesB.length; j++) {
      if (!processedA.has(i) && !processedB.has(j) && linesA[i] === linesB[j]) {
        matches.push({a: i, b: j})
        processedA.add(i)
        processedB.add(j)
      }
    }
  }
  
  // Second pass: find modified fields (same field name, different value)
  const modifiedFields: Array<{a: number, b: number}> = []
  
  for (let i = 0; i < linesA.length; i++) {
    if (processedA.has(i)) continue
    
    const fieldNameA = getFieldName(linesA[i])
    if (!fieldNameA) continue
    
    for (let j = 0; j < linesB.length; j++) {
      if (processedB.has(j)) continue
      
      const fieldNameB = getFieldName(linesB[j])
      if (fieldNameB === fieldNameA) {
        // Same field name, different value - this is a modification
        modifiedFields.push({a: i, b: j})
        processedA.add(i)
        processedB.add(j)
        break
      }
    }
  }
  
  // Sort matches by position in second file (B) to maintain order
  matches.sort((a, b) => a.b - b.b)
  modifiedFields.sort((a, b) => a.b - b.b)
  
  // Combine all matches and sort by position in second file
  const allMatches = [...matches, ...modifiedFields].sort((a, b) => a.b - b.b)
  
  // Create unified lines based on smart comparison
  const unifiedLines: Array<{
    content: string
    type: 'unchanged' | 'added' | 'removed'
    lineNumber?: number
  }> = []
  
  let currentA = 0
  let currentB = 0
  
  for (const match of allMatches) {
    // Add any unmatched lines from A before this match
    while (currentA < match.a) {
      if (!processedA.has(currentA)) {
        unifiedLines.push({
          content: linesA[currentA],
          type: 'removed',
          lineNumber: currentA + 1
        })
      }
      currentA++
    }
    
    // Add any unmatched lines from B before this match
    while (currentB < match.b) {
      if (!processedB.has(currentB)) {
        unifiedLines.push({
          content: linesB[currentB],
          type: 'added',
          lineNumber: currentB + 1
        })
      }
      currentB++
    }
    
    // Check if this is a modification or exact match
    const isModification = modifiedFields.some(m => m.a === match.a && m.b === match.b)
    
    if (isModification) {
      // Show modification as removed then added
      unifiedLines.push({
        content: linesA[match.a],
        type: 'removed',
        lineNumber: match.a + 1
      })
      unifiedLines.push({
        content: linesB[match.b],
        type: 'added',
        lineNumber: match.b + 1
      })
    } else {
      // Show exact match
      unifiedLines.push({
        content: linesA[match.a],
        type: 'unchanged',
        lineNumber: match.a + 1
      })
    }
    
    currentA = match.a + 1
    currentB = match.b + 1
  }
  
  // Add remaining unmatched lines
  while (currentA < linesA.length) {
    if (!processedA.has(currentA)) {
      unifiedLines.push({
        content: linesA[currentA],
        type: 'removed',
        lineNumber: currentA + 1
      })
    }
    currentA++
  }
  
  while (currentB < linesB.length) {
    if (!processedB.has(currentB)) {
      unifiedLines.push({
        content: linesB[currentB],
        type: 'added',
        lineNumber: currentB + 1
      })
    }
    currentB++
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
