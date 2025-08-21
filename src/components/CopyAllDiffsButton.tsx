'use client'

import { useState } from 'react'
import { JsonVersion } from '@/types/domain'
import { Copy, Check } from 'lucide-react'

interface CopyAllDiffsButtonProps {
  versions: JsonVersion[]
  className?: string
}

export default function CopyAllDiffsButton({ versions, className = '' }: CopyAllDiffsButtonProps) {
  const [copied, setCopied] = useState(false)

  const generateAllGitDiffs = () => {
    if (versions.length < 2) {
      return 'No versions to compare'
    }

    const allDiffs: string[] = []
    
    // Generate sequential pairs
    for (let i = 0; i < versions.length - 1; i++) {
      const versionA = versions[i]
      const versionB = versions[i + 1]
      
      const jsonA = JSON.stringify(versionA.payload, null, 2)
      const jsonB = JSON.stringify(versionB.payload, null, 2)
      
      const linesA = jsonA.split('\n')
      const linesB = jsonB.split('\n')
      
      // Generate random commit-like hashes
      const hashA = Math.random().toString(36).substr(2, 8)
      const hashB = Math.random().toString(36).substr(2, 8)
      
      const diffLines = [
        `diff --git a/${versionA.label}.json b/${versionB.label}.json`,
        `index ${hashA}..${hashB} 100644`,
        `--- a/${versionA.label}.json`,
        `+++ b/${versionB.label}.json`
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
      
      allDiffs.push(diffLines.join('\n'))
    }
    
    return allDiffs.join('\n\n')
  }

  const handleCopy = async () => {
    try {
      const content = generateAllGitDiffs()
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (versions.length < 2) {
    return null
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          All Diffs Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy All Diffs ({versions.length - 1})
        </>
      )}
    </button>
  )
}
