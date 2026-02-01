import React, { PropsWithChildren } from 'react';
import { Box, useStdout } from 'ink';

export interface CompactLayoutProps extends PropsWithChildren {
  maxHeight?: number;
}

/**
 * Minimal layout that takes less vertical space.
 * Useful for running in smaller terminals.
 */
export function CompactLayout({ children, maxHeight }: CompactLayoutProps) {
  const { stdout } = useStdout();
  const termHeight = stdout?.rows || 24;
  const height = maxHeight ? Math.min(maxHeight, termHeight) : termHeight;

  return (
    <Box flexDirection="column" height={height} width="100%" paddingX={0} paddingY={0}>
      {children}
    </Box>
  );
}

export default CompactLayout;
