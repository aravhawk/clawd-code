/**
 * Session start hook event
 * Triggered when a new session begins
 */

import type { HookInput, HookResult } from '../types.js';

export interface SessionStartInput extends HookInput {
  sessionId: string;
  model?: string;
  provider?: string;
}

export async function sessionStart(input: SessionStartInput): Promise<HookResult> {
  return {
    ok: true,
  };
}
