import type { CommandDefinition } from '../parser';

export const helpCommand: CommandDefinition = {
  name: 'help',
  description: 'Show available commands and keyboard shortcuts',
  handler: (args, context) => {
    // Return help text to be displayed
    const helpText = `
Available Commands:
  /help          Show this help message
  /clear         Clear the current conversation
  /model <name>  Switch to a different model
  /compact       Compact the conversation context
  /exit          Exit Clawd Code

Keyboard Shortcuts:
  Ctrl+C         Exit
  Ctrl+U         Clear current input
  Ctrl+W         Delete last word
  Arrow keys     Move cursor
  Enter          Send message

Permission Dialog:
  Y              Allow tool use (once)
  N              Deny tool use
  S              Allow tool use for session
  Esc            Cancel
    `.trim();

    // Store in a special message that will be displayed
    context.session.addMessage({
      role: 'assistant',
      content: helpText,
      timestamp: new Date(),
    });
  },
};
