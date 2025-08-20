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
 * Rule to ignore specific fields during diff computation
 */
export interface IgnoreRule {
  /** Unique identifier for this rule */
  id: string;
  /** Type of ignore pattern */
  type: 'keyPath' | 'glob' | 'regex';
  /** The pattern to match against field paths */
  pattern: string;
  /** Whether this rule is currently active */
  enabled: boolean;
}

/**
 * Rule to transform values before diff computation
 */
/** Options for rounding transform */
export interface RoundTransformOptions {
  /** Number of decimal places to round to (0-20) */
  decimals: number;
}

/** Options for custom transform */
export interface CustomTransformOptions {
  /** Custom transform function to apply */
  transform: (value: unknown) => unknown;
}

/** Options for array sorting transform */
export interface SortArrayTransformOptions {
  /** Custom comparison function for sorting */
  compare?: (a: unknown, b: unknown) => number;
  /** Whether to sort in descending order */
  descending?: boolean;
}

/** Union type for all transform options */
export type TransformOptions = 
  | RoundTransformOptions
  | CustomTransformOptions
  | SortArrayTransformOptions
  | Record<string, never>; // For transforms that don't need options

export interface TransformRule {
  /** Unique identifier for this rule */
  id: string;
  /** Type of transformation to apply */
  type: 'round' | 'lowercase' | 'uppercase' | 'sortArray' | 'custom';
  /** Target path or path glob to apply transformation to */
  targetPath?: string;
  /** Additional options for the transformation */
  options?: TransformOptions;
  /** Whether this rule is currently active */
  enabled: boolean;
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
  ignoreRules: IgnoreRule[];
  /** Rules for transforming values before diff */
  transformRules: TransformRule[];
}

/**
 * Types of changes that can occur in a diff
 */
export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Represents a single node in the diff tree
 */
export interface DiffNode {
  /** Dot/bracket notation path to this node (e.g., 'users[0].name') */
  path: string;
  /** Type of change at this node */
  kind: ChangeKind;
  /** Value before the change (for removed/modified nodes) */
  before?: unknown;
  /** Value after the change (for added/modified nodes) */
  after?: unknown;
  /** Child nodes for nested structures */
  children?: DiffNode[];
  /** Additional metadata about this node */
  meta?: {
    /** Number of changed children (for collapsed nodes) */
    countChanged?: number;
    /** Whether this node's children are truncated for performance */
    isTruncated?: boolean;
    /** Array matching strategy used (for array nodes) */
    arrayStrategy?: 'index' | 'keyed';
  };
}

/**
 * Complete result of a diff computation between two versions
 */
export interface DiffResult {
  /** ID of the first version being compared */
  versionA: VersionId;
  /** ID of the second version being compared */
  versionB: VersionId;
  /** Cache key representing the options used for this diff */
  optionsKey: string;
  /** Root node of the diff tree */
  root: DiffNode;
  /** Statistics about the diff computation */
  stats: {
    /** Total number of nodes in the diff tree */
    nodes: number;
    /** Time taken to compute the diff in milliseconds */
    computeMs: number;
  };
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
  diffCache: Record<string, DiffResult>;
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

/**
 * Error types that can occur during diff computation
 */
export interface DiffError {
  /** Type of error */
  type: 'parse' | 'transform' | 'compute' | 'memory' | 'timeout';
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Whether this error is recoverable */
  recoverable: boolean;
}

/**
 * Progress information for long-running operations
 */
export interface ProgressInfo {
  /** Current operation being performed */
  operation: 'parse' | 'transform' | 'diff' | 'render';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current item being processed */
  current?: string;
  /** Total items to process */
  total?: number;
  /** Estimated time remaining in milliseconds */
  estimatedMs?: number;
}

/**
 * Search result information
 */
export interface SearchResult {
  /** The diff node that matches the search */
  node: DiffNode;
  /** Relevance score (higher is more relevant) */
  score: number;
  /** Which part of the node matched (path, value, etc.) */
  matchType: 'path' | 'value' | 'both';
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  /** Time taken to parse JSON in milliseconds */
  parseMs: number;
  /** Time taken to apply transforms in milliseconds */
  transformMs: number;
  /** Time taken to compute diff in milliseconds */
  diffMs: number;
  /** Time taken to render diff tree in milliseconds */
  renderMs: number;
  /** Memory usage in bytes */
  memoryBytes: number;
  /** Number of nodes in the diff tree */
  nodeCount: number;
}
