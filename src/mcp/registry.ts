import { MCPClient, type MCPServerConfig } from './client';
import type { MCPTool } from './client';
import { Logger } from '../utils/logger';

const log = Logger.create('MCPRegistry');

export class MCPRegistry {
  private clients: Map<string, MCPClient> = new Map();

  async addServer(name: string, config: MCPServerConfig): Promise<void> {
    const client = new MCPClient({ ...config, name });

    try {
      await client.connect();
      await client.discoverTools();
      await client.discoverResources();
      this.clients.set(name, client);
      log.info(`Added MCP server: ${name}`);
    } catch (error) {
      log.error(`Failed to connect to MCP server ${name}:`, error);
    }
  }

  removeServer(name: string): void {
    const client = this.clients.get(name);
    if (client) {
      client.disconnect().catch(() => {});
      this.clients.delete(name);
    }
  }

  getAllTools(): { serverName: string; tool: MCPTool }[] {
    const tools: { serverName: string; tool: MCPTool }[] = [];

    for (const [serverName, client] of this.clients) {
      for (const tool of client.getTools()) {
        tools.push({
          serverName,
          tool: {
            ...tool,
            name: `mcp__${serverName}__${tool.name}`,
          },
        });
      }
    }

    return tools;
  }

  async callTool(fullName: string, arguments_: unknown): Promise<unknown> {
    const match = fullName.match(/^mcp__(.+?)__(.+)$/);
    if (!match) {
      throw new Error(`Invalid MCP tool name: ${fullName}`);
    }

    const [, serverName, toolName] = match;
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    return client.callTool(toolName, arguments_);
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.values()).map((c) =>
      c.disconnect().catch(() => {})
    );
    await Promise.all(promises);
    this.clients.clear();
  }
}
