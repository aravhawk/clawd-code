/**
 * Initial database schema
 * Creates core tables for application data
 */

import { Migration } from '../sqlite.js';

export const migration001: Migration = {
  id: 1,
  name: 'initial_schema',

  up: `
    -- Configuration storage
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- API keys and credentials (encrypted in keychain, metadata here)
    CREATE TABLE IF NOT EXISTS credentials (
      provider TEXT PRIMARY KEY,
      has_key INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- MCP server configurations
    CREATE TABLE IF NOT EXISTS mcp_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      args TEXT,
      env TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Permission rules
    CREATE TABLE IF NOT EXISTS permission_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      action TEXT NOT NULL,
      tool TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Permission allowlist
    CREATE TABLE IF NOT EXISTS permission_allowlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool TEXT NOT NULL,
      path TEXT,
      command TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Custom hooks
    CREATE TABLE IF NOT EXISTS hooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event TEXT NOT NULL,
      script_path TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Custom subagents
    CREATE TABLE IF NOT EXISTS subagents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      prompt_path TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Custom skills
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Usage statistics
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0.0,
      requests INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, provider, model)
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_permission_rules_pattern ON permission_rules(pattern);
    CREATE INDEX IF NOT EXISTS idx_permission_allowlist_tool ON permission_allowlist(tool);
    CREATE INDEX IF NOT EXISTS idx_hooks_event ON hooks(event);
    CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON usage_stats(date);
  `,

  down: `
    DROP TABLE IF EXISTS usage_stats;
    DROP TABLE IF EXISTS skills;
    DROP TABLE IF EXISTS subagents;
    DROP TABLE IF EXISTS hooks;
    DROP TABLE IF EXISTS permission_allowlist;
    DROP TABLE IF EXISTS permission_rules;
    DROP TABLE IF EXISTS mcp_servers;
    DROP TABLE IF EXISTS credentials;
    DROP TABLE IF EXISTS config;
  `,
};
