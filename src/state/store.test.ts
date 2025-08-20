import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAppStore, useAppSelectors } from './store'
import type { JsonVersion, IgnoreRule, TransformRule } from '@/types/domain'

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  describe('Version Management', () => {
    it('should add a version with generated ID', () => {
      const versionData = {
        label: 'Test Version',
        timestamp: '2023-01-01T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data' }
      }

      useAppStore.getState().addVersion(versionData)

      const state = useAppStore.getState()
      expect(state.versions).toHaveLength(1)
      expect(state.versions[0]).toMatchObject(versionData)
      expect(state.versions[0].id).toMatch(/^v_\d+_[a-z0-9]+$/)
    })

    it('should update version with new data', () => {
      // Add initial version
      const versionData = {
        label: 'Original',
        timestamp: '2023-01-01T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data' }
      }
      useAppStore.getState().addVersion(versionData)
      const versionId = useAppStore.getState().versions[0].id

      // Update version
      useAppStore.getState().updateVersion(versionId, { label: 'Updated' })

      const state = useAppStore.getState()
      expect(state.versions[0].label).toBe('Updated')
      expect(state.versions[0].payload).toEqual({ test: 'data' }) // Other fields unchanged
    })

    it('should remove version and update selection', () => {
      // Add two versions
      const version1 = {
        label: 'Version 1',
        timestamp: '2023-01-01T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data1' }
      }
      const version2 = {
        label: 'Version 2',
        timestamp: '2023-01-02T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data2' }
      }

      useAppStore.getState().addVersion(version1)
      useAppStore.getState().addVersion(version2)

      const state = useAppStore.getState()
      const versionId = state.versions[0].id

      // Set timeline selection to index 1
      useAppStore.getState().setTimelineIndex(1)

      // Remove first version
      useAppStore.getState().removeVersion(versionId)

      const newState = useAppStore.getState()
      expect(newState.versions).toHaveLength(1)
      expect(newState.versions[0].label).toBe('Version 2')
      expect(newState.selection).toEqual({ mode: 'timeline', index: 0 }) // Adjusted from 1 to 0
    })

    it('should reorder versions correctly', () => {
      // Add three versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Third', timestamp: '2023-01-03T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      // Move first to last position
      useAppStore.getState().reorderVersions(0, 2)

      const state = useAppStore.getState()
      expect(state.versions.map(v => v.label)).toEqual(['Second', 'Third', 'First'])
    })

    it('should clear cache when removing version', () => {
      // Add versions and create cache entries
      const version1 = {
        label: 'Version 1',
        timestamp: '2023-01-01T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data1' }
      }
      const version2 = {
        label: 'Version 2',
        timestamp: '2023-01-02T00:00:00Z',
        source: { type: 'paste' as const },
        payload: { test: 'data2' }
      }

      useAppStore.getState().addVersion(version1)
      useAppStore.getState().addVersion(version2)

      const state = useAppStore.getState()
      const v1Id = state.versions[0].id
      const v2Id = state.versions[1].id

      // Add cache entries
      const mockDiffResult = {
        versionA: v1Id,
        versionB: v2Id,
        optionsKey: 'test',
        root: { path: '', kind: 'unchanged' as const },
        stats: { nodes: 1, computeMs: 10 }
      }

      useAppStore.getState().setDiffResult(v1Id, v2Id, mockDiffResult)
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(1)

      // Remove version
      useAppStore.getState().removeVersion(v1Id)
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(0)
    })
  })

  describe('Selection Management', () => {
    it('should set timeline index correctly', () => {
      // Add versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Third', timestamp: '2023-01-03T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      // Set timeline index
      useAppStore.getState().setTimelineIndex(1)
      expect(useAppStore.getState().selection).toEqual({ mode: 'timeline', index: 1 })

      // Test bounds checking
      useAppStore.getState().setTimelineIndex(-1)
      expect(useAppStore.getState().selection).toEqual({ mode: 'timeline', index: 0 })

      useAppStore.getState().setTimelineIndex(10)
      expect(useAppStore.getState().selection).toEqual({ mode: 'timeline', index: 2 })
    })

    it('should set pair selection correctly', () => {
      // Add versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const v1Id = state.versions[0].id
      const v2Id = state.versions[1].id

      useAppStore.getState().setPairSelection(v1Id, v2Id)
      expect(useAppStore.getState().selection).toEqual({ mode: 'pair', a: v1Id, b: v2Id })
    })
  })

  describe('Options Management', () => {
    it('should update options and clear cache', () => {
      // Add versions and cache entry
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const v1Id = state.versions[0].id
      const v2Id = state.versions[1].id

      // Add cache entry
      const mockDiffResult = {
        versionA: v1Id,
        versionB: v2Id,
        optionsKey: 'test',
        root: { path: '', kind: 'unchanged' as const },
        stats: { nodes: 1, computeMs: 10 }
      }

      useAppStore.getState().setDiffResult(v1Id, v2Id, mockDiffResult)
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(1)

      // Update options
      useAppStore.getState().updateOptions({ arrayStrategy: 'keyed' })
      expect(useAppStore.getState().options.arrayStrategy).toBe('keyed')
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(0) // Cache cleared
    })

    it('should manage ignore rules correctly', () => {
      const ignoreRule: Omit<IgnoreRule, 'id'> = {
        type: 'keyPath',
        pattern: 'timestamp',
        enabled: true
      }

      // Add ignore rule
      useAppStore.getState().addIgnoreRule(ignoreRule)
      expect(useAppStore.getState().options.ignoreRules).toHaveLength(1)
      expect(useAppStore.getState().options.ignoreRules[0]).toMatchObject(ignoreRule)

      const ruleId = useAppStore.getState().options.ignoreRules[0].id

      // Update ignore rule
      useAppStore.getState().updateIgnoreRule(ruleId, { enabled: false })
      expect(useAppStore.getState().options.ignoreRules[0].enabled).toBe(false)

      // Remove ignore rule
      useAppStore.getState().removeIgnoreRule(ruleId)
      expect(useAppStore.getState().options.ignoreRules).toHaveLength(0)
    })

    it('should manage transform rules correctly', () => {
      const transformRule: Omit<TransformRule, 'id'> = {
        type: 'round',
        targetPath: 'value',
        options: { decimals: 2 },
        enabled: true
      }

      // Add transform rule
      useAppStore.getState().addTransformRule(transformRule)
      expect(useAppStore.getState().options.transformRules).toHaveLength(1)
      expect(useAppStore.getState().options.transformRules[0]).toMatchObject(transformRule)

      const ruleId = useAppStore.getState().options.transformRules[0].id

      // Update transform rule
      useAppStore.getState().updateTransformRule(ruleId, { enabled: false })
      expect(useAppStore.getState().options.transformRules[0].enabled).toBe(false)

      // Remove transform rule
      useAppStore.getState().removeTransformRule(ruleId)
      expect(useAppStore.getState().options.transformRules).toHaveLength(0)
    })
  })

  describe('Cache Management', () => {
    it('should set and retrieve diff results', () => {
      // Add versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const v1Id = state.versions[0].id
      const v2Id = state.versions[1].id

      const mockDiffResult = {
        versionA: v1Id,
        versionB: v2Id,
        optionsKey: 'test',
        root: { path: '', kind: 'unchanged' as const },
        stats: { nodes: 1, computeMs: 10 }
      }

      useAppStore.getState().setDiffResult(v1Id, v2Id, mockDiffResult)
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(1)
    })

    it('should clear cache completely', () => {
      // Add cache entries
      const mockDiffResult = {
        versionA: 'v1',
        versionB: 'v2',
        optionsKey: 'test',
        root: { path: '', kind: 'unchanged' as const },
        stats: { nodes: 1, computeMs: 10 }
      }

      useAppStore.getState().setDiffResult('v1', 'v2', mockDiffResult)
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(1)

      useAppStore.getState().clearCache()
      expect(Object.keys(useAppStore.getState().diffCache)).toHaveLength(0)
    })
  })

  describe('UI State Management', () => {
    it('should manage theme correctly', () => {
      expect(useAppStore.getState().ui.theme).toBe('dark')

      useAppStore.getState().setTheme('light')
      expect(useAppStore.getState().ui.theme).toBe('light')
    })

    it('should manage hide unchanged setting', () => {
      expect(useAppStore.getState().ui.hideUnchanged).toBe(false)

      useAppStore.getState().setHideUnchanged(true)
      expect(useAppStore.getState().ui.hideUnchanged).toBe(true)
    })

    it('should manage search query', () => {
      expect(useAppStore.getState().ui.searchQuery).toBe('')

      useAppStore.getState().setSearchQuery('test query')
      expect(useAppStore.getState().ui.searchQuery).toBe('test query')
    })

    it('should manage rules panel expansion', () => {
      expect(useAppStore.getState().ui.rulesPanelExpanded).toBe(false)

      useAppStore.getState().setRulesPanelExpanded(true)
      expect(useAppStore.getState().ui.rulesPanelExpanded).toBe(true)
    })
  })

  describe('Selectors', () => {
    it('should return active pair for timeline selection', () => {
      // Add versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Third', timestamp: '2023-01-03T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      // Set timeline index to 1 (should return pair of versions[1] and versions[2])
      useAppStore.getState().setTimelineIndex(1)

      const state = useAppStore.getState()
      const activePair = state.selection.mode === 'pair'
        ? { a: state.selection.a, b: state.selection.b }
        : state.selection.index < state.versions.length - 1
        ? { a: state.versions[state.selection.index].id, b: state.versions[state.selection.index + 1].id }
        : null

      expect(activePair).toEqual({
        a: state.versions[1].id,
        b: state.versions[2].id
      })
    })

    it('should return active pair for pair selection', () => {
      // Add versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const v1Id = state.versions[0].id
      const v2Id = state.versions[1].id

      useAppStore.getState().setPairSelection(v1Id, v2Id)

      const newState = useAppStore.getState()
      const activePair = newState.selection.mode === 'pair'
        ? { a: newState.selection.a, b: newState.selection.b }
        : newState.selection.index < newState.versions.length - 1
        ? { a: newState.versions[newState.selection.index].id, b: newState.versions[newState.selection.index + 1].id }
        : null

      expect(activePair).toEqual({ a: v1Id, b: v2Id })
    })

    it('should return null for active pair when no adjacent versions', () => {
      // Add only one version
      const version = {
        label: 'First',
        timestamp: '2023-01-01T00:00:00Z',
        source: { type: 'paste' as const },
        payload: {}
      }

      useAppStore.getState().addVersion(version)
      useAppStore.getState().setTimelineIndex(0)

      const state = useAppStore.getState()
      const activePair = state.selection.mode === 'pair'
        ? { a: state.selection.a, b: state.selection.b }
        : state.selection.index < state.versions.length - 1
        ? { a: state.versions[state.selection.index].id, b: state.versions[state.selection.index + 1].id }
        : null

      expect(activePair).toBeNull()
    })

    it('should return all pairs for matrix view', () => {
      // Add three versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Third', timestamp: '2023-01-03T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const allPairs: Array<{ a: string; b: string }> = []
      for (let i = 0; i < state.versions.length; i++) {
        for (let j = i + 1; j < state.versions.length; j++) {
          allPairs.push({
            a: state.versions[i].id,
            b: state.versions[j].id
          })
        }
      }
      
      expect(allPairs).toHaveLength(3) // (0,1), (0,2), (1,2)
      expect(allPairs[0]).toEqual({ a: state.versions[0].id, b: state.versions[1].id })
      expect(allPairs[1]).toEqual({ a: state.versions[0].id, b: state.versions[2].id })
      expect(allPairs[2]).toEqual({ a: state.versions[1].id, b: state.versions[2].id })
    })

    it('should return adjacent pairs for timeline view', () => {
      // Add three versions
      const versions = [
        { label: 'First', timestamp: '2023-01-01T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Second', timestamp: '2023-01-02T00:00:00Z', source: { type: 'paste' as const }, payload: {} },
        { label: 'Third', timestamp: '2023-01-03T00:00:00Z', source: { type: 'paste' as const }, payload: {} }
      ]

      versions.forEach(v => useAppStore.getState().addVersion(v))

      const state = useAppStore.getState()
      const adjacentPairs: Array<{ a: string; b: string; index: number }> = []
      for (let i = 0; i < state.versions.length - 1; i++) {
        adjacentPairs.push({
          a: state.versions[i].id,
          b: state.versions[i + 1].id,
          index: i
        })
      }
      
      expect(adjacentPairs).toHaveLength(2) // (0,1), (1,2)
      expect(adjacentPairs[0]).toEqual({ 
        a: state.versions[0].id, 
        b: state.versions[1].id, 
        index: 0 
      })
      expect(adjacentPairs[1]).toEqual({ 
        a: state.versions[1].id, 
        b: state.versions[2].id, 
        index: 1 
      })
    })

    it('should return enabled rules only', () => {
      // Add rules with different enabled states
      useAppStore.getState().addIgnoreRule({
        type: 'keyPath',
        pattern: 'timestamp',
        enabled: true
      })

      useAppStore.getState().addIgnoreRule({
        type: 'regex',
        pattern: '.*id.*',
        enabled: false
      })

      useAppStore.getState().addTransformRule({
        type: 'round',
        targetPath: 'value',
        enabled: true
      })

      useAppStore.getState().addTransformRule({
        type: 'lowercase',
        targetPath: 'name',
        enabled: false
      })

      const state = useAppStore.getState()
      const enabledRules = {
        ignoreRules: state.options.ignoreRules.filter(r => r.enabled),
        transformRules: state.options.transformRules.filter(r => r.enabled)
      }

      expect(enabledRules.ignoreRules).toHaveLength(1)
      expect(enabledRules.transformRules).toHaveLength(1)
      expect(enabledRules.ignoreRules[0].pattern).toBe('timestamp')
      expect(enabledRules.transformRules[0].type).toBe('round')
    })
  })
})
