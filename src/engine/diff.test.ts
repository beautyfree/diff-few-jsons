import { describe, it, expect, beforeEach } from 'vitest'
import { computeJsonDiff } from './diff'
import { preprocessData, validateOptions } from './preprocess'
import { suggestArrayStrategy, detectKeyableArray } from './arrays'
import type { DiffOptions, IgnoreRule, TransformRule } from '@/types/domain'

// Import test fixtures
import simpleFixtures from '../../fixtures/simple-objects.json'
import largeFixtures from '../../fixtures/large-arrays.json'

describe('Diff Engine', () => {
  let defaultOptions: DiffOptions

  beforeEach(() => {
    defaultOptions = {
      arrayStrategy: 'index',
      arrayKeyPath: undefined,
      ignoreRules: [],
      transformRules: []
    }
  })

  describe('Basic Diff Operations', () => {
    it('should detect no changes for identical objects', () => {
      const obj = { name: 'John', age: 30 }
      const result = computeJsonDiff(obj, obj, defaultOptions)
      
      expect(result.root.kind).toBe('unchanged')
      expect(result.stats.nodes).toBe(1)
    })

    it('should detect added properties', () => {
      const before = { name: 'John' }
      const after = { name: 'John', age: 30 }
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.children).toHaveLength(1)
      expect(result.root.children![0].kind).toBe('added')
      expect(result.root.children![0].path).toBe('age')
      expect(result.root.children![0].after).toBe(30)
    })

    it('should detect removed properties', () => {
      const before = { name: 'John', age: 30 }
      const after = { name: 'John' }
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.children).toHaveLength(1)
      expect(result.root.children![0].kind).toBe('removed')
      expect(result.root.children![0].path).toBe('age')
      expect(result.root.children![0].before).toBe(30)
    })

    it('should detect modified properties', () => {
      const before = { name: 'John', age: 30 }
      const after = { name: 'John', age: 31 }
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.children).toHaveLength(1)
      expect(result.root.children![0].kind).toBe('modified')
      expect(result.root.children![0].path).toBe('age')
      expect(result.root.children![0].before).toBe(30)
      expect(result.root.children![0].after).toBe(31)
    })
  })

  describe('Nested Object Diffs', () => {
    it('should handle nested object changes', () => {
      const { before, after } = simpleFixtures['nested-objects']
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.children).toBeDefined()
      
      // Should detect changes in nested profile
      const profileChanges = result.root.children!.filter(child => 
        child.path.includes('profile') || (child.children && child.children.some(grandchild => grandchild.path.includes('profile')))
      )
      expect(profileChanges.length).toBeGreaterThan(0)
    })

    it('should preserve object structure in unchanged parts', () => {
      const before = {
        user: {
          id: 1,
          profile: { name: 'John', age: 30 }
        }
      }
      const after = {
        user: {
          id: 1,
          profile: { name: 'John', age: 31 }
        }
      }
      const result = computeJsonDiff(before, after, defaultOptions)
      
      // Only the age should be marked as changed
      const userNode = result.root.children?.find(child => 
        child.path === 'user'
      )
      expect(userNode?.kind).toBe('modified')
      expect(userNode?.children).toBeDefined()
      
      const profileNode = userNode?.children?.find(child => 
        child.path === 'user.profile'
      )
      expect(profileNode?.kind).toBe('modified')
      expect(profileNode?.children).toBeDefined()
      
      const ageNode = profileNode?.children?.find(child => 
        child.path === 'user.profile.age'
      )
      expect(ageNode?.kind).toBe('modified')
      expect(ageNode?.before).toBe(30)
      expect(ageNode?.after).toBe(31)
    })
  })

  describe('Array Diffs', () => {
    it('should handle primitive array changes with index strategy', () => {
      const { before, after } = simpleFixtures['array-changes']
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.children).toBeDefined()
      
      // Should detect array changes
      const arrayNode = result.root.children?.find(child => 
        child.path === 'items'
      )
      expect(arrayNode?.kind).toBe('modified')
      expect(arrayNode?.meta?.arrayStrategy).toBe('index')
    })

    it('should handle object array changes with keyed strategy', () => {
      const { before, after } = simpleFixtures['object-array']
      const options: DiffOptions = {
        ...defaultOptions,
        arrayStrategy: 'keyed',
        arrayKeyPath: 'id'
      }
      const result = computeJsonDiff(before, after, options)
      
      expect(result.root.kind).toBe('modified')
      expect(result.root.meta?.arrayStrategy).toBe('keyed')
      
      // Should detect changes in specific objects by ID
      const usersNode = result.root.children?.find(child => 
        child.path === 'users'
      )
      expect(usersNode?.kind).toBe('modified')
    })

    it('should suggest keyed strategy for arrays with unique IDs', () => {
      const { before } = simpleFixtures['object-array']
      const suggestion = suggestArrayStrategy(before.users)
      
      expect(suggestion.suggested).toBe('keyed')
      expect(suggestion.keyPath).toBe('id')
      expect(suggestion.confidence).toBeGreaterThan(0.7)
    })
  })

  describe('Large Array Performance', () => {
    it('should handle large primitive arrays efficiently', () => {
      const { before, after } = largeFixtures['large-primitive-array']
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.stats.computeMs).toBeLessThan(1000) // Should complete in under 1 second
      expect(result.stats.nodes).toBeGreaterThan(1000) // Should have many nodes
      expect(result.root.meta?.arrayStrategy).toBe('index')
    })

    it('should handle large object arrays efficiently', () => {
      const { before, after } = largeFixtures['large-object-array']
      const result = computeJsonDiff(before, after, defaultOptions)
      
      expect(result.stats.computeMs).toBeLessThan(2000) // Should complete in under 2 seconds
      expect(result.stats.nodes).toBeGreaterThan(1000) // Should have many nodes
    })

    it('should provide virtualization hints for large arrays', () => {
      const { before, after } = largeFixtures['large-object-array']
      const result = computeJsonDiff(before, after, defaultOptions)
      
      // Check if large arrays are marked for virtualization
      const usersNode = result.root.children?.find(child => 
        child.path === 'users'
      )
      expect(usersNode?.meta?.isTruncated).toBeDefined()
    })
  })

  describe('Ignore Rules', () => {
    it('should ignore specified fields', () => {
      const before = { name: 'John', age: 30, timestamp: '2023-01-01' }
      const after = { name: 'John', age: 31, timestamp: '2023-01-02' }
      
      const options: DiffOptions = {
        ...defaultOptions,
        ignoreRules: [
          {
            id: 'ignore-timestamp',
            type: 'keyPath',
            pattern: 'timestamp',
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should not detect timestamp changes
      const timestampNode = result.root.children?.find(child => 
        child.path === 'timestamp'
      )
      expect(timestampNode).toBeUndefined()
      
      // Should still detect age changes
      const ageNode = result.root.children?.find(child => 
        child.path === 'age'
      )
      expect(ageNode?.kind).toBe('modified')
    })

    it('should handle glob patterns', () => {
      const before = { 
        user: { name: 'John', age: 30 },
        temp: { data: 'old' },
        cache: { data: 'old' }
      }
      const after = { 
        user: { name: 'John', age: 31 },
        temp: { data: 'new' },
        cache: { data: 'new' }
      }
      
      const options: DiffOptions = {
        ...defaultOptions,
        ignoreRules: [
          {
            id: 'ignore-temp',
            type: 'glob',
            pattern: 'temp.*',
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should ignore temp.data changes
      const tempNode = result.root.children?.find(child => 
        child.path.includes('temp')
      )
      expect(tempNode).toBeUndefined()
      
      // Should still detect other changes
      const userNode = result.root.children?.find(child => 
        child.path === 'user'
      )
      expect(userNode?.kind).toBe('modified')
      
      const ageNode = userNode?.children?.find(child => 
        child.path === 'user.age'
      )
      expect(ageNode?.kind).toBe('modified')
    })

    it('should handle regex patterns', () => {
      const before = { 
        user_id: 1,
        user_name: 'John',
        group_id: 2,
        group_name: 'Admin'
      }
      const after = { 
        user_id: 2,
        user_name: 'Jane',
        group_id: 2,
        group_name: 'Admin'
      }
      
      const options: DiffOptions = {
        ...defaultOptions,
        ignoreRules: [
          {
            id: 'ignore-ids',
            type: 'regex',
            pattern: '.*_id$',
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should ignore *_id changes
      const idNodes = result.root.children?.filter(child => 
        child.path.includes('_id')
      )
      expect(idNodes).toHaveLength(0)
      
      // Should still detect name changes
      const nameNodes = result.root.children?.filter(child => 
        child.path.includes('_name')
      )
      expect(nameNodes?.length).toBeGreaterThan(0)
    })
  })

  describe('Transform Rules', () => {
    it('should apply rounding transforms', () => {
      const before = { value: 3.14159 }
      const after = { value: 3.14160 }
      
      const options: DiffOptions = {
        ...defaultOptions,
        transformRules: [
          {
            id: 'round-value',
            type: 'round',
            targetPath: 'value',
            options: { decimals: 2 },
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should not detect changes after rounding to 2 decimals
      expect(result.root.kind).toBe('unchanged')
    })

    it('should apply case transforms', () => {
      const before = { name: 'John Doe' }
      const after = { name: 'JOHN DOE' }
      
      const options: DiffOptions = {
        ...defaultOptions,
        transformRules: [
          {
            id: 'lowercase-name',
            type: 'lowercase',
            targetPath: 'name',
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should not detect changes after converting to lowercase
      expect(result.root.kind).toBe('unchanged')
    })

    it('should apply array sorting transforms', () => {
      const before = { items: ['c', 'a', 'b'] }
      const after = { items: ['b', 'a', 'c'] }
      
      const options: DiffOptions = {
        ...defaultOptions,
        transformRules: [
          {
            id: 'sort-items',
            type: 'sortArray',
            targetPath: 'items',
            enabled: true
          }
        ]
      }
      
      const result = computeJsonDiff(before, after, options)
      
      // Should not detect changes after sorting
      expect(result.root.kind).toBe('unchanged')
    })
  })

  describe('Determinism', () => {
    it('should produce consistent results across multiple runs', () => {
      const before = { 
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      }
      const after = { 
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Robert' }
        ]
      }
      
      const results = []
      for (let i = 0; i < 5; i++) {
        const result = computeJsonDiff(before, after, defaultOptions)
        results.push(result)
      }
      
      // All results should be identical
      const firstResult = results[0]
      for (let i = 1; i < results.length; i++) {
        expect(results[i].root).toEqual(firstResult.root)
        expect(results[i].stats.nodes).toBe(firstResult.stats.nodes)
      }
    })

    it('should produce consistent results with different object references', () => {
      const before1 = { name: 'John', age: 30 }
      const after1 = { name: 'John', age: 31 }
      
      const before2 = JSON.parse(JSON.stringify(before1))
      const after2 = JSON.parse(JSON.stringify(after1))
      
      const result1 = computeJsonDiff(before1, after1, defaultOptions)
      const result2 = computeJsonDiff(before2, after2, defaultOptions)
      
      expect(result1.root).toEqual(result2.root)
      expect(result1.stats.nodes).toBe(result2.stats.nodes)
    })
  })

  describe('Preprocessing', () => {
    it('should apply ignore rules during preprocessing', () => {
      const data = { name: 'John', age: 30, timestamp: '2023-01-01' }
      const options: DiffOptions = {
        ...defaultOptions,
        ignoreRules: [
          {
            id: 'ignore-timestamp',
            type: 'keyPath',
            pattern: 'timestamp',
            enabled: true
          }
        ]
      }
      
      const processed = preprocessData(data, options)
      expect(processed).toEqual({ name: 'John', age: 30 })
      expect((processed as any).timestamp).toBeUndefined()
    })

    it('should apply transforms during preprocessing', () => {
      const data = { value: 3.14159, name: 'JOHN' }
      const options: DiffOptions = {
        ...defaultOptions,
        transformRules: [
          {
            id: 'round-value',
            type: 'round',
            targetPath: 'value',
            options: { decimals: 2 },
            enabled: true
          },
          {
            id: 'lowercase-name',
            type: 'lowercase',
            targetPath: 'name',
            enabled: true
          }
        ]
      }
      
      const processed = preprocessData(data, options)
      expect((processed as any).value).toBe(3.14)
      expect((processed as any).name).toBe('john')
    })
  })

  describe('Validation', () => {
    it('should validate ignore rules', () => {
      const invalidRule: IgnoreRule = {
        id: 'invalid',
        type: 'regex',
        pattern: '[invalid',
        enabled: true
      }
      
      const options: DiffOptions = {
        ...defaultOptions,
        ignoreRules: [invalidRule]
      }
      
      const errors = validateOptions(options)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].type).toBe('transform')
      expect(errors[0].recoverable).toBe(true)
    })

    it('should validate transform rules', () => {
      const invalidRule: TransformRule = {
        id: 'invalid',
        type: 'round',
        targetPath: 'value',
        options: { decimals: -1 },
        enabled: true
      }
      
      const options: DiffOptions = {
        ...defaultOptions,
        transformRules: [invalidRule]
      }
      
      const errors = validateOptions(options)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].type).toBe('transform')
      expect(errors[0].recoverable).toBe(true)
    })
  })

  describe('Array Strategy Detection', () => {
    it('should detect keyable arrays', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
      
      const result = detectKeyableArray(array)
      expect(result.keyable).toBe(true)
      expect(result.keyPath).toBe('id')
    })

    it('should not detect keyable arrays without unique IDs', () => {
      const array = [
        { id: 1, name: 'Alice' },
        { id: 1, name: 'Alice' }
      ]
      
      const result = detectKeyableArray(array)
      expect(result.keyable).toBe(false)
    })

    it('should not detect keyable arrays for primitives', () => {
      const array = ['a', 'b', 'c']
      
      const result = detectKeyableArray(array)
      expect(result.keyable).toBe(false)
    })
  })
})
