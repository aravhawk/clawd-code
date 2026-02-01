import type { CommandDefinition } from '../parser';

export const compactCommand: CommandDefinition = {
  name: 'compact',
  description: 'Compact the conversation context to save tokens',
  handler: async (args, context) => {
    const keepRecent = args[0] ? parseInt(args[0], 10) : undefined;

    const result = await context.session.compact({
      maxTokens: 50000,
      keepRecent,
      summarizeOld: true,
    });

    context.session.addMessage({
      role: 'assistant',
      content: `Compacted conversation:
- Messages: ${result.originalCount} → ${result.compactedCount}
- Tokens saved: ~${result.tokensSaved}

The conversation has been summarized and recent messages have been preserved.`,
      timestamp: new Date(),
    });
  },
};
