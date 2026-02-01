import type { Theme } from './types';

/**
 * Default theme for Clawd Code.
 */
export const defaultTheme: Theme = {
  name: 'default',

  colors: {
    // Primary colors
    primary: 'cyan',
    secondary: 'blue',
    accent: 'magenta',

    // Semantic colors
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'cyan',

    // Text colors
    text: 'white',
    textMuted: 'gray',
    textInverse: 'black',

    // Border colors
    border: 'gray',
    borderFocus: 'cyan',

    // Role colors
    user: 'blue',
    assistant: 'magenta',
    system: 'gray',
    tool: 'cyan',
  },

  spacing: {
    none: 0,
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },

  borders: {
    default: 'single',
    focus: 'round',
    modal: 'round',
  },

  icons: {
    spinner: 'dots',
    success: '\u2713',
    error: '\u2717',
    warning: '\u26A0',
    info: '\u2139',
    user: '\u276F',
    assistant: '\u2022',
    tool: '\u2699',
    folder: '\uD83D\uDCC1',
    file: '\uD83D\uDCC4',
  },
};

export default defaultTheme;
