export interface CLIFlag {
  name: string;
  short?: string;
  description: string;
  type: 'boolean' | 'string' | 'number' | 'array';
  default?: unknown;
}

export const CLI_FLAGS: CLIFlag[] = [
  {
    name: 'help',
    short: 'h',
    description: 'Show help message',
    type: 'boolean',
    default: false,
  },
  {
    name: 'version',
    short: undefined,
    description: 'Show version number',
    type: 'boolean',
    default: false,
  },
  {
    name: 'print',
    short: 'p',
    description: 'Run in non-interactive mode',
    type: 'boolean',
    default: false,
  },
  {
    name: 'continue',
    short: 'c',
    description: 'Continue the most recent session',
    type: 'boolean',
    default: false,
  },
  {
    name: 'resume',
    short: 'r',
    description: 'Resume a specific session by ID',
    type: 'string',
  },
  {
    name: 'model',
    short: 'm',
    description: 'Model to use (e.g., claude-sonnet-4-20250514)',
    type: 'string',
    default: 'claude-sonnet-4-20250514',
  },
  {
    name: 'allowedTools',
    short: undefined,
    description: 'Comma-separated list of allowed tools',
    type: 'array',
  },
  {
    name: 'disallowedTools',
    short: undefined,
    description: 'Comma-separated list of disallowed tools',
    type: 'array',
  },
  {
    name: 'max-turns',
    short: undefined,
    description: 'Maximum conversation turns',
    type: 'number',
  },
  {
    name: 'system-prompt',
    short: undefined,
    description: 'Custom system prompt',
    type: 'string',
  },
  {
    name: 'verbose',
    short: 'v',
    description: 'Enable verbose output',
    type: 'boolean',
    default: false,
  },
  {
    name: 'debug',
    short: 'd',
    description: 'Enable debug mode',
    type: 'boolean',
    default: false,
  },
];

export function getFlagByName(name: string): CLIFlag | undefined {
  return CLI_FLAGS.find((f) => f.name === name || f.short === name);
}
