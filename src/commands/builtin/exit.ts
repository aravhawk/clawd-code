import type { CommandDefinition } from '../parser';

export const exitCommand: CommandDefinition = {
  name: 'exit',
  description: 'Exit Clawd Code',
  handler: (args, context) => {
    context.exit();
  },
};
