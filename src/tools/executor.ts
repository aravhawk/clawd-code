import type { BaseTool } from './base';
import type { ToolRegistry } from './registry';
import type { PermissionManager } from '../permissions';
import { validateInput } from './validation/schema';
import { sanitizeInput } from './validation/sanitize';
import { checkSecurity } from './validation/security';

export interface ToolExecutorConfig {
  cwd: string;
  timeout?: number;
  permissions?: PermissionManager;
}

export interface ToolExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
  metadata?: Record<string, unknown>;
}

export interface ToolExecutionContext {
  toolName: string;
  input: Record<string, unknown>;
  startTime: number;
  timeout: number;
}

/**
 * Executes tools with validation, sanitization, and security checks.
 */
export class ToolExecutor {
  private registry: ToolRegistry;
  private config: ToolExecutorConfig;

  constructor(registry: ToolRegistry, config: ToolExecutorConfig) {
    this.registry = registry;
    this.config = {
      timeout: 120000,
      ...config,
    };
  }

  /**
   * Execute a tool by name with the given input.
   */
  async execute(toolName: string, input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. Get the tool
      const tool = this.registry.get(toolName);
      if (!tool) {
        return {
          success: false,
          output: '',
          error: `Tool not found: ${toolName}`,
          duration: Date.now() - startTime,
        };
      }

      // 2. Validate input against schema
      const validationResult = validateInput(input, tool.inputSchema as any);
      if (!validationResult.valid) {
        return {
          success: false,
          output: '',
          error: `Invalid input: ${validationResult.errors.join(', ')}`,
          duration: Date.now() - startTime,
        };
      }

      // 3. Sanitize input
      const sanitizedInput = sanitizeInput(input, tool.inputSchema as any);

      // 4. Security checks
      const securityResult = checkSecurity(toolName, sanitizedInput, this.config.cwd);
      if (!securityResult.allowed) {
        return {
          success: false,
          output: '',
          error: `Security check failed: ${securityResult.reason}`,
          duration: Date.now() - startTime,
        };
      }

      // 5. Execute the tool
      const result = await this.executeWithTimeout(tool, sanitizedInput, this.config.timeout!);

      return {
        success: result.success,
        output:
          typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
        duration: Date.now() - startTime,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Execution failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute a tool with a timeout.
   */
  private async executeWithTimeout(
    tool: BaseTool,
    input: Record<string, unknown>,
    timeout: number
  ): Promise<{ success: boolean; content: string | object; metadata?: Record<string, unknown> }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeout}ms`));
      }, timeout);

      tool
        .execute(input)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Execute multiple tools in parallel.
   */
  async executeParallel(
    executions: Array<{ toolName: string; input: Record<string, unknown> }>
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(executions.map(({ toolName, input }) => this.execute(toolName, input)));
  }

  /**
   * Execute multiple tools in sequence.
   */
  async executeSequential(
    executions: Array<{ toolName: string; input: Record<string, unknown> }>
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const { toolName, input } of executions) {
      const result = await this.execute(toolName, input);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }
}

export default ToolExecutor;
