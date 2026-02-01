export type PermissionMode =
  | 'default'
  | 'plan'
  | 'acceptEdits'
  | 'dontAsk'
  | 'bypassPermissions';

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

export interface PermissionRequest {
  id: string;
  toolName: string;
  toolInput: unknown;
  resolve: (granted: boolean, session?: boolean) => void;
}
