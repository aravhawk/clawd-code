import type { CLIContext } from '../index.js';

/**
 * Run interactive REPL mode
 */
export async function runInteractive(context: CLIContext): Promise<void> {
  // Dynamically import the TUI to avoid loading it for non-interactive modes
  const { startTUI } = await import('../../tui/index.js');

  await startTUI({
    initialPrompt: context.args.prompt,
    continueSession: context.args.continue,
    resumeSessionId: context.args.resume,
    model: context.args.model,
    verbose: context.args.verbose,
    debug: context.args.debug,
  });
}
