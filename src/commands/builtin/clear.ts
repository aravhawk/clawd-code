import type { CommandDefinition } from '../parser';

export const clearCommand: CommandDefinition = {
  name: 'clear',
  description: 'Clear the current conversation messages',
  handler: (args, context) => {
    context.clearMessages();
    context.session.addMessage({
      role: 'assistant',
      content: 'Conversation cleared.',
      timestamp: new Date(),
    });
  },
};
