import type { DiffOptions, DiffNode } from '@/types/domain'

/**
 * Detect if an array contains objects that could be keyed
 */
export function detectKeyableArray(arr: any[]): { keyable: boolean; keyPath?: string } {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { keyable: false }
  }

  // Check if all items are objects
  if (!arr.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
    return { keyable: false }
  }

  // Common key fields to check
  const commonKeys = ['id', 'name', 'key', 'uuid', 'identifier']
  
  for (const key of commonKeys) {
    if (arr.every(item => item[key] !== undefined)) {
      // Check if all values are unique
      const values = arr.map(item => item[key])
      const uniqueValues = new Set(values)
      
      if (uniqueValues.size === arr.length && arr.length > 0) {
        return { keyable: true, keyPath: key }
      }
    }
  }

  // If we get here, no unique key was found
  return { keyable: false }
}

/**
 * Create a keyed array matcher for jsondiffpatch
 */
export function createKeyedArrayMatcher(keyPath: string) {
  return {
    objectHash: (obj: any) => {
      if (obj && typeof obj === 'object' && obj[keyPath] !== undefined) {
        return String(obj[keyPath])
      }
      return undefined
    },
    matchByPosition: false
  }
}

/**
 * Configure jsondiffpatch for array strategy
 */
export function configureArrayStrategy(
  diffpatcher: any,
  options: DiffOptions
): { strategy: 'index' | 'keyed'; keyPath?: string } {
  const { arrayStrategy, arrayKeyPath } = options

  if (arrayStrategy === 'keyed' && arrayKeyPath) {
    // Use keyed strategy with specified key path
    diffpatcher.processor.objectHash = (obj: any) => {
      if (obj && typeof obj === 'object' && obj[arrayKeyPath] !== undefined) {
        return String(obj[arrayKeyPath])
      }
      return undefined
    }
    diffpatcher.processor.matchByPosition = false
    
    return { strategy: 'keyed', keyPath: arrayKeyPath }
  } else {
    // Use index-based strategy (default)
    diffpatcher.processor.objectHash = undefined
    diffpatcher.processor.matchByPosition = true
    
    return { strategy: 'index' }
  }
}

/**
 * Add array strategy metadata to diff nodes
 */
export function addArrayStrategyMetadata(
  node: DiffNode,
  strategy: 'index' | 'keyed',
  keyPath?: string
): DiffNode {
  if (node.meta) {
    node.meta.arrayStrategy = strategy
  } else {
    node.meta = { arrayStrategy: strategy }
  }

  // Recursively add metadata to children
  if (node.children) {
    node.children = node.children.map(child => 
      addArrayStrategyMetadata(child, strategy, keyPath)
    )
  }

  return node
}

/**
 * Suggest array strategy based on data analysis
 */
export function suggestArrayStrategy(data: unknown): {
  suggested: 'index' | 'keyed';
  confidence: number;
  keyPath?: string;
  reason: string;
} {
  if (!Array.isArray(data)) {
    return {
      suggested: 'index',
      confidence: 1.0,
      reason: 'Not an array'
    }
  }

  if (data.length === 0) {
    return {
      suggested: 'index',
      confidence: 1.0,
      reason: 'Empty array'
    }
  }

  // Check if it's an array of primitives
  if (data.every(item => 
    typeof item === 'string' || 
    typeof item === 'number' || 
    typeof item === 'boolean' ||
    item === null
  )) {
    return {
      suggested: 'index',
      confidence: 0.9,
      reason: 'Array of primitives - index-based matching is appropriate'
    }
  }

  // Check if it's an array of objects
  if (data.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
    const { keyable, keyPath } = detectKeyableArray(data)
    
    if (keyable && keyPath) {
      return {
        suggested: 'keyed',
        confidence: 0.8,
        keyPath,
        reason: `Array contains objects with unique '${keyPath}' field`
      }
    } else {
      return {
        suggested: 'index',
        confidence: 0.7,
        reason: 'Array contains objects but no consistent unique identifier found'
      }
    }
  }

  // Mixed array
  return {
    suggested: 'index',
    confidence: 0.6,
    reason: 'Mixed array content - index-based matching is safest'
  }
}

/**
 * Validate array strategy configuration
 */
export function validateArrayStrategy(options: DiffOptions): {
  valid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = []
  const suggestions: string[] = []

  if (options.arrayStrategy === 'keyed' && !options.arrayKeyPath) {
    errors.push('Keyed array strategy requires arrayKeyPath to be specified')
  }

  if (options.arrayKeyPath && options.arrayStrategy !== 'keyed') {
    suggestions.push('arrayKeyPath is specified but arrayStrategy is not set to "keyed"')
  }

  return {
    valid: errors.length === 0,
    errors,
    suggestions
  }
}

/**
 * Get array strategy information for display
 */
export function getArrayStrategyInfo(options: DiffOptions): {
  strategy: string;
  description: string;
  keyPath?: string;
} {
  if (options.arrayStrategy === 'keyed' && options.arrayKeyPath) {
    return {
      strategy: 'Keyed',
      description: `Arrays are matched by the '${options.arrayKeyPath}' field`,
      keyPath: options.arrayKeyPath
    }
  } else {
    return {
      strategy: 'Index',
      description: 'Arrays are matched by position (index)'
    }
  }
}
