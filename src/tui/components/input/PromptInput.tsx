import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

export interface PromptInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onSlashCommand?: () => void;
  prefix?: string;
}

/**
 * Main prompt input component for user messages.
 */
export function PromptInput({
  onSubmit,
  disabled = false,
  placeholder = 'Message Clawd...',
  onSlashCommand,
  prefix = '\u276F',
}: PromptInputProps) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history] = useState<string[]>([]);

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);

      // Detect slash command trigger
      if (newValue === '/' && onSlashCommand) {
        onSlashCommand();
      }
    },
    [onSlashCommand]
  );

  const handleSubmit = useCallback(
    (submitValue: string) => {
      if (submitValue.trim() && !disabled) {
        onSubmit(submitValue);
        setValue('');
        setHistoryIndex(-1);
      }
    },
    [onSubmit, disabled]
  );

  // Handle up/down for history navigation
  useInput((input, key) => {
    if (disabled) return;

    if (key.upArrow && history.length > 0) {
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setValue(history[history.length - 1 - newIndex] || '');
    }

    if (key.downArrow && historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setValue(history[history.length - 1 - newIndex] || '');
    }

    if (key.downArrow && historyIndex === 0) {
      setHistoryIndex(-1);
      setValue('');
    }

    // Escape to clear
    if (key.escape) {
      setValue('');
      setHistoryIndex(-1);
    }
  });

  return (
    <Box>
      <Text color={disabled ? 'gray' : 'cyan'}>{prefix} </Text>
      {disabled ? (
        <Text dimColor>{placeholder}</Text>
      ) : (
        <TextInput
          value={value}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        />
      )}
    </Box>
  );
}

export default PromptInput;
