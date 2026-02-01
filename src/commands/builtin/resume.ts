import type { CommandDefinition } from '../parser.js';

export const resumeCommand: CommandDefinition = {
  name: 'resume',
  description: 'Resume a previous session',
  handler: async (args, context) => {
    const sessionId = args[0];

    if (!sessionId) {
      const sessions = await context.session.getAllSessions();
      let output: string;

      if (sessions.length === 0) {
        output = 'No previous sessions found.';
      } else {
        const list = sessions
          .slice(0, 10)
          .map(
            (s: { id: string; name?: string; updatedAt: Date }, i: number) =>
              `  ${i + 1}. ${s.name || s.id} (${new Date(s.updatedAt).toLocaleString()})`
          )
          .join('\n');
        output = `Recent sessions:\n${list}\n\nUse /resume <session-id> to resume a specific session.`;
      }

      context.session.addMessage({
        role: 'assistant',
        content: output,
        timestamp: new Date(),
      });
      return;
    }

    const session = await context.session.resume(sessionId);
    const output = session
      ? `Resumed session: ${session.name || session.id}`
      : `Session not found: ${sessionId}`;

    context.session.addMessage({
      role: 'assistant',
      content: output,
      timestamp: new Date(),
    });
  },
};
