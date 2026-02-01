import React from 'react';
import { Box, Text } from 'ink';

export interface TokenCounterProps {
  input: number;
  output: number;
  total?: number;
  limit?: number;
  compact?: boolean;
}

/**
 * Displays token usage with optional context window limit.
 */
export function TokenCounter({ input, output, total, limit, compact = false }: TokenCounterProps) {
  const actualTotal = total ?? input + output;
  const percentage = limit ? (actualTotal / limit) * 100 : undefined;

  // Color based on usage
  const getColor = (): string => {
    if (!percentage) return 'white';
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const formatTokens = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  if (compact) {
    return (
      <Text>
        <Text dimColor>Tokens: </Text>
        <Text color={getColor()}>{formatTokens(actualTotal)}</Text>
        {percentage !== undefined && <Text dimColor> ({percentage.toFixed(0)}%)</Text>}
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Token Usage</Text>
        {percentage !== undefined && <Text color={getColor()}> ({percentage.toFixed(1)}%)</Text>}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Input: </Text>
        <Text>{formatTokens(input)}</Text>
      </Box>

      <Box>
        <Text dimColor>Output: </Text>
        <Text>{formatTokens(output)}</Text>
      </Box>

      <Box>
        <Text dimColor>Total: </Text>
        <Text color={getColor()}>{formatTokens(actualTotal)}</Text>
        {limit && <Text dimColor> / {formatTokens(limit)}</Text>}
      </Box>

      {/* Visual progress bar */}
      {percentage !== undefined && (
        <Box marginTop={1}>
          <Text dimColor>{'['}</Text>
          <Text color={getColor()}>{'\u2588'.repeat(Math.floor(percentage / 5))}</Text>
          <Text dimColor>{'\u2591'.repeat(20 - Math.floor(percentage / 5))}</Text>
          <Text dimColor>{']'}</Text>
        </Box>
      )}
    </Box>
  );
}

export default TokenCounter;
