import React from 'react';
import { Box, Text } from 'ink';

export interface DiffViewerProps {
  oldContent?: string;
  newContent: string;
  filePath: string;
  height?: number;
}

export function DiffViewer({
  oldContent,
  newContent,
  filePath,
  height = 20,
}: DiffViewerProps) {
  // Simple line-by-line diff viewer
  const oldLines = oldContent?.split('\n') || [];
  const newLines = newContent.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  const lines = [];
  for (let i = 0; i < Math.min(maxLines, height); i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === newLine) {
      // Unchanged line
      lines.push(
        <Box key={i}>
          <Text dimColor>
            {String(i + 1).padStart(4)} │ {oldLine || ''}
          </Text>
        </Box>,
      );
    } else if (!oldLine) {
      // Added line
      lines.push(
        <Box key={i}>
          <Text color="green">
            {String(i + 1).padStart(4)} + {newLine}
          </Text>
        </Box>,
      );
    } else if (!newLine) {
      // Removed line
      lines.push(
        <Box key={i}>
          <Text color="red">
            {String(i + 1).padStart(4)} - {oldLine}
          </Text>
        </Box>,
      );
    } else {
      // Changed line - show both
      lines.push(
        <Box key={`${i}-old`}>
          <Text color="red">
            {String(i + 1).padStart(4)} - {oldLine}
          </Text>
        </Box>,
      );
      lines.push(
        <Box key={`${i}-new`}>
          <Text color="green">
            {String(i + 1).padStart(4)} + {newLine}
          </Text>
        </Box>,
      );
    }
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Diff: {filePath}
        </Text>
      </Box>
      <Box flexDirection="column">{lines}</Box>
      {maxLines > height && (
        <Box marginTop={1}>
          <Text dimColor>... ({maxLines - height} more lines)</Text>
        </Box>
      )}
    </Box>
  );
}
