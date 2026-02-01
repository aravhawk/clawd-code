/**
 * Configuration type definitions.
 */

import type { PermissionMode } from '../permissions/modes';

export interface ClawdConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  permissions: PermissionConfig;
  mcp: MCPConfig;
  hooks: HooksConfig;
  session: SessionConfig;
  display: DisplayConfig;
  storage: StorageConfig;
  advanced: AdvancedConfig;
}

export interface PermissionConfig {
  mode: PermissionMode;
  allowlist: string[];
}

export interface MCPConfig {
  servers: MCPServerConfig[];
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

export interface HooksConfig {
  enabled: boolean;
  scripts: string[];
}

export interface SessionConfig {
  autoSave: boolean;
  saveInterval: number;
  maxHistory: number;
}

export interface DisplayConfig {
  theme: string;
  compact: boolean;
  showTokens: boolean;
  showCost: boolean;
}

export interface StorageConfig {
  dataDir?: string;
  cacheDir?: string;
}

export interface AdvancedConfig {
  debug: boolean;
  verbose: boolean;
  timeout: number;
}

/**
 * Partial config for merging.
 */
export type PartialClawdConfig = {
  [K in keyof ClawdConfig]?: Partial<ClawdConfig[K]>;
};

export default ClawdConfig;
