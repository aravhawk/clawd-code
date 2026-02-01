import { defaultTheme } from './default';
import type { Theme, ThemeColors, ThemeSpacing, ThemeBorders, ThemeIcons } from './types';

export { defaultTheme };
export type { Theme, ThemeColors, ThemeSpacing, ThemeBorders, ThemeIcons };

/**
 * Get a theme by name, falling back to default.
 */
export function getTheme(name?: string): Theme {
  // For now, only default theme is available
  // Future themes can be added here
  switch (name) {
    case 'default':
    default:
      return defaultTheme;
  }
}

/**
 * Merge partial theme with default theme.
 */
export function mergeTheme(partial: Partial<Theme>): Theme {
  return {
    ...defaultTheme,
    ...partial,
    colors: {
      ...defaultTheme.colors,
      ...partial.colors,
    },
    spacing: {
      ...defaultTheme.spacing,
      ...partial.spacing,
    },
    borders: {
      ...defaultTheme.borders,
      ...partial.borders,
    },
    icons: {
      ...defaultTheme.icons,
      ...partial.icons,
    },
  };
}
