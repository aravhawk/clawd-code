import React, { createContext, useContext, PropsWithChildren } from 'react';
import type { SessionManager } from '../../../session';
import type { ToolRegistry } from '../../../tools/registry';

/**
 * Application-level context for global state.
 */
export interface AppContextValue {
  // Debug and verbose modes
  debugMode: boolean;
  verboseMode: boolean;
  setVerboseMode: (value: boolean) => void;

  // Working directory
  cwd: string;

  // Tool registry
  tools: ToolRegistry;

  // Session manager
  session: SessionManager;

  // Permission mode
  permissionMode: 'default' | 'auto-accept' | 'plan';
  setPermissionMode: (mode: 'default' | 'auto-accept' | 'plan') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps extends PropsWithChildren {
  value: AppContextValue;
}

/**
 * Provider component for application context.
 */
export function AppProvider({ value, children }: AppProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to access application context.
 */
export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export { AppContext };
export default AppContext;
