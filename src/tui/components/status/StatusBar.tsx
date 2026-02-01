import React from 'react';
import { Box, Text } from 'ink';
import { TokenCounter } from './TokenCounter';
import { CostDisplay } from './CostDisplay';
import { ModelIndicator } from './ModelIndicator';

export interface StatusBarProps {
  model: string;
  tokens?: {
    input: number;
    output: number;
    total?: number;
  };
  cost?: number;
  sessionName?: string;
  isProcessing?: boolean;
  permissionMode?: 'default' | 'auto-accept' | 'plan';
}

/**
 * Bottom status bar showing session info, tokens, cost, and model.
 */
export function StatusBar({
  model,
  tokens,
  cost,
  sessionName,
  isProcessing,
  permissionMode = 'default',
}: StatusBarProps) {
  const permissionModeDisplay = {
    default: 'Default',
    'auto-accept': 'Auto',
    plan: 'Plan',
  };

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      {/* Left section - Session info */}
      <Box>
        {sessionName && (
          <>
            <Text dimColor>Session: </Text>
            <Text color="cyan">{sessionName.slice(0, 20)}</Text>
            <Text dimColor> | </Text>
          </>
        )}
        <Text dimColor>Mode: </Text>
        <Text color={permissionMode === 'auto-accept' ? 'yellow' : 'white'}>
          {permissionModeDisplay[permissionMode]}
        </Text>
      </Box>

      {/* Center section - Processing indicator */}
      <Box>{isProcessing && <Text color="yellow">\u2022 Processing...</Text>}</Box>

      {/* Right section - Tokens, Cost, Model */}
      <Box>
        {tokens && (
          <>
            <TokenCounter
              input={tokens.input}
              output={tokens.output}
              total={tokens.total}
              compact
            />
            <Text dimColor> | </Text>
          </>
        )}
        {cost !== undefined && (
          <>
            <CostDisplay cost={cost} compact />
            <Text dimColor> | </Text>
          </>
        )}
        <ModelIndicator model={model} compact />
      </Box>
    </Box>
  );
}

export default StatusBar;
