/**
 * Permission rules for tool execution.
 */

import type { PermissionMode } from './modes';

export interface PermissionRule {
  id: string;
  toolName: string;
  pattern?: string | RegExp;
  action: 'allow' | 'deny' | 'ask';
  scope: 'session' | 'persistent';
  priority: number;
}

export interface RuleMatch {
  rule: PermissionRule;
  matched: boolean;
  reason?: string;
}

/**
 * Default permission rules.
 */
export const defaultRules: PermissionRule[] = [
  // Read operations are generally safe
  {
    id: 'read-allow',
    toolName: 'Read',
    action: 'allow',
    scope: 'persistent',
    priority: 0,
  },
  {
    id: 'glob-allow',
    toolName: 'Glob',
    action: 'allow',
    scope: 'persistent',
    priority: 0,
  },
  {
    id: 'grep-allow',
    toolName: 'Grep',
    action: 'allow',
    scope: 'persistent',
    priority: 0,
  },
  {
    id: 'ls-allow',
    toolName: 'Ls',
    action: 'allow',
    scope: 'persistent',
    priority: 0,
  },
  // Write operations need confirmation
  {
    id: 'write-ask',
    toolName: 'Write',
    action: 'ask',
    scope: 'persistent',
    priority: 0,
  },
  {
    id: 'edit-ask',
    toolName: 'Edit',
    action: 'ask',
    scope: 'persistent',
    priority: 0,
  },
  // Bash commands need confirmation
  {
    id: 'bash-ask',
    toolName: 'Bash',
    action: 'ask',
    scope: 'persistent',
    priority: 0,
  },
];

/**
 * Check if a tool input matches a rule pattern.
 */
export function matchesPattern(input: Record<string, unknown>, pattern?: string | RegExp): boolean {
  if (!pattern) return true;

  // Check common input fields
  const fieldsToCheck = ['command', 'filePath', 'url', 'pattern'];

  for (const field of fieldsToCheck) {
    const value = input[field];
    if (typeof value !== 'string') continue;

    if (typeof pattern === 'string') {
      if (value.includes(pattern)) return true;
    } else if (pattern instanceof RegExp) {
      if (pattern.test(value)) return true;
    }
  }

  return false;
}

/**
 * Find matching rules for a tool invocation.
 */
export function findMatchingRules(
  toolName: string,
  input: Record<string, unknown>,
  rules: PermissionRule[]
): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of rules) {
    if (rule.toolName !== toolName && rule.toolName !== '*') {
      continue;
    }

    const matched = matchesPattern(input, rule.pattern);
    matches.push({
      rule,
      matched,
      reason: matched ? `Matched rule: ${rule.id}` : undefined,
    });
  }

  // Sort by priority (higher first)
  return matches.sort((a, b) => b.rule.priority - a.rule.priority);
}

/**
 * Determine the permission action for a tool invocation.
 */
export function determineAction(
  toolName: string,
  input: Record<string, unknown>,
  rules: PermissionRule[],
  mode: PermissionMode
): 'allow' | 'deny' | 'ask' {
  // Mode overrides
  if (mode === 'auto-accept') return 'allow';
  if (mode === 'deny-all') return 'deny';

  // Find matching rules
  const matches = findMatchingRules(toolName, input, rules);
  const matchedRule = matches.find((m) => m.matched);

  if (matchedRule) {
    return matchedRule.rule.action;
  }

  // Default to asking for confirmation
  return 'ask';
}

export default defaultRules;
