import type { CommandDefinition } from '../parser.js';

export const permissionsCommand: CommandDefinition = {
  name: 'permissions',
  description: 'View and manage permission settings',
  handler: (args, context) => {
    const subcommand = args[0] || 'show';
    let output: string;

    switch (subcommand) {
      case 'show':
        output = `Current permission mode: default\nSession permissions: none`;
        break;

      case 'reset':
        output = 'Session permissions have been reset.';
        break;

      case 'mode':
        const mode = args[1];
        if (!mode || !['default', 'yolo', 'strict'].includes(mode)) {
          output = 'Usage: /permissions mode <default|yolo|strict>';
        } else {
          output = `Permission mode set to: ${mode}`;
        }
        break;

      default:
        output = `Unknown subcommand: ${subcommand}\nUsage: /permissions [show|reset|mode <mode>]`;
    }

    context.session.addMessage({
      role: 'assistant',
      content: output,
      timestamp: new Date(),
    });
  },
};
