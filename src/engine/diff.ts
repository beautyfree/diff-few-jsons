import * as jsondiffpatch from 'jsondiffpatch'
import type { DiffResult, DiffNode, DiffOptions } from '@/types/domain'
import { preprocessData } from './preprocess'
import { configureArrayStrategy, addArrayStrategyMetadata } from './arrays'

/**
 * jsondiffpatch instance with custom configuration
 */
const diffpatcher = jsondiffpatch.create({
  // Use objectHash for better array matching
  objectHash: (obj: any, index: number) => {
    if (obj && typeof obj === 'object' && obj.id !== undefined) {
      return obj.id
    }
    if (obj && typeof obj === 'object' && obj.name !== undefined) {
      return obj.name
    }
    return `$${index}`
  },
  // Arrays are matched by index by default
  arrays: {
    detectMove: true,
    includeValueOnMove: false
  },
  // Text diffs for strings
  textDiff: {
    minLength: 60
  }
})

/**
 * Convert jsondiffpatch delta to our DiffNode format
 */
function deltaToDiffNode(delta: any, path: string = ''): DiffNode | null {
  if (!delta) return null

  // Handle different types of deltas
  if (Array.isArray(delta)) {
    // Array delta: [0, 1, 2] where 0=unchanged, 1=added, 2=deleted, 3=modified
    const children: DiffNode[] = []
    let hasChanges = false

    for (let i = 0; i < delta.length; i++) {
      const item = delta[i]
      if (item === 0) {
        // Unchanged
        continue
      } else if (item === 1) {
        // Added
        hasChanges = true
        children.push({
          path: `${path}[${i}]`,
          kind: 'added',
          after: delta[i + 1]
        })
        i++ // Skip the value
      } else if (item === 2) {
        // Deleted
        hasChanges = true
        children.push({
          path: `${path}[${i}]`,
          kind: 'removed',
          before: delta[i + 1]
        })
        i++ // Skip the value
      } else if (item === 3) {
        // Modified
        hasChanges = true
        children.push({
          path: `${path}[${i}]`,
          kind: 'modified',
          before: delta[i + 1],
          after: delta[i + 2]
        })
        i += 2 // Skip both values
      }
    }

    if (!hasChanges) {
      return {
        path,
        kind: 'unchanged'
      }
    }

    return {
      path,
      kind: 'modified',
      children,
      meta: {
        countChanged: children.length
      }
    }
  } else if (typeof delta === 'object') {
    // Object delta - jsondiffpatch format
    const children: DiffNode[] = []
    let hasChanges = false

    for (const [key, value] of Object.entries(delta)) {
      const childPath = path ? `${path}.${key}` : key
      
      if (Array.isArray(value)) {
        if (value.length === 1) {
          // Single value - this is an addition
          children.push({
            path: childPath,
            kind: 'added',
            after: value[0]
          })
          hasChanges = true
        } else if (value.length === 2) {
          // Two values - this is a modification
          children.push({
            path: childPath,
            kind: 'modified',
            before: value[0],
            after: value[1]
          })
          hasChanges = true
        } else if (value.length === 3 && value[1] === 0 && value[2] === 0) {
          // Three values with [oldValue, 0, 0] - this is a deletion
          children.push({
            path: childPath,
            kind: 'removed',
            before: value[0]
          })
          hasChanges = true
        } else {
          // Complex array delta - recurse
          const child = deltaToDiffNode(value, childPath)
          if (child && child.kind !== 'unchanged') {
            children.push(child)
            hasChanges = true
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - recurse
        const child = deltaToDiffNode(value, childPath)
        if (child && child.kind !== 'unchanged') {
          children.push(child)
          hasChanges = true
        }
      } else {
        // Primitive value - this is a direct modification
        children.push({
          path: childPath,
          kind: 'modified',
          before: undefined,
          after: value
        })
        hasChanges = true
      }
    }

    if (!hasChanges) {
      return {
        path,
        kind: 'unchanged'
      }
    }

    return {
      path,
      kind: 'modified',
      children,
      meta: {
        countChanged: children.length
      }
    }
  }

  return null
}

/**
 * Count total nodes in a diff tree
 */
function countNodes(node: DiffNode): number {
  let count = 1 // Count this node
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

/**
 * Add virtualization hints for large arrays
 */
function addVirtualizationHints(node: DiffNode): DiffNode {
  if (node.children && node.children.length > 100) {
    if (node.meta) {
      node.meta.isTruncated = true
    } else {
      node.meta = { isTruncated: true }
    }
  }
  
  // Recursively process children
  if (node.children) {
    node.children = node.children.map(child => addVirtualizationHints(child))
  }
  
  return node
}

/**
 * Compute diff between two JSON objects
 */
export function computeJsonDiff(
  a: unknown,
  b: unknown,
  options: DiffOptions
): DiffResult {
  const startTime = performance.now()

  // Apply preprocessing (ignore rules and transforms)
  const processedA = preprocessData(a, options)
  const processedB = preprocessData(b, options)

  // Configure array strategy
  const arrayConfig = configureArrayStrategy(diffpatcher, options)

  // Compute the diff using jsondiffpatch
  const delta = diffpatcher.diff(processedA, processedB)

  // Convert to our DiffNode format
  let root: DiffNode = delta 
    ? deltaToDiffNode(delta, '') || { path: '', kind: 'unchanged' }
    : { path: '', kind: 'unchanged' }

  // Add array strategy metadata
  root = addArrayStrategyMetadata(root, arrayConfig.strategy, arrayConfig.keyPath)

  // Add virtualization hints for large arrays
  root = addVirtualizationHints(root)

  const computeTime = performance.now() - startTime

  return {
    versionA: '', // These will be set by the caller
    versionB: '',
    optionsKey: '', // This will be set by the caller
    root,
    stats: {
      nodes: countNodes(root),
      computeMs: Math.round(computeTime)
    }
  }
}


