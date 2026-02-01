import type { AnthropicProvider } from '../providers/anthropic';
import type { ToolRegistry } from '../tools/registry';
import type { SessionManager } from '../session';

export interface AppProps {
  initialPrompt?: string;
  continueSession?: boolean;
  resumeSessionId?: string;
  debugMode?: boolean;
  provider: AnthropicProvider;
  tools: ToolRegistry;
  session: SessionManager;
}
