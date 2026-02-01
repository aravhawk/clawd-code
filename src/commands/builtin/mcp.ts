import type { CommandDefinition } from '../parser.js';

export const mcpCommand: CommandDefinition = {
  name: 'mcp',
  description: 'Manage MCP (Model Context Protocol) servers',
  handler: (args, context) => {
    const subcommand = args[0] || 'list';
    let output: string;

    switch (subcommand) {
      case 'list':
        output = 'No MCP servers configured.\n\nTo add an MCP server, edit ~/.clawd/mcp.json';
        break;

      case 'status':
        output = 'MCP Status: 0 server(s) connected';
        break;

      case 'add':
        output =
          'To add an MCP server, edit ~/.clawd/mcp.json or use:\n' +
          '  clawd mcp add <name> --command <cmd> [--args <args>]';
        break;

      case 'remove':
        const serverName = args[1];
        if (!serverName) {
          output = 'Usage: /mcp remove <server-name>';
        } else {
          output = `To remove server "${serverName}", edit ~/.clawd/mcp.json`;
        }
        break;

      default:
        output = `Unknown subcommand: ${subcommand}\nUsage: /mcp [list|add|remove|status]`;
    }

    context.session.addMessage({
      role: 'assistant',
      content: output,
      timestamp: new Date(),
    });
  },
};
