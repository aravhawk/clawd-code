/**
 * MCP Server Mode
 * Exposes CLAWD's tools as an MCP server for use by other MCP clients
 */

import { BaseTool, ToolContext } from '../tools/base.js';
import { ToolRegistry } from '../tools/registry.js';

export interface MCPServerOptions {
  name?: string;
  version?: string;
  tools?: BaseTool[];
  transport?: 'stdio' | 'sse' | 'http';
  context?: ToolContext;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP Server implementation
 * Provides tool execution capabilities via MCP protocol
 */
export class MCPServer {
  private name: string;
  private version: string;
  private registry: ToolRegistry;
  private initialized = false;

  constructor(options: MCPServerOptions = {}) {
    this.name = options.name ?? 'clawd-code';
    this.version = options.version ?? '1.0.0';

    const context: ToolContext = options.context ?? {
      cwd: process.cwd(),
      sessionId: 'mcp-server',
      permissionMode: 'default',
    };

    this.registry = new ToolRegistry(context);

    // Register provided tools or use default tools
    if (options.tools) {
      options.tools.forEach((tool) => this.registry.register(tool));
    }
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.initialized) {
      throw new Error('Server already initialized');
    }

    // Set up stdio transport
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (chunk: string) => {
      const lines = chunk.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          await this.handleRequest(line);
        }
      }
    });

    this.initialized = true;
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    process.stdin.removeAllListeners('data');
    this.initialized = false;
  }

  /**
   * Handle incoming JSON-RPC request
   */
  private async handleRequest(message: string): Promise<void> {
    try {
      const request = JSON.parse(message) as MCPRequest;

      // Handle JSON-RPC methods
      const response = await this.processRequest(request);

      // Send response
      this.send(response);
    } catch (error) {
      // Send error response
      this.send({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: (error as Error).message,
        },
      });
    }
  }

  /**
   * Process a JSON-RPC request
   */
  private async processRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params = {} } = request;

    try {
      switch (method) {
        case 'initialize':
          return this.handleInitialize(id, params);

        case 'tools/list':
          return this.handleToolsList(id);

        case 'tools/call':
          return await this.handleToolCall(id, params);

        case 'resources/list':
          return this.handleResourcesList(id);

        case 'prompts/list':
          return this.handlePromptsList(id);

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`,
            },
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: (error as Error).message,
        },
      };
    }
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(id: string | number, params: Record<string, unknown>): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: this.name,
          version: this.version,
        },
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    };
  }

  /**
   * Handle tools/list request
   */
  private handleToolsList(id: string | number): MCPResponse {
    const tools = this.registry.getDefinitions();

    return {
      jsonrpc: '2.0',
      id,
      result: { tools },
    };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(
    id: string | number,
    params: Record<string, unknown>
  ): Promise<MCPResponse> {
    const { name, arguments: args } = params as {
      name: string;
      arguments: Record<string, unknown>;
    };

    if (!name) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: 'Invalid params: missing tool name',
        },
      };
    }

    const tool = this.registry.get(name);
    if (!tool) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32602,
          message: `Tool not found: ${name}`,
        },
      };
    }

    try {
      const result = await tool.execute(args || {});

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: (error as Error).message,
            },
          ],
        },
      };
    }
  }

  /**
   * Handle resources/list request
   */
  private handleResourcesList(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: { resources: [] },
    };
  }

  /**
   * Handle prompts/list request
   */
  private handlePromptsList(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: { prompts: [] },
    };
  }

  /**
   * Send a message to stdout
   */
  private send(message: MCPResponse | MCPNotification): void {
    const json = JSON.stringify(message);
    process.stdout.write(json + '\n');
  }

  /**
   * Send a notification
   */
  notify(method: string, params?: Record<string, unknown>): void {
    this.send({
      jsonrpc: '2.0',
      method,
      params,
    });
  }
}

/**
 * Create and start an MCP server
 */
export async function createMCPServer(options?: MCPServerOptions): Promise<MCPServer> {
  const server = new MCPServer(options);
  await server.start();
  return server;
}
