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
 * Notification type
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification */
  type: 'success' | 'error' | 'info' | 'warning';
  /** Notification message */
  message: string;
  /** When the notification was created */
  createdAt: number;
  /** Duration in milliseconds (0 = no auto-dismiss) */
  duration: number;
}

/**
 * UI-specific state
 */
export interface UIState {
  /** Current theme (light or dark) */
  theme: 'light' | 'dark';
  /** Whether to hide unchanged nodes in the diff tree */
  hideUnchanged: boolean;
  /** Active notifications */
  notifications: Notification[];
}

/**
 * Complete application state managed by Zustand
 */
export interface AppState {
  /** All JSON versions in the current session */
  versions: JsonVersion[];
  /** UI-specific state */
  ui: UIState;
}

/**
 * Represents a complete session that can be saved/loaded
 */
export interface Session {
  /** All versions in the session */
  versions: JsonVersion[];
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
