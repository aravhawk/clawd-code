import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SessionActionsProps {
  onNewSession: () => void;
  onResumeSession: () => void;
  onSaveSession: () => void;
  onExportSession: () => void;
  onClearSession: () => void;
  onClose: () => void;
}

interface Action {
  key: string;
  label: string;
  description: string;
  action: () => void;
  color?: string;
}

/**
 * Session management actions menu.
 */
export function SessionActions({
  onNewSession,
  onResumeSession,
  onSaveSession,
  onExportSession,
  onClearSession,
  onClose,
}: SessionActionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: Action[] = [
    {
      key: 'n',
      label: 'New Session',
      description: 'Start a fresh session',
      action: onNewSession,
    },
    {
      key: 'r',
      label: 'Resume Session',
      description: 'Resume a previous session',
      action: onResumeSession,
    },
    {
      key: 's',
      label: 'Save Session',
      description: 'Save current session',
      action: onSaveSession,
    },
    {
      key: 'e',
      label: 'Export Transcript',
      description: 'Export to markdown',
      action: onExportSession,
    },
    {
      key: 'c',
      label: 'Clear Messages',
      description: 'Clear current conversation',
      action: onClearSession,
      color: 'yellow',
    },
  ];

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      actions[selectedIndex].action();
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(actions.length - 1, i + 1));
      return;
    }

    // Hotkey selection
    const action = actions.find((a) => a.key === input);
    if (action) {
      action.action();
      onClose();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={50}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Session Actions
        </Text>
      </Box>

      {/* Action list */}
      <Box flexDirection="column">
        {actions.map((action, i) => (
          <Box key={action.key}>
            <Text
              color={i === selectedIndex ? action.color || 'cyan' : action.color}
              inverse={i === selectedIndex}
            >
              {' '}
              <Text bold>[{action.key}]</Text>{' '}
              <Text bold={i === selectedIndex}>{action.label.padEnd(20)}</Text>
              <Text dimColor>{action.description}</Text>
            </Text>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>Press hotkey or use \u2191\u2193 + Enter | Esc to close</Text>
      </Box>
    </Box>
  );
}

export default SessionActions;
