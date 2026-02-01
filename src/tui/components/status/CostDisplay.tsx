import React from 'react';
import { Box, Text } from 'ink';

export interface CostDisplayProps {
  cost: number;
  budget?: number;
  compact?: boolean;
}

/**
 * Displays API cost with optional budget tracking.
 */
export function CostDisplay({ cost, budget, compact = false }: CostDisplayProps) {
  const percentage = budget ? (cost / budget) * 100 : undefined;

  // Color based on budget usage
  const getColor = (): string => {
    if (!percentage) return 'green';
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    return 'green';
  };

  const formatCost = (value: number): string => {
    if (value >= 1) return `$${value.toFixed(2)}`;
    if (value >= 0.01) return `$${value.toFixed(3)}`;
    return `$${value.toFixed(4)}`;
  };

  if (compact) {
    return (
      <Text>
        <Text dimColor>Cost: </Text>
        <Text color={getColor()}>{formatCost(cost)}</Text>
      </Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Session Cost</Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Current: </Text>
        <Text color={getColor()}>{formatCost(cost)}</Text>
        {budget && <Text dimColor> / {formatCost(budget)}</Text>}
      </Box>

      {percentage !== undefined && (
        <>
          <Box>
            <Text dimColor>Budget: </Text>
            <Text color={getColor()}>{percentage.toFixed(1)}% used</Text>
          </Box>

          {/* Visual progress bar */}
          <Box marginTop={1}>
            <Text dimColor>{'['}</Text>
            <Text color={getColor()}>
              {'\u2588'.repeat(Math.min(20, Math.floor(percentage / 5)))}
            </Text>
            <Text dimColor>{'\u2591'.repeat(Math.max(0, 20 - Math.floor(percentage / 5)))}</Text>
            <Text dimColor>{']'}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

export default CostDisplay;
