'use client'

import React from 'react'
import { JsonVersion } from '@/types/domain'
import CopyButton from './CopyButton'

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
    type: 'unchanged' | 'added' | 'removed'
    lineNumberA?: number
    lineNumberB?: number
  }> = []

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
  
  // Build unified lines based on matches
  let currentA = 0
  let currentB = 0
  
  for (const match of allMatches) {
    // Add any unmatched lines from A before this match
    while (currentA < match.a) {
      if (!processedA.has(currentA)) {
        unifiedLines.push({
          lineA: linesA[currentA],
          lineB: null,
          type: 'removed',
          lineNumberA: currentA + 1
        })
      }
      currentA++
    }
    
    // Add any unmatched lines from B before this match
    while (currentB < match.b) {
      if (!processedB.has(currentB)) {
        unifiedLines.push({
          lineA: null,
          lineB: linesB[currentB],
          type: 'added',
          lineNumberB: currentB + 1
        })
      }
      currentB++
    }
    
    // Check if this is a modification or exact match
    const isModification = modifiedFields.some(m => m.a === match.a && m.b === match.b)
    
    // Add the matched line
    unifiedLines.push({
      lineA: linesA[match.a],
      lineB: linesB[match.b],
      type: isModification ? 'removed' : 'unchanged',
      lineNumberA: match.a + 1,
      lineNumberB: match.b + 1
    })
    
    currentA = match.a + 1
    currentB = match.b + 1
  }
  
  // Add remaining unmatched lines
  while (currentA < linesA.length) {
    if (!processedA.has(currentA)) {
      unifiedLines.push({
        lineA: linesA[currentA],
        lineB: null,
        type: 'removed',
        lineNumberA: currentA + 1
      })
    }
    currentA++
  }
  
  while (currentB < linesB.length) {
    if (!processedB.has(currentB)) {
      unifiedLines.push({
        lineA: null,
        lineB: linesB[currentB],
        type: 'added',
        lineNumberB: currentB + 1
      })
    }
    currentB++
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
      <div className="bg-muted border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex flex-1">
          <div className="flex-1 text-sm font-medium text-foreground">
            {versionA.label}
          </div>
          <div className="flex-1 text-sm font-medium text-foreground border-l border-border pl-4">
            {versionB.label}
          </div>
        </div>
        <CopyButton versionA={versionA} versionB={versionB} />
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
              <div className={`flex-1 border-r px-2 py-1 flex border-l-4 ${
                line.type === 'removed' 
                  ? 'bg-diff-removed-bg text-diff-removed-text border-diff-removed' 
                  : 'bg-card text-foreground border-card'
              }`}>
                <span className="text-muted-foreground mr-2 w-8 text-right flex-shrink-0">
                  {line.lineNumberA || ''}
                </span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.lineA || '\u00A0'}</span>
              </div>

              {/* Right side - Modified */}
              <div className={`flex-1 px-2 py-1 flex border-l-4 ${
                line.type === 'removed' && line.lineB !== null
                  ? 'bg-diff-added-bg text-diff-added-text border-diff-added' 
                  : line.type === 'added'
                    ? 'bg-diff-added-bg text-diff-added-text border-diff-added' 
                    : 'bg-card text-foreground border-card'
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
        </div>
      </div>
    </div>
  )
}
