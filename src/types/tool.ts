/**
 * Tool type definitions.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, ToolPropertySchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolPropertySchema {
  type: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: ToolPropertySchema;
}

export interface ToolResult {
  success: boolean;
  content: string | object;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  cwd: string;
  sessionId: string;
  permissionMode: string;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolExecution {
  toolUse: ToolUse;
  result: ToolResult;
  startTime: number;
  endTime: number;
  approved: boolean;
}

/**
 * Tool categories for permission classification.
 */
export type ToolCategory = 'read' | 'write' | 'execute' | 'network';

/**
 * Map tool names to categories.
 */
export const toolCategories: Record<string, ToolCategory> = {
  Read: 'read',
  Glob: 'read',
  Grep: 'read',
  Ls: 'read',
  TodoRead: 'read',
  Write: 'write',
  Edit: 'write',
  TodoWrite: 'write',
  Bash: 'execute',
  Task: 'execute',
  WebFetch: 'network',
  WebSearch: 'network',
  Question: 'read',
};

/**
 * Get the category for a tool.
 */
export function getToolCategory(toolName: string): ToolCategory {
  return toolCategories[toolName] || 'execute';
}

export default ToolDefinition;
