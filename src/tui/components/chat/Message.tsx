import React from 'react';
import { Box, Text } from 'ink';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { ToolMessage } from './ToolMessage';
import type { ContentBlock, ToolUseBlock, ToolResult } from './MessageList';

export interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[];
  timestamp?: number;
  toolUse?: ToolUseBlock[];
  toolResults?: ToolResult[];
  compact?: boolean;
}

/**
 * Individual message container that delegates to role-specific components.
 */
export function Message({
  role,
  content,
  timestamp,
  toolUse,
  toolResults,
  compact = false,
}: MessageProps) {
  // Format timestamp if provided
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined;

  // Extract text content
  const textContent =
    typeof content === 'string'
      ? content
      : content
          .filter((block) => block.type === 'text')
          .map((block) => block.text)
          .join('\n');

  // Extract tool uses from content blocks if not provided separately
  const toolUseBlocks =
    toolUse ||
    (Array.isArray(content)
      ? content.filter(
          (block): block is ContentBlock & { type: 'tool_use' } => block.type === 'tool_use'
        )
      : []);

  return (
    <Box flexDirection="column" marginY={compact ? 0 : 1}>
      {role === 'user' && (
        <UserMessage content={textContent} timestamp={formattedTime} compact={compact} />
      )}

      {role === 'assistant' && (
        <>
          <AssistantMessage content={textContent} timestamp={formattedTime} compact={compact} />
          {toolUseBlocks.map((tool) => (
            <ToolMessage
              key={tool.id}
              toolName={tool.name!}
              toolInput={tool.input!}
              result={toolResults?.find((r) => r.tool_use_id === tool.id)}
              compact={compact}
            />
          ))}
        </>
      )}

      {role === 'system' && (
        <Box marginLeft={2}>
          <Text dimColor italic>
            {textContent}
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default Message;
