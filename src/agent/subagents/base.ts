import type { AnthropicProvider } from '../../providers/anthropic';
import type { ToolRegistry } from '../../tools/registry';
import type { Message } from '../../types';

export interface SubagentConfig {
  provider: AnthropicProvider;
  tools: ToolRegistry;
  systemPrompt: string;
  maxTokens: number;
  model?: string;
}

export interface SubagentResult {
  success: boolean;
  output: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export abstract class BaseSubagent {
  protected config: SubagentConfig;
  protected messages: Message[] = [];

  constructor(config: SubagentConfig) {
    this.config = config;
  }

  abstract execute(task: string): Promise<SubagentResult>;

  protected addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({ role, content, timestamp: new Date() });
  }

  getMessages(): Message[] {
    return [...this.messages];
  }
}
