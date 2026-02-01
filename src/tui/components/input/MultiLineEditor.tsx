import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MultiLineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
  maxHeight?: number;
}

/**
 * Multi-line text editor for longer inputs.
 * Ctrl+Enter to submit, Escape to cancel.
 */
export function MultiLineEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder = 'Enter multi-line text...',
  maxHeight = 10,
}: MultiLineEditorProps) {
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);

  const lines = value.split('\n');
  const displayLines = lines.slice(0, maxHeight);
  const hasMore = lines.length > maxHeight;

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    // Ctrl+Enter to submit
    if (key.return && key.ctrl) {
      onSubmit(value);
      return;
    }

    // Regular enter for new line
    if (key.return) {
      const before = lines.slice(0, cursorRow).join('\n');
      const currentLine = lines[cursorRow] || '';
      const lineStart = currentLine.slice(0, cursorCol);
      const lineEnd = currentLine.slice(cursorCol);
      const after = lines.slice(cursorRow + 1).join('\n');

      const newValue = [before, lineStart, lineEnd, after]
        .filter((_, i) => i !== 0 || before)
        .join('\n');

      onChange(newValue);
      setCursorRow(cursorRow + 1);
      setCursorCol(0);
      return;
    }

    // Navigation
    if (key.upArrow) {
      setCursorRow(Math.max(0, cursorRow - 1));
      return;
    }
    if (key.downArrow) {
      setCursorRow(Math.min(lines.length - 1, cursorRow + 1));
      return;
    }
    if (key.leftArrow) {
      if (cursorCol > 0) {
        setCursorCol(cursorCol - 1);
      } else if (cursorRow > 0) {
        setCursorRow(cursorRow - 1);
        setCursorCol(lines[cursorRow - 1]?.length || 0);
      }
      return;
    }
    if (key.rightArrow) {
      const currentLineLength = lines[cursorRow]?.length || 0;
      if (cursorCol < currentLineLength) {
        setCursorCol(cursorCol + 1);
      } else if (cursorRow < lines.length - 1) {
        setCursorRow(cursorRow + 1);
        setCursorCol(0);
      }
      return;
    }

    // Backspace
    if (key.backspace || key.delete) {
      if (cursorCol > 0) {
        const currentLine = lines[cursorRow];
        const newLine = currentLine.slice(0, cursorCol - 1) + currentLine.slice(cursorCol);
        lines[cursorRow] = newLine;
        onChange(lines.join('\n'));
        setCursorCol(cursorCol - 1);
      } else if (cursorRow > 0) {
        const prevLine = lines[cursorRow - 1];
        const currentLine = lines[cursorRow];
        lines[cursorRow - 1] = prevLine + currentLine;
        lines.splice(cursorRow, 1);
        onChange(lines.join('\n'));
        setCursorRow(cursorRow - 1);
        setCursorCol(prevLine.length);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const currentLine = lines[cursorRow] || '';
      const newLine = currentLine.slice(0, cursorCol) + input + currentLine.slice(cursorCol);
      lines[cursorRow] = newLine;
      onChange(lines.join('\n'));
      setCursorCol(cursorCol + input.length);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text dimColor>Multi-line editor | Ctrl+Enter to submit | Esc to cancel</Text>
      </Box>

      {/* Editor content */}
      <Box flexDirection="column">
        {displayLines.length === 0 || (displayLines.length === 1 && displayLines[0] === '') ? (
          <Text dimColor>{placeholder}</Text>
        ) : (
          displayLines.map((line, i) => (
            <Box key={i}>
              <Text dimColor>{String(i + 1).padStart(3)} </Text>
              <Text>
                {i === cursorRow ? (
                  <>
                    {line.slice(0, cursorCol)}
                    <Text inverse>{line[cursorCol] || ' '}</Text>
                    {line.slice(cursorCol + 1)}
                  </>
                ) : (
                  line || ' '
                )}
              </Text>
            </Box>
          ))
        )}
      </Box>

      {/* Scroll indicator */}
      {hasMore && (
        <Box marginTop={1}>
          <Text dimColor>... {lines.length - maxHeight} more lines</Text>
        </Box>
      )}
    </Box>
  );
}

export default MultiLineEditor;
