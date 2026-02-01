import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface SettingsModalProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onClose: () => void;
}

export interface Settings {
  model: string;
  maxTokens: number;
  autoCompact: boolean;
  verboseMode: boolean;
  permissionMode: 'default' | 'auto-accept' | 'plan';
}

interface SettingItem {
  key: keyof Settings;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[];
}

const settingItems: SettingItem[] = [
  {
    key: 'model',
    label: 'Model',
    type: 'select',
    options: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'],
  },
  { key: 'maxTokens', label: 'Max Tokens', type: 'number' },
  { key: 'autoCompact', label: 'Auto Compact', type: 'boolean' },
  { key: 'verboseMode', label: 'Verbose Mode', type: 'boolean' },
  {
    key: 'permissionMode',
    label: 'Permission Mode',
    type: 'select',
    options: ['default', 'auto-accept', 'plan'],
  },
];

/**
 * Settings editor modal.
 */
export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [editedSettings, setEditedSettings] = useState<Settings>({ ...settings });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editing, setEditing] = useState(false);

  useInput((input, key) => {
    if (key.escape) {
      if (editing) {
        setEditing(false);
      } else {
        onClose();
      }
      return;
    }

    if (key.return) {
      if (editing) {
        setEditing(false);
      } else {
        const item = settingItems[selectedIndex];
        if (item.type === 'boolean') {
          // Toggle boolean
          setEditedSettings({
            ...editedSettings,
            [item.key]: !editedSettings[item.key],
          });
        } else {
          setEditing(true);
        }
      }
      return;
    }

    if (!editing) {
      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(settingItems.length - 1, i + 1));
        return;
      }

      // Save with 's'
      if (input === 's') {
        onSave(editedSettings);
        onClose();
        return;
      }

      // Cycle through select options with left/right
      const item = settingItems[selectedIndex];
      if (item.type === 'select' && item.options) {
        const currentValue = String(editedSettings[item.key]);
        const currentIndex = item.options.indexOf(currentValue);

        if (key.leftArrow) {
          const newIndex = (currentIndex - 1 + item.options.length) % item.options.length;
          setEditedSettings({
            ...editedSettings,
            [item.key]: item.options[newIndex] as never,
          });
        }
        if (key.rightArrow) {
          const newIndex = (currentIndex + 1) % item.options.length;
          setEditedSettings({
            ...editedSettings,
            [item.key]: item.options[newIndex] as never,
          });
        }
      }
    }
  });

  const renderValue = (item: SettingItem): React.ReactNode => {
    const value = editedSettings[item.key];

    if (item.type === 'boolean') {
      return <Text color={value ? 'green' : 'red'}>{value ? 'ON' : 'OFF'}</Text>;
    }

    if (item.type === 'select') {
      return <Text color="cyan">\u25C0 {String(value)} \u25B6</Text>;
    }

    return <Text>{String(value)}</Text>;
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={60}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Settings
        </Text>
      </Box>

      {/* Settings list */}
      <Box flexDirection="column">
        {settingItems.map((item, i) => (
          <Box key={item.key}>
            <Text color={i === selectedIndex ? 'cyan' : undefined} inverse={i === selectedIndex}>
              {' '}
              <Text bold={i === selectedIndex}>{item.label.padEnd(20)}</Text>
              {renderValue(item)}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>
          \u2191\u2193 navigate | \u25C0\u25B6 change | Enter toggle | s save | Esc close
        </Text>
      </Box>
    </Box>
  );
}

export default SettingsModal;
