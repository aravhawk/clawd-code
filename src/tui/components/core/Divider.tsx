import React from 'react';
import { Box, Text } from 'ink';

export type DividerStyle = 'line' | 'dashed' | 'dotted' | 'double' | 'heavy';

export interface DividerProps {
  /** Visual style of the divider */
  style?: DividerStyle;
  /** Color of the divider */
  color?: string;
  /** Optional title in the center */
  title?: string;
  /** Title color */
  titleColor?: string;
  /** Width override (defaults to terminal width) */
  width?: number;
  /** Vertical margin */
  marginY?: number;
}

const dividerChars: Record<DividerStyle, string> = {
  line: '\u2500',
  dashed: '\u2504',
  dotted: '\u00B7',
  double: '\u2550',
  heavy: '\u2501',
};

/**
 * Horizontal divider component with optional title.
 */
export function Divider({
  style = 'line',
  color = 'gray',
  title,
  titleColor = 'white',
  width,
  marginY = 0,
}: DividerProps) {
  const char = dividerChars[style];
  const termWidth = width || process.stdout.columns || 80;

  if (title) {
    // Calculate padding for centered title
    const titleWithPadding = ` ${title} `;
    const sideWidth = Math.max(0, Math.floor((termWidth - titleWithPadding.length) / 2));
    const leftSide = char.repeat(sideWidth);
    const rightSide = char.repeat(termWidth - sideWidth - titleWithPadding.length);

    return (
      <Box marginTop={marginY} marginBottom={marginY}>
        <Text color={color}>{leftSide}</Text>
        <Text color={titleColor} bold>
          {titleWithPadding}
        </Text>
        <Text color={color}>{rightSide}</Text>
      </Box>
    );
  }

  return (
    <Box marginTop={marginY} marginBottom={marginY}>
      <Text color={color}>{char.repeat(termWidth)}</Text>
    </Box>
  );
}

/**
 * Shorthand dividers
 */
export function LineDivider(props: Omit<DividerProps, 'style'>) {
  return <Divider style="line" {...props} />;
}

export function DashedDivider(props: Omit<DividerProps, 'style'>) {
  return <Divider style="dashed" {...props} />;
}

export function HeavyDivider(props: Omit<DividerProps, 'style'>) {
  return <Divider style="heavy" {...props} />;
}

export default Divider;
