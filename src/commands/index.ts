import type { CommandDefinition, CommandContext } from './parser';
import { parseCommand } from './parser';
import {
  helpCommand,
  clearCommand,
  exitCommand,
  modelCommand,
  compactCommand,
  permissionsCommand,
  mcpCommand,
  resumeCommand,
  bugCommand,
  agentsCommand,
} from './builtin';

const builtInCommands: CommandDefinition[] = [
  helpCommand,
  clearCommand,
  exitCommand,
  modelCommand,
  compactCommand,
  permissionsCommand,
  mcpCommand,
  resumeCommand,
  bugCommand,
  agentsCommand,
];

export class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map();
  private context: CommandContext;

  constructor(context: CommandContext) {
    this.context = context;
    // Register built-in commands
    for (const cmd of builtInCommands) {
      this.register(cmd);
    }
  }

  register(command: CommandDefinition): void {
    this.commands.set(command.name, command);
  }

  async execute(input: string): Promise<boolean> {
    const parsed = parseCommand(input);

    if (!parsed.isCommand) {
      return false; // Not a command
    }

    const command = this.commands.get(parsed.name);
    if (!command) {
      // Unknown command
      this.context.session.addMessage({
        role: 'assistant',
        content: `Unknown command: /${parsed.name}\n\nType /help to see available commands.`,
        timestamp: new Date(),
      });
      return true;
    }

    // Execute the command
    await command.handler(parsed.args, this.context);
    return true;
  }

  getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  getCommand(name: string): CommandDefinition | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }
}

export { parseCommand };
export type { CommandDefinition, CommandContext };
