export type HookEvent =
  | 'SessionStart'
  | 'SessionEnd'
  | 'UserPromptSubmit'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PermissionRequest'
  | 'Stop'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'PreCompact'
  | 'Notification'
  | 'Setup';

export interface HookInput {
  cwd?: string;
  sessionId?: string;
  toolName?: string;
  toolInput?: unknown;
  toolUseId?: string;
  toolResponse?: unknown;
  prompt?: string;
  notificationType?: string;
  [key: string]: unknown;
}

export interface HookResult {
  ok: boolean;
  reason?: string;
  decision?: 'allow' | 'deny' | 'ask' | 'block';
  additionalContext?: string;
  updatedInput?: unknown;
  permissionDecision?: 'allow' | 'deny' | 'ask';
  permissionDecisionReason?: string;
}

export interface HookConfig {
  type: 'command' | 'prompt';
  command?: string;
  prompt?: string;
  matcher?: string;
  timeout?: number;
}

export interface Hooks {
  SessionStart?: HookConfigGroup;
  SessionEnd?: HookConfigGroup;
  UserPromptSubmit?: HookConfigGroup;
  PreToolUse?: HookConfigGroup;
  PostToolUse?: HookConfigGroup;
  PermissionRequest?: HookConfigGroup;
  Stop?: HookConfigGroup;
  SubagentStart?: HookConfigGroup;
  SubagentStop?: HookConfigGroup;
  PreCompact?: HookConfigGroup;
  Notification?: HookConfigGroup;
  Setup?: HookConfigGroup;
}

export interface HookConfigGroup {
  matcher?: string;
  hooks: HookConfig[];
}
