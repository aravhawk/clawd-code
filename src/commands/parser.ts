export interface ParsedCommand {
  isCommand: boolean;
  name: string;
  args: string[];
  raw: string;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  // Check if it's a command (starts with /)
  if (!trimmed.startsWith('/')) {
    return {
      isCommand: false,
      name: '',
      args: [],
      raw: trimmed,
    };
  }

  // Remove the leading / and split by spaces
  const parts = trimmed.slice(1).split(/\s+/);
  const name = parts[0] || '';
  const args = parts.slice(1);

  return {
    isCommand: true,
    name,
    args,
    raw: trimmed,
  };
}

export interface CommandDefinition {
  name: string;
  description: string;
  handler: (args: string[], context: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  session: any; // SessionManager
  exit: () => void;
  setInput: (input: string) => void;
  clearMessages: () => void;
  setDebugMode: (debug: boolean) => void;
}
