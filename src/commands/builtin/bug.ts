import type { CommandDefinition } from '../parser.js';

export const bugCommand: CommandDefinition = {
  name: 'bug',
  description: 'Report a bug or issue',
  handler: (_args, context) => {
    const output = `To report a bug or request a feature, please visit:
  https://github.com/anomalyco/clawd-code/issues

When reporting a bug, please include:
  - Steps to reproduce the issue
  - Expected vs actual behavior
  - Your environment (OS, Node.js version)
  - Any relevant error messages

Thank you for helping improve Clawd Code!`;

    context.session.addMessage({
      role: 'assistant',
      content: output,
      timestamp: new Date(),
    });
  },
};
