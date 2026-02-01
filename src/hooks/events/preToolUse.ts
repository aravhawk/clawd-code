/**
 * Pre-tool use hook event
 * Triggered before a tool is executed
 */

import type { HookInput, HookResult } from '../types.js';

export interface PreToolUseInput extends HookInput {
  toolName: string;
  toolInput: unknown;
  sessionId: string;
}

export async function preToolUse(input: PreToolUseInput): Promise<HookResult> {
  // Hook can modify tool input or cancel execution
  return {
    ok: true,
  };
}
