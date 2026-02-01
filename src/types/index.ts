// Global type definitions for Clawd Code

export * from './message';
export * from './tool';
export * from './session';
export * from './config';

// Re-export common types for backwards compatibility
export interface PermissionRequest {
  id: string;
  toolUse: import('./tool').ToolUse;
  resolve: (granted: boolean, session?: boolean) => void;
}

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  [key: string]: unknown;
}
