/**
 * Streaming response handler for LLM responses.
 */

import { EventEmitter } from 'events';

export interface StreamEvent {
  type:
    | 'text'
    | 'tool_use'
    | 'message_start'
    | 'message_end'
    | 'content_block_start'
    | 'content_block_end'
    | 'error';
  data?: unknown;
}

export interface TextDeltaEvent extends StreamEvent {
  type: 'text';
  text: string;
}

export interface ToolUseEvent extends StreamEvent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface MessageCompleteEvent extends StreamEvent {
  type: 'message_end';
  message: {
    id: string;
    content: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
    usage: { input_tokens: number; output_tokens: number };
    stop_reason: string;
  };
}

/**
 * Stream processor that handles SSE-style streaming responses.
 */
export class StreamProcessor extends EventEmitter {
  private buffer: string = '';
  private currentToolUse: Partial<ToolUseEvent> | null = null;
  private inputBuffer: string = '';

  constructor() {
    super();
  }

  /**
   * Process a chunk of data from the stream.
   */
  processChunk(chunk: string): void {
    this.buffer += chunk;

    // Process complete events
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.processLine(line);
    }
  }

  /**
   * Process a single line from the stream.
   */
  private processLine(line: string): void {
    if (!line.trim() || line.startsWith(':')) return;

    if (line.startsWith('event: ')) {
      // Event type line, wait for data
      return;
    }

    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        this.emit('done');
        return;
      }

      try {
        const parsed = JSON.parse(data);
        this.handleEvent(parsed);
      } catch {
        // Invalid JSON, skip
      }
    }
  }

  /**
   * Handle a parsed event.
   */
  private handleEvent(event: {
    type: string;
    index?: number;
    delta?: { type: string; text?: string; partial_json?: string };
    content_block?: { type: string; id?: string; name?: string };
    message?: unknown;
  }): void {
    switch (event.type) {
      case 'message_start':
        this.emit('message_start', event.message);
        break;

      case 'content_block_start':
        if (event.content_block?.type === 'tool_use') {
          this.currentToolUse = {
            type: 'tool_use',
            id: event.content_block.id,
            name: event.content_block.name,
          };
          this.inputBuffer = '';
        }
        break;

      case 'content_block_delta':
        if (event.delta?.type === 'text_delta' && event.delta.text) {
          this.emit('text', { type: 'text', text: event.delta.text });
        } else if (event.delta?.type === 'input_json_delta' && event.delta.partial_json) {
          this.inputBuffer += event.delta.partial_json;
        }
        break;

      case 'content_block_stop':
        if (this.currentToolUse) {
          try {
            this.currentToolUse.input = JSON.parse(this.inputBuffer);
          } catch {
            this.currentToolUse.input = {};
          }
          this.emit('tool_use', this.currentToolUse);
          this.currentToolUse = null;
          this.inputBuffer = '';
        }
        break;

      case 'message_stop':
        this.emit('message_end', event);
        break;

      case 'error':
        this.emit('error', event);
        break;
    }
  }

  /**
   * Finish processing the stream.
   */
  finish(): void {
    if (this.buffer.trim()) {
      this.processLine(this.buffer);
    }
    this.emit('finish');
  }
}

/**
 * Create an async iterator from a readable stream.
 */
export async function* streamToAsyncIterator(
  stream: AsyncIterable<Uint8Array>
): AsyncGenerator<StreamEvent> {
  const processor = new StreamProcessor();
  const events: StreamEvent[] = [];
  let done = false;

  processor.on('text', (event) => events.push(event));
  processor.on('tool_use', (event) => events.push(event));
  processor.on('message_start', (event) => events.push({ type: 'message_start', data: event }));
  processor.on('message_end', (event) => events.push({ type: 'message_end', data: event }));
  processor.on('done', () => {
    done = true;
  });

  const decoder = new TextDecoder();

  for await (const chunk of stream) {
    processor.processChunk(decoder.decode(chunk, { stream: true }));

    while (events.length > 0) {
      yield events.shift()!;
    }
  }

  processor.finish();

  while (events.length > 0) {
    yield events.shift()!;
  }
}

export default StreamProcessor;
