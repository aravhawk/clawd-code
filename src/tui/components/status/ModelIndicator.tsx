import React from 'react';
import { Box, Text } from 'ink';

export interface ModelIndicatorProps {
  model: string;
  compact?: boolean;
  onClick?: () => void;
}

// Model display names and colors
const modelInfo: Record<string, { name: string; color: string }> = {
  'claude-sonnet-4-20250514': { name: 'Sonnet 4', color: 'cyan' },
  'claude-3-5-sonnet-20241022': { name: 'Sonnet 3.5', color: 'cyan' },
  'claude-3-5-haiku-20241022': { name: 'Haiku 3.5', color: 'green' },
  'claude-3-opus-20240229': { name: 'Opus', color: 'magenta' },
  'claude-3-sonnet-20240229': { name: 'Sonnet 3', color: 'blue' },
  'claude-3-haiku-20240307': { name: 'Haiku', color: 'green' },
};

/**
 * Displays the current model with a friendly name and color.
 */
export function ModelIndicator({ model, compact = false }: ModelIndicatorProps) {
  const info = modelInfo[model] || { name: model.slice(0, 15), color: 'white' };

  if (compact) {
    return (
      <Text>
        <Text dimColor>Model: </Text>
        <Text color={info.color} bold>
          {info.name}
        </Text>
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Model</Text>
      </Box>

      <Box marginTop={1}>
        <Text color={info.color} bold>
          {info.name}
        </Text>
      </Box>

      <Box>
        <Text dimColor wrap="truncate">
          {model}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press </Text>
        <Text bold>Ctrl+M</Text>
        <Text dimColor> to change</Text>
      </Box>
    </Box>
  );
}

export default ModelIndicator;
