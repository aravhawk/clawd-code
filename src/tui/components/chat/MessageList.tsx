import React from 'react';
import { Box, Text } from 'ink';
import { Message, MessageProps } from './Message';
import { StreamingMessage } from './StreamingMessage';
import { ThinkingSpinner } from '../core/Spinner';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: number;
  toolUse?: ToolUseBlock[];
  toolResults?: ToolResult[];
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  is_error?: boolean;
}

export interface MessageListProps {
  messages: ConversationMessage[];
  streamingContent?: string;
  isLoading?: boolean;
  showTimestamps?: boolean;
  compact?: boolean;
}

/**
 * Displays the conversation history.
 */
export function MessageList({
  messages,
  streamingContent,
  isLoading = false,
  showTimestamps = false,
  compact = false,
}: MessageListProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      {messages.map((message, index) => (
        <Message
          key={message.id || index}
          role={message.role}
          content={message.content}
          timestamp={showTimestamps ? message.timestamp : undefined}
          toolUse={message.toolUse}
          toolResults={message.toolResults}
          compact={compact}
        />
      ))}

      {/* Streaming response */}
      {streamingContent && <StreamingMessage content={streamingContent} isComplete={false} />}

      {/* Loading indicator */}
      {isLoading && !streamingContent && (
        <Box marginY={1}>
          <ThinkingSpinner />
        </Box>
      )}
    </Box>
  );
}

export default MessageList;
