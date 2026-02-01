import { minimatch } from 'minimatch';
import type {
  PermissionMode,
  PermissionRule,
  PermissionConfig,
  PermissionRequest,
} from './types';
import type { ToolUseBlock } from '../types';

export class PermissionManager {
  private config: PermissionConfig;
  private sessionAllowlist: Set<string> = new Set();

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  needsApproval(toolUse: ToolUseBlock): boolean {
    const { name, input } = toolUse;

    // Check session allowlist first
    const toolSignature = this.getToolSignature(name, input);
    if (this.sessionAllowlist.has(toolSignature)) {
      return false;
    }

    // Check permission mode
    switch (this.config.mode) {
      case 'bypassPermissions':
        return false;

      case 'plan':
        // Only allow read-only tools
        return !this.isReadOnlyTool(name);

      case 'acceptEdits':
        // Auto-approve Edit and Write, prompt for Bash
        if (name === 'Edit' || name === 'Write') return false;
        break;

      case 'dontAsk':
        // Auto-deny if not in explicit allowlist
        return true;
    }

    // Check explicit deny rules
    for (const rule of this.config.deny) {
      if (this.matchesRule(rule, name, input)) {
        return true; // Must deny
      }
    }

    // Check explicit allow rules
    for (const rule of this.config.allow) {
      if (this.matchesRule(rule, name, input)) {
        return false; // Pre-approved
      }
    }

    // Default: requires approval
    return true;
  }

  allowForSession(toolUse: ToolUseBlock): void {
    const signature = this.getToolSignature(toolUse.name, toolUse.input);
    this.sessionAllowlist.add(signature);
  }

  private matchesRule(
    rule: PermissionRule,
    name: string,
    input: unknown,
  ): boolean {
    // Parse rule pattern: "Bash(git:*)" -> { tool: "Bash", pattern: "git:*" }
    const { tool, pattern } = this.parseToolPattern(rule.tool);

    if (!minimatch(name, tool)) return false;

    if (pattern && name === 'Bash') {
      const command = (input as { command: string }).command;
      return minimatch(command, pattern);
    }

    return true;
  }

  private parseToolPattern(
    pattern: string,
  ): { tool: string; pattern?: string } {
    const match = pattern.match(/^(\w+)(?:\((.+)\))?$/);
    if (match) {
      return { tool: match[1], pattern: match[2] };
    }
    return { tool: pattern };
  }

  private getToolSignature(name: string, input: unknown): string {
    if (name === 'Bash') {
      return `Bash:${(input as { command: string }).command}`;
    }
    return name;
  }

  private isReadOnlyTool(name: string): boolean {
    const readOnlyTools = ['Read', 'Glob', 'Grep', 'Ls'];
    return readOnlyTools.includes(name);
  }

  setMode(mode: PermissionMode): void {
    this.config.mode = mode;
  }

  getMode(): PermissionMode {
    return this.config.mode;
  }
}
