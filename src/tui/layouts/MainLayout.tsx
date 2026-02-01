import React, { PropsWithChildren } from 'react';
import { Box, useStdout } from 'ink';

export interface MainLayoutProps extends PropsWithChildren {
  showStatusBar?: boolean;
}

/**
 * Primary full-screen layout for the application.
 */
export function MainLayout({ children, showStatusBar = true }: MainLayoutProps) {
  const { stdout } = useStdout();
  const height = stdout?.rows || 24;

  return (
    <Box flexDirection="column" height={height} width="100%">
      {children}
    </Box>
  );
}

export default MainLayout;
