import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  AppState, 
  JsonVersion, 
  Selection, 
  DiffOptions, 
  DiffResult, 
  UIState,
  VersionId,
  IgnoreRule,
  TransformRule
} from '@/types/domain'

/**
 * Generate a unique version ID
 */
const generateVersionId = (): string => {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a cache key for diff results
 */
const generateOptionsKey = (options: DiffOptions): string => {
  const key = JSON.stringify({
    arrayStrategy: options.arrayStrategy,
    arrayKeyPath: options.arrayKeyPath,
    ignoreRules: options.ignoreRules.filter(r => r.enabled).map(r => ({ type: r.type, pattern: r.pattern })),
    transformRules: options.transformRules.filter(r => r.enabled).map(r => ({ type: r.type, targetPath: r.targetPath, options: r.options }))
  })
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Create a cache key for a diff between two versions
 */
const createDiffCacheKey = (a: VersionId, b: VersionId, optionsKey: string): string => {
  return `${a}::${b}::${optionsKey}`
}

/**
 * Default initial state
 */
const initialState: AppState = {
  versions: [],
  selection: { mode: 'timeline', index: 0 },
  options: {
    arrayStrategy: 'index',
    arrayKeyPath: undefined,
    ignoreRules: [],
    transformRules: []
  },
  diffCache: {},
  ui: {
    theme: 'dark',
    hideUnchanged: false,
    searchQuery: '',
    rulesPanelExpanded: false
  }
}

/**
 * Zustand store for the JSON Diff Timeline application
 */
export const useAppStore = create<AppState & {
  // Version management
  addVersion: (version: Omit<JsonVersion, 'id'>) => void;
  updateVersion: (id: VersionId, updates: Partial<JsonVersion>) => void;
  removeVersion: (id: VersionId) => void;
  reorderVersions: (fromIndex: number, toIndex: number) => void;
  
  // Selection management
  setSelection: (selection: Selection) => void;
  setTimelineIndex: (index: number) => void;
  setPairSelection: (a: VersionId, b: VersionId) => void;
  
  // Options management
  updateOptions: (updates: Partial<DiffOptions>) => void;
  addIgnoreRule: (rule: Omit<IgnoreRule, 'id'>) => void;
  updateIgnoreRule: (id: string, updates: Partial<IgnoreRule>) => void;
  removeIgnoreRule: (id: string) => void;
  addTransformRule: (rule: Omit<TransformRule, 'id'>) => void;
  updateTransformRule: (id: string, updates: Partial<TransformRule>) => void;
  removeTransformRule: (id: string) => void;
  
  // Cache management
  setDiffResult: (a: VersionId, b: VersionId, result: DiffResult) => void;
  clearCache: () => void;
  
  // UI state management
  setTheme: (theme: 'light' | 'dark') => void;
  setHideUnchanged: (hideUnchanged: boolean) => void;
  setSearchQuery: (searchQuery: string) => void;
  setRulesPanelExpanded: (rulesPanelExpanded: boolean) => void;
  
  // Reset state
  reset: () => void;
}>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Version management
    addVersion: (version: Omit<JsonVersion, 'id'>) => {
      const newVersion: JsonVersion = {
        ...version,
        id: generateVersionId()
      }
      
      set(state => ({
        versions: [...state.versions, newVersion],
        selection: state.versions.length === 0 
          ? { mode: 'timeline' as const, index: 0 }
          : state.selection
      }))
    },

    updateVersion: (id: VersionId, updates: Partial<JsonVersion>) => {
      set(state => ({
        versions: state.versions.map(v => 
          v.id === id ? { ...v, ...updates } : v
        )
      }))
    },

    removeVersion: (id: VersionId) => {
      set(state => {
        const newVersions = state.versions.filter(v => v.id !== id)
        const newSelection = state.selection.mode === 'timeline'
          ? { mode: 'timeline' as const, index: Math.min(state.selection.index, newVersions.length - 1) }
          : state.selection.a === id || state.selection.b === id
          ? { mode: 'timeline' as const, index: 0 }
          : state.selection

        // Clear cache entries involving this version
        const newCache = { ...state.diffCache }
        Object.keys(newCache).forEach(key => {
          if (key.includes(id)) {
            delete newCache[key]
          }
        })

        return {
          versions: newVersions,
          selection: newSelection,
          diffCache: newCache
        }
      })
    },

    reorderVersions: (fromIndex: number, toIndex: number) => {
      set(state => {
        const newVersions = [...state.versions]
        const [movedVersion] = newVersions.splice(fromIndex, 1)
        newVersions.splice(toIndex, 0, movedVersion)
        
        return { versions: newVersions }
      })
    },

    // Selection management
    setSelection: (selection: Selection) => {
      set({ selection })
    },

    setTimelineIndex: (index: number) => {
      set(state => ({
        selection: { mode: 'timeline' as const, index: Math.max(0, Math.min(index, state.versions.length - 1)) }
      }))
    },

    setPairSelection: (a: VersionId, b: VersionId) => {
      set({ selection: { mode: 'pair' as const, a, b } })
    },

    // Options management
    updateOptions: (updates: Partial<DiffOptions>) => {
      set(state => {
        const newOptions = { ...state.options, ...updates }
        const newOptionsKey = generateOptionsKey(newOptions)
        
        // Clear cache if options changed
        const newCache = { ...state.diffCache }
        Object.keys(newCache).forEach(key => {
          if (!key.endsWith(`::${newOptionsKey}`)) {
            delete newCache[key]
          }
        })

        return {
          options: newOptions,
          diffCache: newCache
        }
      })
    },

    addIgnoreRule: (rule: Omit<IgnoreRule, 'id'>) => {
      set(state => ({
        options: {
          ...state.options,
          ignoreRules: [...state.options.ignoreRules, { ...rule, id: `ignore_${Date.now()}` }]
        }
      }))
    },

    updateIgnoreRule: (id: string, updates: Partial<IgnoreRule>) => {
      set(state => ({
        options: {
          ...state.options,
          ignoreRules: state.options.ignoreRules.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        }
      }))
    },

    removeIgnoreRule: (id: string) => {
      set(state => ({
        options: {
          ...state.options,
          ignoreRules: state.options.ignoreRules.filter(r => r.id !== id)
        }
      }))
    },

    addTransformRule: (rule: Omit<TransformRule, 'id'>) => {
      set(state => ({
        options: {
          ...state.options,
          transformRules: [...state.options.transformRules, { ...rule, id: `transform_${Date.now()}` }]
        }
      }))
    },

    updateTransformRule: (id: string, updates: Partial<TransformRule>) => {
      set(state => ({
        options: {
          ...state.options,
          transformRules: state.options.transformRules.map(r => 
            r.id === id ? { ...r, ...updates } : r
          )
        }
      }))
    },

    removeTransformRule: (id: string) => {
      set(state => ({
        options: {
          ...state.options,
          transformRules: state.options.transformRules.filter(r => r.id !== id)
        }
      }))
    },

    // Cache management
    setDiffResult: (a: VersionId, b: VersionId, result: DiffResult) => {
      set(state => {
        const optionsKey = generateOptionsKey(state.options)
        const cacheKey = createDiffCacheKey(a, b, optionsKey)
        
        return {
          diffCache: {
            ...state.diffCache,
            [cacheKey]: result
          }
        }
      })
    },

    clearCache: () => {
      set({ diffCache: {} })
    },

    // UI state management
    setTheme: (theme: 'light' | 'dark') => {
      set(state => ({
        ui: { ...state.ui, theme }
      }))
    },

    setHideUnchanged: (hideUnchanged: boolean) => {
      set(state => ({
        ui: { ...state.ui, hideUnchanged }
      }))
    },

    setSearchQuery: (searchQuery: string) => {
      set(state => ({
        ui: { ...state.ui, searchQuery }
      }))
    },

    setRulesPanelExpanded: (rulesPanelExpanded: boolean) => {
      set(state => ({
        ui: { ...state.ui, rulesPanelExpanded }
      }))
    },

    // Reset state
    reset: () => {
      set(initialState)
    }
  }))
)

