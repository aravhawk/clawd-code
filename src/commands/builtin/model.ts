import type { CommandDefinition } from '../parser';

export const modelCommand: CommandDefinition = {
  name: 'model',
  description: 'Switch to a different model (e.g., /model claude-sonnet-4-20250514)',
  handler: (args, context) => {
    if (args.length === 0) {
      context.session.addMessage({
        role: 'assistant',
        content: `Usage: /model <model_name>

Available models:
  claude-sonnet-4-20250514    Claude Sonnet 4 (balanced)
  claude-opus-4-20250514      Claude Opus 4 (powerful)
  claude-haiku-4-20250514     Claude Haiku 4 (fast)

Example: /model claude-sonnet-4-20250514`,
        timestamp: new Date(),
      });
      return;
    }

    const model = args[0];
    // Store the model preference (would need to implement this properly)
    context.session.addMessage({
      role: 'assistant',
      content: `Model switched to: ${model}\n\nNote: Model switching is not fully implemented yet. The current session will continue using the default model.`,
      timestamp: new Date(),
    });
  },
};
