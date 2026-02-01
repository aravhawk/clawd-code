import type { PermissionMode } from '../types';

export interface ClawdConfig extends Record<string, unknown> {
  model?: string;
  maxTokens?: number;
  permissions?: PermissionConfig;
  providers?: ProvidersConfig;
  mcpServers?: Record<string, MCPServerConfig>;
  hooks?: Hooks;
}

export interface MCPServerConfig {
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

export interface HookConfig {
  type: 'command' | 'prompt';
  command?: string;
  prompt?: string;
  matcher?: string;
  timeout?: number;
}

export interface Hooks {
  SessionStart?: HookConfig[];
  SessionEnd?: HookConfig[];
  UserPromptSubmit?: HookConfig[];
  PreToolUse?: HookConfig[];
  PostToolUse?: HookConfig[];
  PermissionRequest?: HookConfig[];
  Stop?: HookConfig[];
}

export interface PermissionRule {
  tool: string;
  allow?: boolean;
  requiresApproval?: boolean;
  allowedPatterns?: string[];
  deniedPatterns?: string[];
}

export interface PermissionConfig {
  mode: PermissionMode;
  allow: PermissionRule[];
  deny: PermissionRule[];
}

export interface AnthropicProviderConfig {
  apiKey?: string;
  baseURL?: string;
}

export interface ProvidersConfig {
  anthropic?: AnthropicProviderConfig;
}

export const defaultConfig: ClawdConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
  permissions: {
    mode: 'default',
    allow: [],
    deny: [],
  },
  providers: {},
  mcpServers: {},
  hooks: {},
};
