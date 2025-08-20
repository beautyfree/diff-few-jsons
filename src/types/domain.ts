/**
 * Core domain types for the JSON Diff Timeline application
 *
 * This module defines the TypeScript interfaces and types used throughout
 * the application for JSON versioning, diff computation, and state management.
 */

/**
 * Unique identifier for a JSON version
 */
export type VersionId = string;

/**
 * Represents a single JSON input with metadata
 */
export interface JsonVersion {
  /** Unique identifier for this version */
  id: VersionId;
  /** Human-readable label for this version */
  label: string;
  /** ISO 8601 timestamp when this version was created/acquired */
  timestamp: string;
  /** Source information about how this version was obtained */
  source: {
    /** Type of input source */
    type: 'paste' | 'file' | 'url';
    /** Reference to the original source (filename, URL, etc.) */
    ref?: string;
  };
  /** The original JSON payload as parsed */
  payload: unknown;
}

/**
 * Configuration options for diff computation
 */
export interface DiffOptions {
  /** Strategy for comparing arrays */
  arrayStrategy: 'index' | 'keyed';
  /** When using keyed strategy, the path to the key field (e.g., 'id') */
  arrayKeyPath?: string;
  /** Rules for ignoring fields during diff */
  ignoreRules: any[];
  /** Rules for transforming values before diff */
  transformRules: any[];
}

/**
 * Represents the current selection state in the UI
 */
export type Selection = 
  | { mode: 'timeline'; index: number }
  | { mode: 'pair'; a: VersionId; b: VersionId };

/**
 * UI-specific state
 */
export interface UIState {
  /** Current theme (light or dark) */
  theme: 'light' | 'dark';
  /** Whether to hide unchanged nodes in the diff tree */
  hideUnchanged: boolean;
  /** Current search query */
  searchQuery: string;
  /** Whether the rules panel is expanded */
  rulesPanelExpanded: boolean;
}

/**
 * Complete application state managed by Zustand
 */
export interface AppState {
  /** All JSON versions in the current session */
  versions: JsonVersion[];
  /** Current selection (timeline or specific pair) */
  selection: Selection;
  /** Diff computation options */
  options: DiffOptions;
  /** Cache of computed diffs, keyed by `${a}::${b}::${optionsKey}` */
  diffCache: Record<string, any>;
  /** UI-specific state */
  ui: UIState;
}

/**
 * Represents a complete session that can be saved/loaded
 */
export interface Session {
  /** All versions in the session */
  versions: JsonVersion[];
  /** Diff options */
  options: DiffOptions;
  /** Current selection */
  selection: Selection;
  /** UI state */
  ui: UIState;
  /** Metadata about the session */
  meta: {
    /** When the session was created */
    createdAt: string;
    /** When the session was last modified */
    modifiedAt: string;
    /** Version of the app that created this session */
    appVersion: string;
  };
}
