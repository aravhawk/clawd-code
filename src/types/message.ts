/**
 * Message type definitions.
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: Date | number;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result' | 'image';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  tool_use_id?: string;
  is_error?: boolean;
  source?: ImageSource;
}

export interface ImageSource {
  type: 'base64' | 'url';
  media_type: string;
  data: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Type guard for text blocks.
 */
export function isTextBlock(block: ContentBlock): block is TextBlock {
  return block.type === 'text' && typeof block.text === 'string';
}

/**
 * Type guard for tool use blocks.
 */
export function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === 'tool_use' && typeof block.name === 'string';
}

/**
 * Type guard for tool result blocks.
 */
export function isToolResultBlock(block: ContentBlock): block is ToolResultBlock {
  return block.type === 'tool_result' && typeof block.tool_use_id === 'string';
}

/**
 * Extract text content from a message.
 */
export function extractText(message: Message): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  return message.content
    .filter(isTextBlock)
    .map((block) => block.text)
    .join('\n');
}

/**
 * Extract tool uses from a message.
 */
export function extractToolUses(message: Message): ToolUseBlock[] {
  if (typeof message.content === 'string') {
    return [];
  }

  return message.content.filter(isToolUseBlock) as ToolUseBlock[];
}

export default Message;
