/**
 * Default configuration values.
 */

import type { ClawdConfig } from './types';

export const defaultConfig: ClawdConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  temperature: 0,

  permissions: {
    mode: 'default',
    allowlist: [],
  },

  mcp: {
    servers: [],
  },

  hooks: {
    enabled: true,
    scripts: [],
  },

  session: {
    autoSave: true,
    saveInterval: 60000,
    maxHistory: 100,
  },

  display: {
    theme: 'default',
    compact: false,
    showTokens: true,
    showCost: true,
  },

  storage: {
    dataDir: undefined, // Use default
    cacheDir: undefined,
  },

  advanced: {
    debug: false,
    verbose: false,
    timeout: 120000,
  },
};

/**
 * Get a default value for a config key.
 */
export function getDefault<K extends keyof ClawdConfig>(key: K): ClawdConfig[K] {
  return defaultConfig[key];
}

/**
 * Create a new config with defaults.
 */
export function createDefaultConfig(): ClawdConfig {
  return { ...defaultConfig };
}

export default defaultConfig;
