import { render } from 'ink';
import { App } from './tui/index.js';
import { ConfigLoader } from './config/index.js';
import { ToolRegistry } from './tools/index.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { SessionManager } from './session/index.js';
import {
  BashTool,
  ReadTool,
  WriteTool,
  EditTool,
  GlobTool,
  GrepTool,
  LsTool,
  TaskTool,
  QuestionTool,
  TodoWriteTool,
  TodoReadTool,
} from './tools/builtin/index.js';
import { Logger } from './utils/index.js';

const log = Logger.create('ClawdCode');

export interface ClawdCodeOptions {
  prompt?: string;
  continue?: boolean;
  resume?: string;
  debug?: boolean;
}

export async function runClawdCode(options: ClawdCodeOptions = {}): Promise<void> {
  log.info('Starting Clawd Code...');

  let sessionManager: SessionManager | null = null;
  let cleanupExecuted = false;

  // Setup cleanup handler
  const cleanup = async () => {
    if (cleanupExecuted) return;
    cleanupExecuted = true;

    try {
      if (sessionManager) {
        log.info('Saving session before exit...');
        await sessionManager.saveCurrent();
      }
    } catch (error) {
      log.error('Failed to save session during cleanup:', error);
    }
  };

  // Handle graceful shutdown signals
  const signalHandler = async (signal: string) => {
    log.info(`Received ${signal}, shutting down gracefully...`);
    await cleanup();
    process.exit(0);
  };

  process.on('SIGINT', () => signalHandler('SIGINT'));
  process.on('SIGTERM', () => signalHandler('SIGTERM'));

  try {
    // Load configuration
    const config = new ConfigLoader();
    await config.load();
    config.validate();

    // Initialize Anthropic provider
    const apiKey = config.getApiKey();
    const baseUrl = config.getBaseUrl();
    const model = config.getModel();

    const provider = new AnthropicProvider(apiKey, model, baseUrl);

    // Initialize session manager
    sessionManager = new SessionManager();

    if (options.resume) {
      const resumed = await sessionManager.resume(options.resume);
      if (resumed) {
        log.info(`Resumed session: ${options.resume}`);
      } else {
        log.warn(`Failed to resume session: ${options.resume}, creating new session`);
        await sessionManager.create();
      }
    } else if (options.continue) {
      const lastSession = await sessionManager.loadMostRecent();
      if (lastSession) {
        log.info(`Continued session: ${lastSession.id}`);
      } else {
        log.info('No previous session found, creating new session');
        await sessionManager.create();
      }
    } else {
      await sessionManager.create();
      log.info(`Created new session: ${sessionManager.currentId}`);
    }

    // Initialize tool registry
    const permissions = config.getPermissions() as { mode?: string };
    const tools = new ToolRegistry({
      cwd: process.cwd(),
      sessionId: sessionManager.currentId || 'default',
      permissionMode: (permissions.mode as any) || 'default',
    });

    // Register built-in tools
    const toolContext = tools.getContext();
    tools.register(new BashTool(toolContext));
    tools.register(new ReadTool(toolContext));
    tools.register(new WriteTool(toolContext));
    tools.register(new EditTool(toolContext));
    tools.register(new GlobTool(toolContext));
    tools.register(new GrepTool(toolContext));
    tools.register(new LsTool(toolContext));
    tools.register(new TaskTool(toolContext));
    tools.register(new QuestionTool(toolContext));
    tools.register(new TodoWriteTool(toolContext));
    tools.register(new TodoReadTool(toolContext));

    log.debug(`Registered ${tools.size()} tools`);

    // Render TUI
    const { waitUntilExit } = render(
      <App
        initialPrompt={options.prompt ?? undefined}
        continueSession={options.continue ?? false}
        resumeSessionId={options.resume}
        debugMode={options.debug ?? false}
        provider={provider}
        tools={tools}
        session={sessionManager}
      />
    );

    await waitUntilExit();

    // Normal exit cleanup
    await cleanup();
    log.info('Clawd Code exited');
  } catch (error) {
    log.error('Fatal error in Clawd Code:', error);
    await cleanup();
    throw error;
  }
}
