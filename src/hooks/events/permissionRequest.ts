/**
 * Permission request hook event
 * Triggered when a tool requires permission
 */

import type { HookInput, HookResult } from '../types.js';

export interface PermissionRequestInput extends HookInput {
  toolName: string;
  toolInput: unknown;
  sessionId: string;
  autoApprove?: boolean;
}

export async function permissionRequest(input: PermissionRequestInput): Promise<HookResult> {
  // Hook can auto-approve, deny, or modify the request
  return {
    ok: true,
    permissionDecision: 'ask',
  };
}
