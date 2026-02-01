import React from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '../core/Spinner';

export interface StreamingMessageProps {
  content: string;
  isComplete: boolean;
  toolUse?: {
    name: string;
    input?: Record<string, unknown>;
  };
}

/**
 * Displays a message that is currently being streamed.
 */
export function StreamingMessage({ content, isComplete, toolUse }: StreamingMessageProps) {
  return (
    <Box flexDirection="column" marginY={1}>
      {/* Role indicator */}
      <Box>
        <Text bold color="magenta">
          Clawd
        </Text>
        {!isComplete && (
          <Box marginLeft={1}>
            <Spinner type="dots" color="cyan" />
          </Box>
        )}
      </Box>

      {/* Message content */}
      <Box marginLeft={2} marginTop={1} flexDirection="column">
        <Text wrap="wrap">{content}</Text>

        {/* Cursor animation for streaming */}
        {!isComplete && <Text dimColor>{'\u2588'}</Text>}
      </Box>

      {/* Tool use indicator */}
      {toolUse && (
        <Box
          marginTop={1}
          marginLeft={2}
          borderStyle="single"
          borderColor="yellow"
          paddingX={1}
          paddingY={0}
        >
          <Text dimColor>
            Using tool: <Text bold>{toolUse.name}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default StreamingMessage;