/**
 * Derived selectors for computed state
 */
export const useAppSelectors = {
  // Get the current active pair based on selection
  useActivePair: () => useAppStore(state => {
    if (state.selection.mode === 'pair') {
      return { a: state.selection.a, b: state.selection.b }
    }
    
    const index = state.selection.index
    if (index >= state.versions.length - 1) {
      return null
    }
    
    return {
      a: state.versions[index].id,
      b: state.versions[index + 1].id
    }
  }),

  // Get the current options key
  useOptionsKey: () => useAppStore(state => generateOptionsKey(state.options)),

  // Get the current diff result for the active pair
  useCurrentDiff: () => useAppStore(state => {
    const activePair = state.selection.mode === 'pair'
      ? { a: state.selection.a, b: state.selection.b }
      : state.selection.index < state.versions.length - 1
      ? { a: state.versions[state.selection.index].id, b: state.versions[state.selection.index + 1].id }
      : null

    if (!activePair) return null

    const optionsKey = generateOptionsKey(state.options)
    const cacheKey = createDiffCacheKey(activePair.a, activePair.b, optionsKey)
    
    return state.diffCache[cacheKey] || null
  }),

  // Get all pairs for the matrix view
  useAllPairs: () => useAppStore(state => {
    const pairs: Array<{ a: VersionId; b: VersionId }> = []
    for (let i = 0; i < state.versions.length; i++) {
      for (let j = i + 1; j < state.versions.length; j++) {
        pairs.push({
          a: state.versions[i].id,
          b: state.versions[j].id
        })
      }
    }
    return pairs
  }),

  // Get adjacent pairs for timeline view
  useAdjacentPairs: () => useAppStore(state => {
    const pairs: Array<{ a: VersionId; b: VersionId; index: number }> = []
    for (let i = 0; i < state.versions.length - 1; i++) {
      pairs.push({
        a: state.versions[i].id,
        b: state.versions[i + 1].id,
        index: i
      })
    }
    return pairs
  }),

  // Note: useIsDiffCached moved to a separate custom hook below

  // Get enabled rules only
  useEnabledRules: () => useAppStore(state => ({
    ignoreRules: state.options.ignoreRules.filter(r => r.enabled),
    transformRules: state.options.transformRules.filter(r => r.enabled)
  }))
}

/**
 * Custom hook to check if a diff is cached for a specific pair
 * This is a separate hook because it takes parameters
 */
export function useIsDiffCached(a: VersionId, b: VersionId) {
  return useAppStore(state => {
    const optionsKey = generateOptionsKey(state.options)
    const cacheKey = createDiffCacheKey(a, b, optionsKey)
    return cacheKey in state.diffCache
  })
}
