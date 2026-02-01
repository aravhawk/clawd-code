import React, { createContext, useContext, PropsWithChildren } from 'react';
import type { ConversationMessage } from '../components/chat/MessageList';

/**
 * Session context for conversation state.
 */
export interface SessionContextValue {
  // Session identity
  sessionId: string;
  sessionName: string;

  // Messages
  messages: ConversationMessage[];
  addMessage: (message: ConversationMessage) => void;
  clearMessages: () => void;

  // Session state
  isReady: boolean;
  createdAt: number;
  updatedAt: number;

  // Token tracking
  tokenCount: number;
  cost: number;

  // Session operations
  save: () => Promise<void>;
  load: (sessionId: string) => Promise<void>;
  compact: () => Promise<void>;
  export: () => Promise<string>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps extends PropsWithChildren {
  value: SessionContextValue;
}

/**
 * Provider component for session context.
 */
export function SessionProvider({ value, children }: SessionProviderProps) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Hook to access session context.
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}

export { SessionContext };
export default SessionContext;
