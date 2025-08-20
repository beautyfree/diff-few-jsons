import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  AppState, 
  JsonVersion, 
  VersionId
} from '@/types/domain'

/**
 * Generate a unique version ID
 */
const generateVersionId = (): string => {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
  
  // UI state management
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Reset state
  reset: () => void;
}>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    // Version management
    addVersion: (version: Omit<JsonVersion, 'id'>) => {
      const newVersion: JsonVersion = {
        ...version,
        id: generateVersionId()
      }
      
      set(state => ({
        versions: [...state.versions, newVersion]
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
      set(state => ({
        versions: state.versions.filter(v => v.id !== id)
      }))
    },

    reorderVersions: (fromIndex: number, toIndex: number) => {
      set(state => {
        const newVersions = [...state.versions]
        const [movedVersion] = newVersions.splice(fromIndex, 1)
        newVersions.splice(toIndex, 0, movedVersion)

        return { versions: newVersions }
      })
    },

    // UI state management
    setTheme: (theme: 'light' | 'dark') => {
      set(state => ({ ui: { ...state.ui, theme } }))
    },

    // Reset state
    reset: () => {
      set(initialState)
    }
  }))
)
