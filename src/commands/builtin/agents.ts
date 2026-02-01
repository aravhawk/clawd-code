import type { CommandDefinition } from '../parser.js';

export const agentsCommand: CommandDefinition = {
  name: 'agents',
  description: 'View information about available subagents',
  handler: (args, context) => {
    const subcommand = args[0] || 'list';

    const availableAgents = [
      {
        name: 'explore',
        description: 'Fast agent for exploring codebases, finding files, and searching code',
        tools: ['Glob', 'Grep', 'Read', 'Ls'],
      },
      {
        name: 'general',
        description: 'General-purpose agent for complex multi-step tasks',
        tools: ['All available tools'],
      },
    ];

    let output: string;

    switch (subcommand) {
      case 'list':
        const list = availableAgents.map((a) => `  - ${a.name}: ${a.description}`).join('\n');
        output = `Available subagents:\n${list}\n\nUse /agents info <name> for more details.`;
        break;

      case 'info':
        const agentName = args[1];
        if (!agentName) {
          output = 'Usage: /agents info <agent-name>';
        } else {
          const agent = availableAgents.find((a) => a.name === agentName);
          if (!agent) {
            output = `Unknown agent: ${agentName}`;
          } else {
            output =
              `Agent: ${agent.name}\n` +
              `Description: ${agent.description}\n` +
              `Available tools: ${agent.tools.join(', ')}`;
          }
        }
        break;

      default:
        output = `Unknown subcommand: ${subcommand}\nUsage: /agents [list|info <name>]`;
    }

    context.session.addMessage({
      role: 'assistant',
      content: output,
      timestamp: new Date(),
    });
  },
};
