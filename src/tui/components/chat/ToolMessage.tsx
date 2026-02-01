import React, { useState } from 'react';
import { Box, Text } from 'ink';
import type { ToolResult } from './MessageList';

export interface ToolMessageProps {
  toolName: string;
  toolInput: Record<string, unknown>;
  result?: ToolResult;
  compact?: boolean;
}

/**
 * Displays a tool invocation and its result.
 */
export function ToolMessage({ toolName, toolInput, result, compact = false }: ToolMessageProps) {
  const [expanded, setExpanded] = useState(false);

  // Format tool input for display
  const formatInput = (input: Record<string, unknown>): string => {
    // For common tools, show a summary
    switch (toolName) {
      case 'Bash':
        return `$ ${input.command}`;
      case 'Read':
        return `${input.filePath}`;
      case 'Write':
        return `${input.filePath}`;
      case 'Edit':
        return `${input.filePath}`;
      case 'Glob':
        return `${input.pattern}`;
      case 'Grep':
        return `/${input.pattern}/`;
      default:
        return JSON.stringify(input, null, 2).slice(0, 100);
    }
  };

  // Truncate result for display
  const truncateResult = (content: string, maxLines = 10): string => {
    const lines = content.split('\n');
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)`;
  };

  const inputSummary = formatInput(toolInput);
  const hasResult = result !== undefined;
  const isError = result?.is_error;

  return (
    <Box
      flexDirection="column"
      marginY={compact ? 0 : 1}
      marginLeft={2}
      borderStyle="single"
      borderColor={isError ? 'red' : hasResult ? 'green' : 'yellow'}
      paddingX={1}
    >
      {/* Tool header */}
      <Box>
        <Text bold color={isError ? 'red' : 'cyan'}>
          {'\u2699'} {toolName}
        </Text>
        {!hasResult && <Text color="yellow"> (running...)</Text>}
        {hasResult && !isError && <Text color="green"> \u2713</Text>}
        {isError && <Text color="red"> \u2717</Text>}
      </Box>

      {/* Input summary */}
      <Box marginTop={compact ? 0 : 1}>
        <Text dimColor>{inputSummary}</Text>
      </Box>

      {/* Result */}
      {hasResult && (
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>\u2500\u2500 Result \u2500\u2500</Text>
          <Box marginTop={compact ? 0 : 1}>
            <Text color={isError ? 'red' : undefined} wrap="wrap">
              {expanded ? result.content : truncateResult(result.content || '', compact ? 5 : 10)}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default ToolMessage;
