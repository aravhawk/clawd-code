/**
 * Post-tool use hook event
 * Triggered after a tool completes execution
 */

import type { HookInput, HookResult } from '../types.js';

export interface PostToolUseInput extends HookInput {
  toolName: string;
  toolInput: unknown;
  toolResponse: unknown;
  error?: string;
  duration?: number;
  sessionId: string;
}

export async function postToolUse(input: PostToolUseInput): Promise<HookResult> {
  return {
    ok: true,
  };
}
