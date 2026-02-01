import React from 'react';
import { Box, Text, useInput } from 'ink';

export interface HelpModalProps {
  onClose: () => void;
}

interface KeyBinding {
  keys: string;
  description: string;
  category: string;
}

const keyBindings: KeyBinding[] = [
  // Navigation
  { keys: '\u2191/\u2193', description: 'Navigate history / options', category: 'Navigation' },
  { keys: 'Esc', description: 'Cancel / Close modal', category: 'Navigation' },
  { keys: 'Ctrl+C', description: 'Abort current operation', category: 'Navigation' },

  // Input
  { keys: 'Enter', description: 'Submit message', category: 'Input' },
  { keys: '/', description: 'Open command palette', category: 'Input' },
  { keys: 'Ctrl+L', description: 'Clear screen', category: 'Input' },

  // Session
  { keys: 'Ctrl+N', description: 'New session', category: 'Session' },
  { keys: 'Ctrl+R', description: 'Resume session', category: 'Session' },
  { keys: 'Ctrl+S', description: 'Save session', category: 'Session' },

  // Display
  { keys: 'Ctrl+V', description: 'Toggle verbose mode', category: 'Display' },
  { keys: 'Ctrl+M', description: 'Change model', category: 'Display' },
  { keys: '?', description: 'Show this help', category: 'Display' },
];

/**
 * Help modal showing keyboard shortcuts and commands.
 */
export function HelpModal({ onClose }: HelpModalProps) {
  useInput((input, key) => {
    if (key.escape || input === 'q' || input === '?') {
      onClose();
    }
  });

  // Group bindings by category
  const categories = [...new Set(keyBindings.map((b) => b.category))];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={60}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Clawd Code - Help
        </Text>
      </Box>

      {/* Keyboard shortcuts */}
      {categories.map((category) => (
        <Box key={category} flexDirection="column" marginBottom={1}>
          <Text bold underline>
            {category}
          </Text>
          {keyBindings
            .filter((b) => b.category === category)
            .map((binding) => (
              <Box key={binding.keys}>
                <Text color="cyan" bold>
                  {binding.keys.padEnd(12)}
                </Text>
                <Text>{binding.description}</Text>
              </Box>
            ))}
        </Box>
      ))}

      {/* Slash commands */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold underline>
          Slash Commands
        </Text>
        <Box>
          <Text color="cyan">/help</Text>
          <Text dimColor> - Show help</Text>
        </Box>
        <Box>
          <Text color="cyan">/clear</Text>
          <Text dimColor> - Clear conversation</Text>
        </Box>
        <Box>
          <Text color="cyan">/compact</Text>
          <Text dimColor> - Compact context</Text>
        </Box>
        <Box>
          <Text color="cyan">/model</Text>
          <Text dimColor> - Change model</Text>
        </Box>
        <Box>
          <Text color="cyan">/mcp</Text>
          <Text dimColor> - Manage MCP servers</Text>
        </Box>
        <Box>
          <Text color="cyan">/resume</Text>
          <Text dimColor> - Resume session</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>Press Esc or ? to close</Text>
      </Box>
    </Box>
  );
}

export default HelpModal;
