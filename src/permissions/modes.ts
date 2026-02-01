/**
 * Permission modes for different levels of autonomy.
 */

export type PermissionMode = 'default' | 'auto-accept' | 'plan' | 'deny-all';

export interface PermissionModeConfig {
  name: PermissionMode;
  displayName: string;
  description: string;
  behavior: {
    readOperations: 'allow' | 'ask';
    writeOperations: 'allow' | 'ask';
    executeOperations: 'allow' | 'ask';
    networkOperations: 'allow' | 'ask';
  };
}

/**
 * Permission mode configurations.
 */
export const permissionModes: Record<PermissionMode, PermissionModeConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    description: 'Ask for confirmation on write and execute operations',
    behavior: {
      readOperations: 'allow',
      writeOperations: 'ask',
      executeOperations: 'ask',
      networkOperations: 'ask',
    },
  },
  'auto-accept': {
    name: 'auto-accept',
    displayName: 'Auto Accept',
    description: 'Automatically approve all tool operations',
    behavior: {
      readOperations: 'allow',
      writeOperations: 'allow',
      executeOperations: 'allow',
      networkOperations: 'allow',
    },
  },
  plan: {
    name: 'plan',
    displayName: 'Plan Mode',
    description: 'Only allow read operations, ask for everything else',
    behavior: {
      readOperations: 'allow',
      writeOperations: 'ask',
      executeOperations: 'ask',
      networkOperations: 'ask',
    },
  },
  'deny-all': {
    name: 'deny-all',
    displayName: 'Deny All',
    description: 'Deny all tool operations (read-only mode)',
    behavior: {
      readOperations: 'allow',
      writeOperations: 'ask',
      executeOperations: 'ask',
      networkOperations: 'ask',
    },
  },
};

/**
 * Get the permission mode configuration.
 */
export function getModeConfig(mode: PermissionMode): PermissionModeConfig {
  return permissionModes[mode] || permissionModes.default;
}

/**
 * Classify a tool into an operation category.
 */
export function classifyTool(toolName: string): keyof PermissionModeConfig['behavior'] {
  const readTools = ['Read', 'Glob', 'Grep', 'Ls', 'TodoRead'];
  const writeTools = ['Write', 'Edit', 'TodoWrite'];
  const executeTools = ['Bash', 'Task'];
  const networkTools = ['WebFetch', 'WebSearch'];

  if (readTools.includes(toolName)) return 'readOperations';
  if (writeTools.includes(toolName)) return 'writeOperations';
  if (executeTools.includes(toolName)) return 'executeOperations';
  if (networkTools.includes(toolName)) return 'networkOperations';

  // Default to execute (most restrictive)
  return 'executeOperations';
}

/**
 * Check if an operation should be allowed based on mode.
 */
export function shouldAllowByMode(toolName: string, mode: PermissionMode): 'allow' | 'ask' {
  const modeConfig = getModeConfig(mode);
  const category = classifyTool(toolName);
  return modeConfig.behavior[category];
}

export default permissionModes;
