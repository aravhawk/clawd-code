import React from 'react';
import { Box, Text } from 'ink';

export interface AssistantMessageProps {
  content: string;
  timestamp?: string;
  compact?: boolean;
  isStreaming?: boolean;
}

/**
 * Displays an assistant (Claude) message.
 */
export function AssistantMessage({
  content,
  timestamp,
  compact = false,
  isStreaming = false,
}: AssistantMessageProps) {
  return (
    <Box flexDirection="column" marginY={compact ? 0 : 1}>
      {/* Header */}
      <Box>
        <Text bold color="magenta">
          Clawd
        </Text>
        {isStreaming && <Text color="yellow"> (typing...)</Text>}
        {timestamp && <Text dimColor> {timestamp}</Text>}
      </Box>

      {/* Content */}
      <Box marginLeft={2} marginTop={compact ? 0 : 1} flexDirection="column">
        <Text wrap="wrap">{content}</Text>
        {isStreaming && <Text dimColor>\u2588</Text>}
      </Box>
    </Box>
  );
}

export default AssistantMessage;
