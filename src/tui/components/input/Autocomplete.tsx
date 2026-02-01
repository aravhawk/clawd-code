import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';

export interface AutocompleteItem {
  value: string;
  label?: string;
  description?: string;
  icon?: string;
}

export interface AutocompleteProps {
  items: AutocompleteItem[];
  onSelect: (item: AutocompleteItem) => void;
  onClose: () => void;
  filter?: string;
  maxItems?: number;
  position?: { x: number; y: number };
}

/**
 * Autocomplete dropdown for file paths, commands, etc.
 */
export function Autocomplete({
  items,
  onSelect,
  onClose,
  filter = '',
  maxItems = 8,
}: AutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter items based on input
  const filteredItems = useMemo(() => {
    if (!filter) return items.slice(0, maxItems);

    const lowerFilter = filter.toLowerCase();
    return items
      .filter(
        (item) =>
          item.value.toLowerCase().includes(lowerFilter) ||
          item.label?.toLowerCase().includes(lowerFilter)
      )
      .slice(0, maxItems);
  }, [items, filter, maxItems]);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.return || key.tab) {
      if (filteredItems[selectedIndex]) {
        onSelect(filteredItems[selectedIndex]);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(filteredItems.length - 1, i + 1));
      return;
    }
  });

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
      {filteredItems.map((item, i) => (
        <Box key={item.value}>
          <Text color={i === selectedIndex ? 'cyan' : undefined} inverse={i === selectedIndex}>
            {item.icon && <Text>{item.icon} </Text>}
            <Text bold={i === selectedIndex}>{item.label || item.value}</Text>
          </Text>
          {item.description && <Text dimColor> {item.description}</Text>}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Generate autocomplete items for file paths.
 */
export function generateFileItems(files: string[], basePath?: string): AutocompleteItem[] {
  return files.map((file) => {
    const isDir = file.endsWith('/');
    return {
      value: file,
      label: basePath ? file.replace(basePath, '') : file,
      icon: isDir ? '\uD83D\uDCC1' : '\uD83D\uDCC4',
    };
  });
}

export default Autocomplete;
