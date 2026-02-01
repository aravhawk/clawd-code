import React from 'react';
import { Box, Text } from 'ink';

export interface UserMessageProps {
  content: string;
  timestamp?: string;
  compact?: boolean;
}

/**
 * Displays a user message with distinct styling.
 */
export function UserMessage({ content, timestamp, compact = false }: UserMessageProps) {
  return (
    <Box flexDirection="column" marginY={compact ? 0 : 1}>
      {/* Header */}
      <Box>
        <Text bold color="blue">
          You
        </Text>
        {timestamp && <Text dimColor> {timestamp}</Text>}
      </Box>

      {/* Content */}
      <Box marginLeft={2} marginTop={compact ? 0 : 1}>
        <Text>{content}</Text>
      </Box>
    </Box>
  );
}

export default UserMessage;
