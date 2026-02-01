import React from 'react';
import { Box, Text } from 'ink';

export interface SessionInfoDisplayProps {
  sessionId: string;
  name: string;
  messageCount: number;
  tokenCount?: number;
  cost?: number;
  createdAt?: number;
  compact?: boolean;
}

/**
 * Displays current session information.
 */
export function SessionInfo({
  sessionId,
  name,
  messageCount,
  tokenCount,
  cost,
  createdAt,
  compact = false,
}: SessionInfoDisplayProps) {
  const formatDuration = (): string => {
    if (!createdAt) return '';
    const duration = Date.now() - createdAt;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just started';
  };

  if (compact) {
    return (
      <Box>
        <Text dimColor>Session: </Text>
        <Text color="cyan">{name.slice(0, 20)}</Text>
        <Text dimColor> | {messageCount} msgs</Text>
        {tokenCount !== undefined && (
          <Text dimColor> | {(tokenCount / 1000).toFixed(1)}k tokens</Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text bold color="cyan">
          Session
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Name: </Text>
        <Text>{name}</Text>
      </Box>

      <Box>
        <Text dimColor>ID: </Text>
        <Text dimColor>{sessionId.slice(0, 8)}...</Text>
      </Box>

      <Box>
        <Text dimColor>Messages: </Text>
        <Text>{messageCount}</Text>
      </Box>

      {tokenCount !== undefined && (
        <Box>
          <Text dimColor>Tokens: </Text>
          <Text>{tokenCount.toLocaleString()}</Text>
        </Box>
      )}

      {cost !== undefined && (
        <Box>
          <Text dimColor>Cost: </Text>
          <Text color="green">${cost.toFixed(4)}</Text>
        </Box>
      )}

      {createdAt && (
        <Box>
          <Text dimColor>Duration: </Text>
          <Text>{formatDuration()}</Text>
        </Box>
      )}
    </Box>
  );
}

export default SessionInfo;
