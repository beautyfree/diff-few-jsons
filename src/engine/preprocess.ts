import type { 
  DiffOptions, 
  IgnoreRule, 
  TransformRule, 
  DiffError,
  RoundTransformOptions,
  CustomTransformOptions,
  SortArrayTransformOptions
} from '@/types/domain'



/**
 * Check if a path matches a glob pattern
 */
function matchesGlob(path: string, pattern: string): boolean {
  // Simple glob matching - can be enhanced with a proper glob library
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

/**
 * Check if a path matches a regex pattern
 */
function matchesRegex(path: string, pattern: string): boolean {
  try {
    const regex = new RegExp(pattern)
    return regex.test(path)
  } catch {
    // Invalid regex pattern
    return false
  }
}

/**
 * Check if a path should be ignored based on ignore rules
 */
function shouldIgnorePath(path: string, ignoreRules: IgnoreRule[]): boolean {
  for (const rule of ignoreRules) {
    if (!rule.enabled) continue
    
    let matches = false
    switch (rule.type) {
      case 'keyPath':
        matches = path === rule.pattern
        break
      case 'glob':
        matches = matchesGlob(path, rule.pattern)
        break
      case 'regex':
        matches = matchesRegex(path, rule.pattern)
        break
    }
    
    if (matches) {
      return true
    }
  }
  
  return false
}

/**
 * Apply ignore rules to an object
 */
function applyIgnoreRules(obj: any, ignoreRules: IgnoreRule[], currentPath: string = ''): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item, index) => 
      applyIgnoreRules(item, ignoreRules, `${currentPath}[${index}]`)
    )
  }
  
  if (typeof obj === 'object') {
    const result: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key
      
      if (shouldIgnorePath(path, ignoreRules)) {
        continue // Skip this field
      }
      
      result[key] = applyIgnoreRules(value, ignoreRules, path)
    }
    
    return result
  }
  
  return obj
}

/**
 * Apply transform rules to a value
 */
function applyTransform(value: any, transformRules: TransformRule[], path: string): any {
  let result = value
  
  for (const rule of transformRules) {
    if (!rule.enabled) continue
    
    // Check if this rule applies to this path
    if (rule.targetPath) {
      if (rule.targetPath.includes('*')) {
        // Glob pattern
        if (!matchesGlob(path, rule.targetPath)) {
          continue
        }
      } else {
        // Exact path match
        if (path !== rule.targetPath) {
          continue
        }
      }
    }
    
    // Apply the transformation
    switch (rule.type) {
      case 'round':
        if (typeof result === 'number' && rule.options && 'decimals' in rule.options) {
          const options = rule.options as RoundTransformOptions
          const decimals = options.decimals ?? 0
          result = Math.round(Number(result) * Math.pow(10, decimals)) / Math.pow(10, decimals)
        }
        break
        
      case 'lowercase':
        if (typeof result === 'string') {
          result = result.toLowerCase()
        }
        break
        
      case 'uppercase':
        if (typeof result === 'string') {
          result = result.toUpperCase()
        }
        break
        
      case 'sortArray':
        if (Array.isArray(result)) {
          const options = rule.options as SortArrayTransformOptions | undefined
          if (options?.compare) {
            result = [...result].sort(options.compare)
          } else if (options?.descending) {
            result = [...result].sort().reverse()
          } else {
            result = [...result].sort()
          }
        }
        break
        
      case 'custom':
        if (rule.options && 'transform' in rule.options && typeof rule.options.transform === 'function') {
          const options = rule.options as CustomTransformOptions
          result = options.transform(result)
        }
        break
    }
  }
  
  return result
}

/**
 * Apply transform rules to an object
 */
function applyTransforms(obj: any, transformRules: TransformRule[], currentPath: string = ''): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (Array.isArray(obj)) {
    // First apply transforms to the array itself
    let result = applyTransform(obj, transformRules, currentPath)
    
    // Then apply transforms to each element
    if (Array.isArray(result)) {
      result = result.map((item, index) => 
        applyTransforms(item, transformRules, `${currentPath}[${index}]`)
      )
    }
    
    return result
  }
  
  if (typeof obj === 'object') {
    const result: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const path = currentPath ? `${currentPath}.${key}` : key
      result[key] = applyTransforms(value, transformRules, path)
    }
    
    return result
  }
  
  // Apply transforms to primitive values
  return applyTransform(obj, transformRules, currentPath)
}

/**
 * Validate ignore rule
 */
export function validateIgnoreRule(rule: IgnoreRule): DiffError | null {
  if (!rule.pattern || rule.pattern.trim() === '') {
    return {
      type: 'transform',
      message: 'Ignore rule pattern cannot be empty',
      details: { rule },
      recoverable: true
    }
  }
  
  if (rule.type === 'regex') {
    try {
      new RegExp(rule.pattern)
    } catch (error) {
      return {
        type: 'transform',
        message: `Invalid regex pattern: ${rule.pattern}`,
        details: { rule, error: error instanceof Error ? error.message : String(error) },
        recoverable: true
      }
    }
  }
  
  return null
}

/**
 * Validate transform rule
 */
export function validateTransformRule(rule: TransformRule): DiffError | null {
  if (rule.type === 'custom') {
    if (!rule.options || !('transform' in rule.options) || typeof rule.options.transform !== 'function') {
      return {
        type: 'transform',
        message: 'Custom transform rule must provide a transform function',
        details: { rule },
        recoverable: true
      }
    }
  }
  
  if (rule.type === 'round' && rule.options && 'decimals' in rule.options) {
    const options = rule.options as RoundTransformOptions
    const decimals = options.decimals
    if (typeof decimals !== 'number' || decimals < 0 || decimals > 20) {
      return {
        type: 'transform',
        message: 'Round transform decimals must be a number between 0 and 20',
        details: { rule, decimals },
        recoverable: true
      }
    }
  }
  
  return null
}

/**
 * Preprocess data by applying ignore rules and transforms
 */
export function preprocessData(data: unknown, options: DiffOptions): unknown {
  try {
    // Apply ignore rules first
    let result = applyIgnoreRules(data, options.ignoreRules)
    
    // Then apply transforms
    result = applyTransforms(result, options.transformRules)
    
    return result
  } catch (error) {
    // If preprocessing fails, return original data
    console.warn('Preprocessing failed, using original data:', error)
    return data
  }
}

/**
 * Validate all rules in options
 */
export function validateOptions(options: DiffOptions): DiffError[] {
  const errors: DiffError[] = []
  
  // Validate ignore rules
  for (const rule of options.ignoreRules) {
    const error = validateIgnoreRule(rule)
    if (error) {
      errors.push(error)
    }
  }
  
  // Validate transform rules
  for (const rule of options.transformRules) {
    const error = validateTransformRule(rule)
    if (error) {
      errors.push(error)
    }
  }
  
  return errors
}
