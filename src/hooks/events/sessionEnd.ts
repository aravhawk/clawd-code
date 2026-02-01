/**
 * Session end hook event
 * Triggered when a session ends
 */

import type { HookInput, HookResult } from '../types.js';

export interface SessionEndInput extends HookInput {
  sessionId: string;
  duration?: number;
  messageCount?: number;
  toolCallCount?: number;
}

export async function sessionEnd(input: SessionEndInput): Promise<HookResult> {
  return {
    ok: true,
  };
}
