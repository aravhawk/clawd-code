import { CLI_FLAGS, getFlagByName } from './flags.js';

export interface ParsedArgs {
  [key: string]: unknown;
  // Flags
  help: boolean;
  version: boolean;
  print: boolean;
  continue: boolean;
  resume?: string;
  model: string;
  allowedTools?: string[];
  disallowedTools?: string[];
  maxTurns?: number;
  systemPrompt?: string;
  verbose: boolean;
  debug: boolean;

  // Positional arguments (prompt)
  positional: string[];
  prompt?: string;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    help: false,
    version: false,
    print: false,
    continue: false,
    model: 'claude-sonnet-4-20250514',
    verbose: false,
    debug: false,
    positional: [],
  };

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      // Long flag
      const flagName = arg.slice(2);
      const flag = getFlagByName(flagName);

      if (flag) {
        if (flag.type === 'boolean') {
          (result as Record<string, unknown>)[toCamelCase(flag.name)] = true;
        } else if (flag.type === 'string' || flag.type === 'number') {
          i++;
          const value = argv[i];
          if (flag.type === 'number') {
            (result as Record<string, unknown>)[toCamelCase(flag.name)] = parseInt(value, 10);
          } else {
            (result as Record<string, unknown>)[toCamelCase(flag.name)] = value;
          }
        } else if (flag.type === 'array') {
          i++;
          const value = argv[i];
          (result as Record<string, unknown>)[toCamelCase(flag.name)] = value.split(',');
        }
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flag
      const shortName = arg.slice(1);
      const flag = getFlagByName(shortName);

      if (flag) {
        if (flag.type === 'boolean') {
          (result as Record<string, unknown>)[toCamelCase(flag.name)] = true;
        } else if (flag.type === 'string' || flag.type === 'number') {
          i++;
          const value = argv[i];
          if (flag.type === 'number') {
            (result as Record<string, unknown>)[toCamelCase(flag.name)] = parseInt(value, 10);
          } else {
            (result as Record<string, unknown>)[toCamelCase(flag.name)] = value;
          }
        }
      }
    } else {
      // Positional argument
      result.positional.push(arg);
    }

    i++;
  }

  // Join positional args as prompt
  if (result.positional.length > 0) {
    result.prompt = result.positional.join(' ');
  }

  return result;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
