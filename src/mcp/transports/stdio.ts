import { spawn } from 'child_process';
import type { MCPMessage, MCPTool, MCPResource } from '../types.js';
import { Logger } from '../../utils/logger.js';

const log = Logger.create('StdioTransport');

export interface MCPToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export class StdioTransport {
  private process: ReturnType<typeof spawn> | null = null;
  private messageHandlers: Map<number | string, (msg: MCPMessage) => void> = new Map();
  private notificationHandlers: Map<string, (params: unknown) => void> = new Map();
  private nextId = 1;
  private initialized = false;
  private serverCapabilities: Record<string, unknown> = {};

  constructor(
    private command: string,
    private args: string[] = [],
    private env: Record<string, string> = {}
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(this.command, this.args, {
        env: { ...process.env, ...this.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let buffer = '';

      this.process?.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const message = JSON.parse(line) as MCPMessage;
            this.handleMessage(message);
          } catch (error) {
            log.warn('Failed to parse MCP message:', error);
          }
        }
      });

      this.process?.stderr?.on('data', (data: Buffer) => {
        log.warn('MCP stderr:', data.toString());
      });

      this.process?.on('error', (error) => {
        log.error('MCP process error:', error);
        reject(error);
      });

      this.process?.on('close', (code) => {
        log.info(`MCP process closed with code ${code}`);
        this.initialized = false;
      });

      // Initialize handshake
      this.request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: { subscribe: true },
          prompts: {},
        },
        clientInfo: {
          name: 'clawd-code',
          version: '1.0.0',
        },
      })
        .then((result) => {
          const initResult = result as { capabilities?: Record<string, unknown> };
          this.serverCapabilities = initResult.capabilities || {};
          this.notify('notifications/initialized', {});
          this.initialized = true;
          log.info('MCP connection initialized', this.serverCapabilities);
          resolve();
        })
        .catch(reject);
    });
  }

  async request(method: string, params: unknown): Promise<unknown> {
    if (!this.process) {
      throw new Error('MCP transport not connected');
    }

    const id = this.nextId++;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, 30000);

      this.messageHandlers.set(id, (msg) => {
        clearTimeout(timeout);
        if (msg.error) {
          reject(new Error(`MCP error ${msg.error.code}: ${msg.error.message}`));
        } else {
          resolve(msg.result);
        }
      });

      const message: MCPMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.process?.stdin?.write(JSON.stringify(message) + '\n');
    });
  }

  notify(method: string, params: unknown): void {
    if (!this.process) {
      log.warn('Cannot send notification, transport not connected');
      return;
    }

    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };

    this.process?.stdin?.write(JSON.stringify(message) + '\n');
  }

  onNotification(method: string, handler: (params: unknown) => void): void {
    this.notificationHandlers.set(method, handler);
  }

  private handleMessage(message: MCPMessage): void {
    // Handle responses
    if (message.id !== undefined) {
      const handler = this.messageHandlers.get(message.id);
      if (handler) {
        handler(message);
        this.messageHandlers.delete(message.id);
      }
      return;
    }

    // Handle notifications (no id)
    if (message.method) {
      const handler = this.notificationHandlers.get(message.method);
      if (handler) {
        handler(message.params);
      } else {
        log.debug(`Unhandled notification: ${message.method}`);
      }
    }
  }

  // ========== MCP Protocol Methods ==========

  async listTools(): Promise<MCPTool[]> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('tools/list', {})) as {
      tools: MCPTool[];
    };
    return result.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolCallResult> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('tools/call', {
      name,
      arguments: args,
    })) as MCPToolCallResult;

    return result;
  }

  async listResources(): Promise<MCPResource[]> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('resources/list', {})) as {
      resources: MCPResource[];
    };
    return result.resources || [];
  }

  async readResource(uri: string): Promise<MCPResourceContent[]> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('resources/read', { uri })) as {
      contents: MCPResourceContent[];
    };
    return result.contents || [];
  }

  async subscribeResource(uri: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    await this.request('resources/subscribe', { uri });
  }

  async unsubscribeResource(uri: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    await this.request('resources/unsubscribe', { uri });
  }

  async listPrompts(): Promise<
    Array<{ name: string; description?: string; arguments?: unknown[] }>
  > {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('prompts/list', {})) as {
      prompts: Array<{ name: string; description?: string; arguments?: unknown[] }>;
    };
    return result.prompts || [];
  }

  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<{ description?: string; messages: unknown[] }> {
    if (!this.initialized) {
      throw new Error('MCP transport not initialized');
    }

    const result = (await this.request('prompts/get', {
      name,
      arguments: args,
    })) as { description?: string; messages: unknown[] };

    return result;
  }

  isConnected(): boolean {
    return this.initialized && this.process !== null;
  }

  getServerCapabilities(): Record<string, unknown> {
    return this.serverCapabilities;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.initialized = false;
      this.process.kill();
      this.process = null;
      this.messageHandlers.clear();
      this.notificationHandlers.clear();
      log.info('MCP transport disconnected');
    }
  }
}
