import Anthropic from '@anthropic-ai/sdk';
import type { ToolUseBlock } from '../types';
import { Logger } from '../utils/logger';

const log = Logger.create('AnthropicProvider');

export interface StreamOptions {
  messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
  system?: string;
  maxTokens: number;
  tools?: unknown[];
  model?: string;
}

export type StreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; tool: ToolUseBlock }
  | { type: 'done' };

export class AnthropicProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514', baseURL?: string) {
    this.client = new Anthropic({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: false,
    });
    this.model = model;

    if (baseURL) {
      log.info(`Using custom API endpoint: ${baseURL}`);
    }
  }

  async *streamMessage(options: StreamOptions): AsyncGenerator<StreamEvent> {
    log.debug('Starting message stream with model', this.model);

    // Validate options before making API call
    if (!options.messages || options.messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    if (options.maxTokens <= 0 || options.maxTokens > 200000) {
      throw new Error(`Invalid maxTokens value: ${options.maxTokens}. Must be between 1 and 200000`);
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const stream = await this.client.messages.create({
          model: this.model,
          messages: this.normalizeMessages(options.messages) as any,
          max_tokens: options.maxTokens,
          system: options.system as any,
          tools: this.normalizeTools(options.tools) as any,
          stream: true,
        });

        let currentToolUse: Partial<ToolUseBlock> | null = null;
        let currentToolInputJson = '';
        let currentText = '';
        let eventCount = 0;

        for await (const event of stream) {
          eventCount++;

          if (!event || !event.type) {
            log.warn('Received invalid stream event');
            continue;
          }

          switch (event.type) {
            case 'content_block_start':
              if (event.content_block?.type === 'tool_use') {
                currentToolInputJson = '';
                const toolInput =
                  event.content_block.input && typeof event.content_block.input === 'object'
                    ? (event.content_block.input as Record<string, unknown>)
                    : {};
                currentToolUse = {
                  type: 'tool_use',
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: toolInput,
                };
              }
              break;

            case 'content_block_delta':
              if (event.delta?.type === 'text_delta') {
                const text = event.delta.text || '';
                currentText += text;
                yield { type: 'text', text };
              } else if (event.delta?.type === 'input_json_delta' && currentToolUse) {
                currentToolInputJson += event.delta.partial_json ?? '';
              }
              break;

            case 'content_block_stop':
              if (currentToolUse) {
                try {
                  const parsedInput = this.parseToolInput(currentToolInputJson);
                  if (parsedInput) {
                    currentToolUse.input = parsedInput;
                  }
                  if (!currentToolUse.input) {
                    currentToolUse.input = {};
                  }
                  
                  // Validate tool use has required fields
                  if (!currentToolUse.id || !currentToolUse.name) {
                    log.error('Tool use missing required fields:', currentToolUse);
                  } else {
                    yield {
                      type: 'tool_use',
                      tool: currentToolUse as ToolUseBlock,
                    };
                  }
                } catch (parseError) {
                  log.error('Error processing tool use:', parseError);
                }
                currentToolUse = null;
                currentToolInputJson = '';
              }
              break;

            case 'message_stop':
              log.debug(`Stream completed with ${eventCount} events`);
              yield { type: 'done' };
              break;

            case 'message_start':
            case 'message_delta':
              // Ignore metadata events
              break;

            case 'error':
              log.error('Stream error event:', event);
              throw new Error('Stream error received from API');

            default:
              log.debug('Unknown event type:', event.type);
          }
        }

        // Successfully completed stream
        return;
      } catch (error: any) {
        retryCount++;
        
        // Check if error is retryable
        const isRetryable = 
          error?.status === 429 || // Rate limit
          error?.status === 500 || // Server error
          error?.status === 502 || // Bad gateway
          error?.status === 503 || // Service unavailable
          error?.status === 504 || // Gateway timeout
          error?.message?.includes('ECONNRESET') ||
          error?.message?.includes('ETIMEDOUT');

        if (isRetryable && retryCount <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          log.warn(`Streaming error (attempt ${retryCount}/${maxRetries}), retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Non-retryable error or max retries exceeded
        log.error('Streaming error:', error);
        
        if (error?.status === 429) {
          throw new Error('API rate limit exceeded. Please wait before retrying.');
        } else if (error?.status === 401) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (error?.status === 400) {
          throw new Error(`Invalid request: ${error.message}`);
        }
        
        throw error;
      }
    }
  }

  async createMessage(options: StreamOptions): Promise<unknown> {
    const response = await this.client.messages.create({
      model: this.model,
      messages: this.normalizeMessages(options.messages) as any,
      max_tokens: options.maxTokens,
      system: options.system as any,
      tools: this.normalizeTools(options.tools) as any,
      stream: false,
    });

    return response;
  }

  private normalizeTools(tools?: unknown[]): unknown[] | undefined {
    if (!tools) {
      return undefined;
    }

    return tools.map((tool) => {
      if (!tool || typeof tool !== 'object') {
        return tool;
      }

      const {
        inputSchema,
        input_schema: inputSchemaSnake,
        ...rest
      } = tool as Record<string, unknown>;

      if (inputSchemaSnake !== undefined || inputSchema !== undefined) {
        return {
          ...rest,
          input_schema: (inputSchemaSnake ?? inputSchema) as Record<string, unknown>,
        };
      }

      return { ...rest };
    });
  }

  private normalizeMessages(
    messages: Array<{ role: string; content: string | Array<Record<string, unknown>> }>
  ): Array<{ role: string; content: string | Array<Record<string, unknown>> }> {
    return messages.map((message) => {
      if (typeof message.content === 'string') {
        return message;
      }

      if (!Array.isArray(message.content)) {
        return { ...message, content: String(message.content) };
      }

      const normalizedContent = message.content.map((block) => {
        if (!block || typeof block !== 'object') {
          return { type: 'text', text: String(block) };
        }

        if (block.type === 'tool_result') {
          const { tool_use_id, toolUseId, is_error, isError, content, ...rest } = block as Record<
            string,
            unknown
          >;
          return {
            ...rest,
            type: 'tool_result',
            tool_use_id: (tool_use_id ?? toolUseId) as string,
            is_error: (is_error ?? isError) as boolean | undefined,
            content: content ?? '',
          };
        }

        if (block.type === 'tool_use') {
          const { input, ...rest } = block as Record<string, unknown>;
          return {
            ...rest,
            type: 'tool_use',
            input: input && typeof input === 'object' ? input : {},
          };
        }

        return block;
      });

      return { ...message, content: normalizedContent };
    });
  }

  private parseToolInput(inputJson: string): Record<string, unknown> | null {
    const trimmed = inputJson.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      } else {
        log.warn('Parsed tool input is not a valid object:', typeof parsed);
        return null;
      }
    } catch (error) {
      log.warn('Failed to parse tool input JSON:', {
        error: (error as Error).message,
        input: trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : ''),
      });
      
      // Try to recover from common JSON errors
      try {
        // Remove trailing commas
        const cleaned = trimmed.replace(/,(\s*[}\]])/g, '$1');
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          log.info('Recovered malformed JSON by cleaning');
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Recovery failed, return null
      }
    }

    return null;
  }
}
