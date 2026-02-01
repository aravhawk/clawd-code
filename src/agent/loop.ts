import { EventEmitter } from 'events';
import type { AnthropicProvider } from '../providers/anthropic';
import type { ToolRegistry } from '../tools/registry';
import type { Message, ToolUseBlock, ToolResult, PermissionRequest } from '../types';
import { Logger } from '../utils/logger';

const log = Logger.create('AgentLoop');

export type AgentState =
  | 'idle'
  | 'processing'
  | 'streaming'
  | 'tool_pending'
  | 'permission_pending'
  | 'executing_tool'
  | 'stopping';

export interface AgentLoopConfig {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  tools: ToolRegistry;
  sessionId: string;
}

export interface AgentLoopEvents {
  stateChange: (state: AgentState) => void;
  textDelta: (text: string) => void;
  toolStart: (tool: ToolUseBlock) => void;
  toolEnd: (tool: ToolUseBlock, result: ToolResult) => void;
  permissionRequest: (request: PermissionRequest) => void;
  error: (error: Error) => void;
  complete: () => void;
}

export class AgentLoop extends EventEmitter {
  private state: AgentState = 'idle';
  private provider: AnthropicProvider;
  private tools: ToolRegistry;
  private config: AgentLoopConfig;
  private abortController: AbortController | null = null;
  private messages: Message[] = [];

  constructor(provider: AnthropicProvider, config: AgentLoopConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.tools = config.tools;
  }

  get currentState(): AgentState {
    return this.state;
  }

  async processUserMessage(content: string): Promise<void> {
    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });

    await this.runLoop();
  }

  private async runLoop(): Promise<void> {
    this.setState('processing');

    while (this.state !== 'idle') {
      try {
        const response = await this.getLLMResponse();
        const toolUses = this.extractToolUses(response);

        if (toolUses.length === 0) {
          this.setState('idle');
          this.emit('complete');
          break;
        }

        const toolResults = await this.processToolUses(toolUses);

        this.messages.push({
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        });

        this.messages.push({
          role: 'user',
          content: toolResults,
          timestamp: new Date(),
        });
      } catch (error) {
        log.error('Loop error:', error);
        this.emit('error', error as Error);
        this.setState('idle');
        break;
      }
    }
  }

  private async getLLMResponse(): Promise<string> {
    this.setState('streaming');

    const stream = this.provider.streamMessage({
      messages: this.messages.map((m) => ({
        role: m.role,
        content: m.content as string,
      })),
      system: this.config.systemPrompt,
      maxTokens: this.config.maxTokens,
      tools: this.tools.getDefinitions(),
    });

    let fullText = '';

    for await (const event of stream) {
      if (event.type === 'text') {
        fullText += event.text;
        this.emit('textDelta', event.text);
      } else if (event.type === 'done') {
        break;
      }
    }

    return fullText;
  }

  private extractToolUses(response: string): ToolUseBlock[] {
    // For now, we'll need to parse tool uses from the response
    // In a full implementation, this would come from the Anthropic API
    return [];
  }

  private async processToolUses(toolUses: ToolUseBlock[]): Promise<string> {
    const results: string[] = [];

    for (const toolUse of toolUses) {
      this.emit('toolStart', toolUse);

      const result = await this.tools.executeToolUse(toolUse);

      this.emit('toolEnd', toolUse, result);

      results.push(
        JSON.stringify({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.content,
        }),
      );
    }

    return results.join('\n');
  }

  private setState(state: AgentState): void {
    this.state = state;
    this.emit('stateChange', state);
  }

  abort(): void {
    this.abortController?.abort();
    this.setState('idle');
  }
}
