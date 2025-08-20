import type { 
  TransformRule, 
  RoundTransformOptions, 
  CustomTransformOptions, 
  SortArrayTransformOptions 
} from '@/types/domain'

/**
 * Examples of properly typed transform rules
 */

// Round transform with proper options
export const roundTransformExample: TransformRule = {
  id: 'round-prices',
  type: 'round',
  targetPath: 'price',
  options: {
    decimals: 2
  } as RoundTransformOptions,
  enabled: true
}

// Custom transform with proper options
export const customTransformExample: TransformRule = {
  id: 'normalize-email',
  type: 'custom',
  targetPath: 'email',
  options: {
    transform: (value: unknown) => {
      if (typeof value === 'string') {
        return value.toLowerCase().trim()
      }
      return value
    }
  } as CustomTransformOptions,
  enabled: true
}

// Array sorting with custom comparison
export const sortArrayTransformExample: TransformRule = {
  id: 'sort-users-by-name',
  type: 'sortArray',
  targetPath: 'users',
  options: {
    compare: (a: unknown, b: unknown) => {
      if (typeof a === 'object' && a && 'name' in a && 
          typeof b === 'object' && b && 'name' in b) {
        const nameA = String(a.name).toLowerCase()
        const nameB = String(b.name).toLowerCase()
        return nameA.localeCompare(nameB)
      }
      return 0
    }
  } as SortArrayTransformOptions,
  enabled: true
}

// Array sorting in descending order
export const sortArrayDescendingExample: TransformRule = {
  id: 'sort-numbers-desc',
  type: 'sortArray',
  targetPath: 'scores',
  options: {
    descending: true
  } as SortArrayTransformOptions,
  enabled: true
}

// Simple case transform (no options needed)
export const caseTransformExample: TransformRule = {
  id: 'uppercase-names',
  type: 'uppercase',
  targetPath: 'name',
  enabled: true
}

/**
 * Example usage in a diff options object
 */
export const exampleDiffOptions = {
  arrayStrategy: 'index' as const,
  arrayKeyPath: undefined,
  ignoreRules: [
    {
      id: 'ignore-timestamps',
      type: 'keyPath' as const,
      pattern: 'timestamp',
      enabled: true
    }
  ],
  transformRules: [
    roundTransformExample,
    customTransformExample,
    sortArrayTransformExample,
    caseTransformExample
  ]
}
