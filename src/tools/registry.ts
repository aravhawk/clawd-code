import { EventEmitter } from 'events';
import type { ToolUseBlock } from '../types';
import type { ToolResult, ToolDefinition, BaseTool, ToolContext } from './base';
import { Logger } from '../utils/logger';

const log = Logger.create('ToolRegistry');

export class ToolRegistry extends EventEmitter {
  private tools: Map<string, BaseTool> = new Map();
  private context: ToolContext;

  constructor(context: ToolContext) {
    super();
    this.context = context;
  }

  register(tool: BaseTool): void {
    log.debug(`Registering tool: ${tool.name}`);
    this.tools.set(tool.name, tool);
    this.emit('toolRegistered', tool.name);
  }

  getContext(): ToolContext {
    return this.context;
  }

  unregister(name: string): void {
    log.debug(`Unregistering tool: ${name}`);
    this.tools.delete(name);
    this.emit('toolUnregistered', name);
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((tool) => tool.getDefinition());
  }

  async execute(name: string, input: unknown): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    log.debug(`Executing tool: ${name}`);
    this.emit('toolStart', { name, input });

    try {
      const result = await tool.execute(input);
      log.debug(`Tool ${name} completed:`, result.success);
      this.emit('toolComplete', { name, result });
      return result;
    } catch (error) {
      log.error(`Tool ${name} failed:`, error);
      this.emit('toolError', { name, error });
      throw error;
    }
  }

  async executeToolUse(toolUse: ToolUseBlock): Promise<ToolResult> {
    // Validate tool use block
    if (!toolUse) {
      return {
        success: false,
        content: 'Tool use block is null or undefined',
      };
    }

    if (!toolUse.name || typeof toolUse.name !== 'string') {
      return {
        success: false,
        content: 'Tool use block missing valid name',
      };
    }

    if (!toolUse.input || typeof toolUse.input !== 'object') {
      log.warn(`Tool ${toolUse.name} has invalid input, using empty object`);
      toolUse.input = {};
    }

    try {
      return await this.execute(toolUse.name, toolUse.input);
    } catch (error) {
      return {
        success: false,
        content: `Failed to execute tool: ${(error as Error).message}`,
      };
    }
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  size(): number {
    return this.tools.size;
  }
}
