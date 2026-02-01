/**
 * Stop hook event
 * Triggered when the user stops the agent
 */

import type { HookInput, HookResult } from '../types.js';

export interface StopInput extends HookInput {
  sessionId: string;
  reason?: 'user_interrupt' | 'error' | 'complete';
}

export async function stop(input: StopInput): Promise<HookResult> {
  return {
    ok: true,
  };
}
