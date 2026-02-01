export interface ToolResult {
  success: boolean;
  content: string | object;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolContext {
  cwd: string;
  sessionId: string;
  permissionMode: string;
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: Record<string, unknown>;

  protected context: ToolContext;

  constructor(context: ToolContext) {
    this.context = context;
  }

  abstract execute(input: unknown): Promise<ToolResult>;

  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }

  protected validateInput(input: unknown): void {
    if (input === null || input === undefined) {
      throw new Error('Tool input cannot be null or undefined');
    }
    if (typeof input !== 'object') {
      throw new Error('Tool input must be an object');
    }
  }
}
