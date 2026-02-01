import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface ModelPickerProps {
  currentModel: string;
  onSelect: (model: string) => void;
  onClose: () => void;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  contextWindow: string;
  speed: string;
  color: string;
}

const models: ModelOption[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Latest Sonnet - Best balance of speed and quality',
    contextWindow: '200k',
    speed: 'Fast',
    color: 'cyan',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Excellent coding and reasoning',
    contextWindow: '200k',
    speed: 'Fast',
    color: 'cyan',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fastest model, great for simple tasks',
    contextWindow: '200k',
    speed: 'Very Fast',
    color: 'green',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    description: 'Most capable, best for complex tasks',
    contextWindow: '200k',
    speed: 'Slower',
    color: 'magenta',
  },
];

/**
 * Model selection modal.
 */
export function ModelPicker({ currentModel, onSelect, onClose }: ModelPickerProps) {
  const currentIndex = models.findIndex((m) => m.id === currentModel);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, currentIndex));

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return) {
      onSelect(models[selectedIndex].id);
      onClose();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(models.length - 1, i + 1));
      return;
    }

    // Number keys for quick selection
    const num = parseInt(input, 10);
    if (num >= 1 && num <= models.length) {
      onSelect(models[num - 1].id);
      onClose();
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1} width={70}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Select Model
        </Text>
      </Box>

      {/* Model list */}
      <Box flexDirection="column">
        {models.map((model, i) => (
          <Box key={model.id} flexDirection="column" marginBottom={1}>
            <Box>
              <Text
                color={i === selectedIndex ? model.color : undefined}
                inverse={i === selectedIndex}
                bold={i === selectedIndex}
              >
                {' '}
                [{i + 1}] {model.name}
                {model.id === currentModel && <Text dimColor> (current)</Text>}
              </Text>
            </Box>
            {i === selectedIndex && (
              <Box marginLeft={4} flexDirection="column">
                <Text dimColor>{model.description}</Text>
                <Box>
                  <Text dimColor>Context: </Text>
                  <Text>{model.contextWindow}</Text>
                  <Text dimColor> | Speed: </Text>
                  <Text
                    color={
                      model.speed === 'Very Fast'
                        ? 'green'
                        : model.speed === 'Slower'
                          ? 'yellow'
                          : 'white'
                    }
                  >
                    {model.speed}
                  </Text>
                </Box>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1} borderTop borderColor="gray">
        <Text dimColor>
          \u2191\u2193 or 1-{models.length} to select | Enter confirm | Esc cancel
        </Text>
      </Box>
    </Box>
  );
}

export default ModelPicker;
