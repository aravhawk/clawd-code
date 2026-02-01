import React, { PropsWithChildren, ReactNode } from 'react';
import { Box, useStdout } from 'ink';

export interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: number | string;
  rightWidth?: number | string;
  gap?: number;
}

/**
 * Side-by-side split layout.
 * Useful for showing context (files, docs) alongside chat.
 */
export function SplitLayout({
  left,
  right,
  leftWidth = '50%',
  rightWidth = '50%',
  gap = 1,
}: SplitLayoutProps) {
  const { stdout } = useStdout();
  const height = stdout?.rows || 24;

  return (
    <Box flexDirection="row" height={height} width="100%">
      <Box
        flexDirection="column"
        width={leftWidth}
        borderStyle="single"
        borderColor="gray"
        marginRight={gap}
      >
        {left}
      </Box>

      <Box flexDirection="column" width={rightWidth}>
        {right}
      </Box>
    </Box>
  );
}

export default SplitLayout;
