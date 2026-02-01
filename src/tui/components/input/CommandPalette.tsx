import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
}

export interface CommandPaletteProps {
  commands: Command[];
  onSelect: (command: string) => void;
  onClose: () => void;
  filter?: string;
}

/**
 * Command palette for slash commands.
 */
export function CommandPalette({ commands, onSelect, onClose, filter = '' }: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState(filter);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchFilter) return commands;

    const lowerFilter = searchFilter.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(lowerFilter) ||
        cmd.description.toLowerCase().includes(lowerFilter) ||
        cmd.aliases?.some((a) => a.toLowerCase().includes(lowerFilter))
    );
  }, [commands, searchFilter]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      if (filteredCommands[selectedIndex]) {
        onSelect(`/${filteredCommands[selectedIndex].name}`);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(filteredCommands.length - 1, i + 1));
      return;
    }

    if (key.backspace) {
      setSearchFilter((f) => f.slice(0, -1));
      setSelectedIndex(0);
      return;
    }

    // Character input for filtering
    if (input && !key.ctrl && !key.meta) {
      setSearchFilter((f) => f + input);
      setSelectedIndex(0);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={60}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Commands
        </Text>
        {searchFilter && <Text dimColor> - filtering: "{searchFilter}"</Text>}
      </Box>

      {/* Command list */}
      <Box flexDirection="column" height={10} overflowY="hidden">
        {filteredCommands.length === 0 ? (
          <Text dimColor>No commands match your filter</Text>
        ) : (
          filteredCommands.slice(0, 10).map((cmd, i) => (
            <Box key={cmd.name}>
              <Text
                color={i === selectedIndex ? 'cyan' : undefined}
                bold={i === selectedIndex}
                inverse={i === selectedIndex}
              >
                {' '}
                /{cmd.name.padEnd(15)}
              </Text>
              <Text dimColor> {cmd.description}</Text>
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>\u2191\u2193 navigate | Enter select | Esc close | Type to filter</Text>
      </Box>
    </Box>
  );
}

// Default commands
export const defaultCommands: Command[] = [
  { name: 'help', description: 'Show help and keyboard shortcuts' },
  { name: 'clear', description: 'Clear the conversation' },
  { name: 'compact', description: 'Compact conversation context' },
  { name: 'model', description: 'Change the model' },
  { name: 'mcp', description: 'Manage MCP servers' },
  { name: 'permissions', description: 'View and manage permissions' },
  { name: 'resume', description: 'Resume a previous session' },
  { name: 'bug', description: 'Report a bug' },
  { name: 'agents', description: 'List available subagents' },
  { name: 'exit', description: 'Exit Clawd Code', aliases: ['quit', 'q'] },
];

export default CommandPalette;
