/**
 * Session type definitions.
 */

import type { Message } from './message';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  model: string;
  tokenCount: number;
  cost: number;
  toolUseCount: number;
  lastActivity: number;
}

export interface SessionSummary {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tokenCount: number;
}

export interface SessionState {
  currentSessionId: string | null;
  sessions: Map<string, Session>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Create a new session.
 */
export function createSession(name?: string): Session {
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  return {
    id,
    name: name || `Session ${new Date(now).toLocaleString()}`,
    createdAt: now,
    updatedAt: now,
    messages: [],
    metadata: {
      model: 'claude-sonnet-4-20250514',
      tokenCount: 0,
      cost: 0,
      toolUseCount: 0,
      lastActivity: now,
    },
  };
}

/**
 * Get a summary of a session.
 */
export function getSessionSummary(session: Session): SessionSummary {
  return {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
    tokenCount: session.metadata.tokenCount,
  };
}

export default Session;
