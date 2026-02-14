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
  maxIterations?: number;
  maxMessages?: number;
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
  private iterationCount = 0;
  private readonly MAX_ITERATIONS: number;
  private readonly MAX_MESSAGES: number;

  constructor(provider: AnthropicProvider, config: AgentLoopConfig) {
    super();
    this.provider = provider;
    this.config = config;
    this.tools = config.tools;
    this.MAX_ITERATIONS = config.maxIterations ?? 50;
    this.MAX_MESSAGES = config.maxMessages ?? 500;
  }

  get currentState(): AgentState {
    return this.state;
  }

  async processUserMessage(content: string): Promise<void> {
    if (!content || content.trim().length === 0) {
      log.warn('Ignoring empty user message');
      return;
    }

    this.messages.push({
      role: 'user',
      content,
      timestamp: new Date(),
    });

    // Check message limit and trim if needed
    if (this.messages.length > this.MAX_MESSAGES) {
      const excess = this.messages.length - this.MAX_MESSAGES;
      log.warn(`Message history exceeds limit, removing ${excess} oldest messages`);
      this.messages = this.messages.slice(excess);
    }

    this.iterationCount = 0;
    await this.runLoop();
  }

  private async runLoop(): Promise<void> {
    this.setState('processing');

    while (this.state !== 'idle' && this.state !== 'stopping') {
      // Check iteration limit to prevent infinite loops
      if (this.iterationCount >= this.MAX_ITERATIONS) {
        log.error(`Maximum iterations (${this.MAX_ITERATIONS}) reached, stopping agent loop`);
        this.emit('error', new Error(`Agent loop exceeded maximum iterations (${this.MAX_ITERATIONS})`));
        this.setState('idle');
        break;
      }

      this.iterationCount++;
      log.debug(`Agent loop iteration ${this.iterationCount}/${this.MAX_ITERATIONS}`);

      try {
        const response = await this.getLLMResponse();
        
        if (!response || response.trim().length === 0) {
          log.warn('Empty response from LLM, ending loop');
          this.setState('idle');
          this.emit('complete');
          break;
        }

        const toolUses = this.extractToolUses(response);

        if (!toolUses || toolUses.length === 0) {
          this.setState('idle');
          this.emit('complete');
          break;
        }

        const toolResults = await this.processToolUses(toolUses);

        // Validate tool results before adding to messages
        if (!toolResults || toolResults.trim().length === 0) {
          log.warn('Empty tool results, adding error message');
          this.messages.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          });
          this.messages.push({
            role: 'user',
            content: JSON.stringify({
              type: 'tool_result',
              error: 'Tool execution produced no results',
            }),
            timestamp: new Date(),
          });
        } else {
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
        }
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

    try {
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
        if (this.state === 'stopping') {
          log.info('Stream interrupted by abort signal');
          break;
        }

        if (!event) {
          log.warn('Received null/undefined stream event');
          continue;
        }

        if (event.type === 'text') {
          if (event.text) {
            fullText += event.text;
            this.emit('textDelta', event.text);
          }
        } else if (event.type === 'done') {
          break;
        }
      }

      return fullText;
    } catch (error) {
      log.error('Error streaming LLM response:', error);
      throw new Error(`Failed to get LLM response: ${(error as Error).message}`);
    }
  }

  private extractToolUses(response: string): ToolUseBlock[] {
    // For now, we'll need to parse tool uses from the response
    // In a full implementation, this would come from the Anthropic API
    return [];
  }

  private async processToolUses(toolUses: ToolUseBlock[]): Promise<string> {
    if (!toolUses || toolUses.length === 0) {
      return '';
    }

    const results: string[] = [];

    for (const toolUse of toolUses) {
      if (!toolUse || !toolUse.name || !toolUse.id) {
        log.warn('Invalid tool use block, skipping:', toolUse);
        results.push(
          JSON.stringify({
            type: 'tool_result',
            tool_use_id: 'invalid',
            content: 'Invalid tool use block',
            is_error: true,
          }),
        );
        continue;
      }

      this.emit('toolStart', toolUse);

      try {
        const result = await this.tools.executeToolUse(toolUse);

        this.emit('toolEnd', toolUse, result);

        results.push(
          JSON.stringify({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result?.content ?? 'No content returned',
            is_error: !result?.success,
          }),
        );
      } catch (error) {
        log.error(`Tool execution failed for ${toolUse.name}:`, error);
        this.emit('toolEnd', toolUse, {
          success: false,
          content: `Tool execution error: ${(error as Error).message}`,
        });

        results.push(
          JSON.stringify({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Tool execution error: ${(error as Error).message}`,
            is_error: true,
          }),
        );
      }
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
