/**
 * Theme type definitions for the TUI.
 */

export interface ThemeColors {
  // Primary colors
  primary: string;
  secondary: string;
  accent: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Text colors
  text: string;
  textMuted: string;
  textInverse: string;

  // Background-like colors (for borders)
  border: string;
  borderFocus: string;

  // Role colors
  user: string;
  assistant: string;
  system: string;
  tool: string;
}

export interface ThemeSpacing {
  none: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeBorders {
  default: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  focus: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  modal: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
}

export interface ThemeIcons {
  spinner: 'dots' | 'line' | 'arrow' | 'pulse' | 'bounce';
  success: string;
  error: string;
  warning: string;
  info: string;
  user: string;
  assistant: string;
  tool: string;
  folder: string;
  file: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  icons: ThemeIcons;
}
