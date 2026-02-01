import { parseArgs, ParsedArgs } from './parser.js';
import { CLI_FLAGS } from './flags.js';
import { runInteractive } from './commands/run.js';
import { runPrint } from './commands/print.js';

export interface CLIContext {
  args: ParsedArgs;
  cwd: string;
}

export async function startCLI(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);

  const context: CLIContext = {
    args,
    cwd: process.cwd(),
  };

  // Handle version flag
  if (args.version) {
    const pkg = await import('../../package.json', { assert: { type: 'json' } });
    console.log(`clawd-code v${pkg.default.version}`);
    process.exit(0);
  }

  // Handle help flag
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Handle print mode (non-interactive)
  if (args.print) {
    await runPrint(context);
    return;
  }

  // Default: interactive mode
  await runInteractive(context);
}

function printHelp(): void {
  console.log(`
clawd-code - An agentic coding tool that lives in your terminal

USAGE:
  clawd [options] [prompt]

OPTIONS:
  -p, --print           Run in non-interactive mode (print response and exit)
  -c, --continue        Continue the most recent session
  -r, --resume <id>     Resume a specific session by ID
  -m, --model <model>   Specify the model to use
  --allowedTools <t>    Comma-separated list of allowed tools
  --disallowedTools <t> Comma-separated list of disallowed tools
  --max-turns <n>       Maximum conversation turns
  --system-prompt <p>   Custom system prompt
  -v, --verbose         Enable verbose output
  -d, --debug           Enable debug mode
  -h, --help            Show this help message
  --version             Show version number

EXAMPLES:
  clawd                           Start interactive session
  clawd "fix the bug in main.ts"  Start with initial prompt
  clawd -p "explain this code"    Non-interactive mode
  clawd -c                        Continue last session
  clawd -r abc123                 Resume specific session

KEYBOARD SHORTCUTS:
  Escape    Cancel current operation
  Ctrl+C    Exit the application
  Ctrl+P    Open command palette

For more information, visit: https://github.com/anomalyco/clawd-code
`);
}

export { parseArgs } from './parser.js';
export { CLI_FLAGS } from './flags.js';
