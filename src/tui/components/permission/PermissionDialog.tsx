import React, { useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

export interface PermissionDialogProps {
  toolName: string;
  toolInput?: unknown;
  onAllow: () => void;
  onDeny: () => void;
  onAllowSession?: () => void;
  onCancel?: () => void;
}

export function PermissionDialog({
  toolName,
  toolInput,
  onAllow,
  onDeny,
  onAllowSession,
  onCancel,
}: PermissionDialogProps) {
  const inputFormatted =
    typeof toolInput === 'string'
      ? toolInput
      : toolInput
        ? JSON.stringify(toolInput, null, 2)
        : '{}';

  useInput((input, key) => {
    if (key.return) {
      onAllow();
    } else if (key.escape && onCancel) {
      onCancel();
    } else if (input === 'y' || input === 'Y') {
      onAllow();
    } else if (input === 'n' || input === 'N') {
      onDeny();
    } else if ((input === 's' || input === 'S') && onAllowSession) {
      onAllowSession();
    }
  });

  return (
    <Box flexDirection="column" padding={1} borderStyle="double" borderColor="yellow">
      <Box marginBottom={1}>
        <Text bold color="yellow">
          Permission Request
        </Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text bold>Tool:</Text>
        <Text color="cyan">{toolName}</Text>
      </Box>

      {toolInput && (
        <Box marginBottom={1} flexDirection="column">
          <Text bold>Input:</Text>
          <Box marginLeft={2}>
            <Text dimColor>{inputFormatted}</Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Options:</Text>
        <Box marginLeft={2}>
          <Text>
            <Text color="green">Y</Text> - Yes, allow once
          </Text>
        </Box>
        <Box marginLeft={2}>
          <Text>
            <Text color="red">N</Text> - No, deny
          </Text>
        </Box>
        {onAllowSession && (
          <Box marginLeft={2}>
            <Text>
              <Text color="blue">S</Text> - Allow for session
            </Text>
          </Box>
        )}
        {onCancel && (
          <Box marginLeft={2}>
            <Text>
              <Text dimColor>Esc</Text> - Cancel
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
