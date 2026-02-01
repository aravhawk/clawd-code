import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { defaultTheme, getTheme, mergeTheme } from '../themes';
import type { Theme } from '../themes/types';

/**
 * Theme context for styling.
 */
export interface ThemeContextValue {
  theme: Theme;
  themeName: string;
  setTheme: (name: string) => void;
  updateTheme: (partial: Partial<Theme>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps extends PropsWithChildren {
  initialTheme?: string;
}

/**
 * Provider component for theme context.
 */
export function ThemeProvider({ initialTheme = 'default', children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState(initialTheme);
  const [customizations, setCustomizations] = useState<Partial<Theme>>({});

  const theme = useMemo(() => {
    const baseTheme = getTheme(themeName);
    return Object.keys(customizations).length > 0
      ? mergeTheme({ ...baseTheme, ...customizations })
      : baseTheme;
  }, [themeName, customizations]);

  const setTheme = useCallback((name: string) => {
    setThemeName(name);
    setCustomizations({});
  }, []);

  const updateTheme = useCallback((partial: Partial<Theme>) => {
    setCustomizations((prev) => ({ ...prev, ...partial }));
  }, []);

  const value: ThemeContextValue = {
    theme,
    themeName,
    setTheme,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access theme context.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to access just the theme object.
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export { ThemeContext };
export default ThemeContext;
