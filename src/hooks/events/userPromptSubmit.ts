/**
 * User prompt submit hook event
 * Triggered when the user submits a prompt
 */

import type { HookInput, HookResult } from '../types.js';

export interface UserPromptSubmitInput extends HookInput {
  prompt: string;
  sessionId: string;
  isCommand?: boolean;
}

export async function userPromptSubmit(input: UserPromptSubmitInput): Promise<HookResult> {
  // Hook can modify the prompt or add context
  return {
    ok: true,
  };
}
