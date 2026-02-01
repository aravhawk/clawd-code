import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SessionInfo {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tokenCount?: number;
}

export interface SessionPickerProps {
  sessions: SessionInfo[];
  onSelect: (sessionId: string) => void;
  onClose: () => void;
  onDelete?: (sessionId: string) => void;
}

/**
 * Modal for selecting a previous session to resume.
 */
export function SessionPicker({ sessions, onSelect, onClose, onDelete }: SessionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) {
      if (confirmDelete) {
        setConfirmDelete(null);
      } else {
        onClose();
      }
      return;
    }

    if (key.return) {
      if (confirmDelete) {
        onDelete?.(confirmDelete);
        setConfirmDelete(null);
      } else if (sessions[selectedIndex]) {
        onSelect(sessions[selectedIndex].id);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(sessions.length - 1, i + 1));
      return;
    }

    // Delete with 'd' or 'x'
    if ((input === 'd' || input === 'x') && onDelete && sessions[selectedIndex]) {
      setConfirmDelete(sessions[selectedIndex].id);
      return;
    }

    // Cancel delete with 'n'
    if (input === 'n' && confirmDelete) {
      setConfirmDelete(null);
      return;
    }
  });

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={70}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Resume Session
        </Text>
        <Text dimColor> ({sessions.length} sessions)</Text>
      </Box>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <Box borderStyle="single" borderColor="red" padding={1} marginBottom={1}>
          <Text color="red">Delete this session? (y/n)</Text>
        </Box>
      )}

      {/* Session list */}
      <Box flexDirection="column" height={12} overflowY="hidden">
        {sessions.length === 0 ? (
          <Text dimColor>No previous sessions found</Text>
        ) : (
          sessions.slice(0, 12).map((session, i) => (
            <Box key={session.id}>
              <Text color={i === selectedIndex ? 'cyan' : undefined} inverse={i === selectedIndex}>
                {' '}
                <Text bold={i === selectedIndex}>{session.name.slice(0, 30).padEnd(30)}</Text>
                <Text dimColor> {formatDate(session.updatedAt).padEnd(12)}</Text>
                <Text dimColor>{String(session.messageCount).padStart(3)} msgs</Text>
              </Text>
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>\u2191\u2193 navigate | Enter select | d delete | Esc close</Text>
      </Box>
    </Box>
  );
}

export default SessionPicker;
