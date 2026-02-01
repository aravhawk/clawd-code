import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';

export interface LogEntry {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export interface LogsViewerProps {
  logs: LogEntry[];
  onClose: () => void;
}

/**
 * Debug logs viewer modal.
 */
export function LogsViewer({ logs, onClose }: LogsViewerProps) {
  const [filter, setFilter] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxVisible = 15;

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    return logs.filter((log) => log.level === filter);
  }, [logs, filter]);

  const visibleLogs = filteredLogs.slice(scrollOffset, scrollOffset + maxVisible);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.upArrow) {
      setScrollOffset((o) => Math.max(0, o - 1));
      return;
    }

    if (key.downArrow) {
      setScrollOffset((o) => Math.min(filteredLogs.length - maxVisible, o + 1));
      return;
    }

    if (key.pageUp) {
      setScrollOffset((o) => Math.max(0, o - maxVisible));
      return;
    }

    if (key.pageDown) {
      setScrollOffset((o) => Math.min(filteredLogs.length - maxVisible, o + maxVisible));
      return;
    }

    // Filter shortcuts
    if (input === 'a') setFilter('all');
    if (input === 'd') setFilter('debug');
    if (input === 'i') setFilter('info');
    if (input === 'w') setFilter('warn');
    if (input === 'e') setFilter('error');

    // Jump to bottom with 'g'
    if (input === 'g') {
      setScrollOffset(Math.max(0, filteredLogs.length - maxVisible));
    }
  });

  const levelColors: Record<string, string> = {
    debug: 'gray',
    info: 'cyan',
    warn: 'yellow',
    error: 'red',
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1} width={80}>
      {/* Header */}
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">
          Debug Logs
        </Text>
        <Text dimColor>
          {filteredLogs.length} entries | Filter: {filter}
        </Text>
      </Box>

      {/* Filter bar */}
      <Box marginBottom={1}>
        {(['all', 'debug', 'info', 'warn', 'error'] as const).map((level) => (
          <Box key={level} marginRight={1}>
            <Text
              color={filter === level ? 'cyan' : 'gray'}
              bold={filter === level}
              inverse={filter === level}
            >
              [{level[0].toUpperCase()}] {level}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Log entries */}
      <Box flexDirection="column" height={maxVisible}>
        {visibleLogs.length === 0 ? (
          <Text dimColor>No logs to display</Text>
        ) : (
          visibleLogs.map((log, i) => (
            <Box key={scrollOffset + i}>
              <Text dimColor>{formatTime(log.timestamp)} </Text>
              <Text color={levelColors[log.level]} bold>
                [{log.level.toUpperCase().padEnd(5)}]
              </Text>
              <Text> {log.message.slice(0, 50)}</Text>
            </Box>
          ))
        )}
      </Box>

      {/* Scroll indicator */}
      {filteredLogs.length > maxVisible && (
        <Box marginTop={1}>
          <Text dimColor>
            Showing {scrollOffset + 1}-{Math.min(scrollOffset + maxVisible, filteredLogs.length)} of{' '}
            {filteredLogs.length}
          </Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>
          \u2191\u2193 scroll | PgUp/PgDn | a/d/i/w/e filter | g bottom | Esc close
        </Text>
      </Box>
    </Box>
  );
}

export default LogsViewer;
