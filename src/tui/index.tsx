import React from 'react';
import { render } from 'ink';
import { App } from './app.js';
import type { AppProps } from './types.js';
import { AnthropicProvider } from '../providers/anthropic.js';
import { ToolRegistry } from '../tools/registry.js';
import { SessionManager } from '../session/index.js';
import type { ToolContext } from '../tools/base.js';
import { getApiCredentials } from '../utils/env.js';

export interface StartTUIOptions {
  initialPrompt?: string;
  continueSession?: boolean;
  resumeSessionId?: string;
  model?: string;
  verbose?: boolean;
  debug?: boolean;
}

export async function startTUI(options: StartTUIOptions = {}): Promise<void> {
  const credentials = getApiCredentials();
  if (!credentials) {
    console.error('Error: API key not found. Set CLAWD_API_KEY or ANTHROPIC_API_KEY.');
    process.exit(1);
  }

  const model = options.model || 'claude-sonnet-4-20250514';
  const cwd = process.cwd();

  // Initialize core dependencies
  const provider = new AnthropicProvider(credentials.apiKey, model, credentials.baseUrl);

  const toolContext: ToolContext = {
    cwd,
    sessionId: '',
    permissionMode: 'default',
  };
  const tools = new ToolRegistry(toolContext);
  const session = new SessionManager();

  // Resume or continue session if requested
  if (options.resumeSessionId) {
    await session.resume(options.resumeSessionId);
  } else if (options.continueSession) {
    await session.loadMostRecent();
  } else {
    await session.create();
  }

  // Update tool context with session ID
  if (session.currentId) {
    toolContext.sessionId = session.currentId;
  }

  const props: AppProps = {
    initialPrompt: options.initialPrompt,
    continueSession: options.continueSession,
    resumeSessionId: options.resumeSessionId,
    debugMode: options.debug,
    provider,
    tools,
    session,
  };

  const { waitUntilExit } = render(<App {...props} />);
  await waitUntilExit();
}

export { App } from './app.js';
export type { AppProps } from './types.js';
