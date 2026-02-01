import React from 'react';
import { Text as InkText, TextProps as InkTextProps } from 'ink';

export type TextVariant = 'default' | 'muted' | 'success' | 'warning' | 'error' | 'info' | 'code';

export interface TextProps extends Omit<InkTextProps, 'color'> {
  /** Semantic color variant */
  variant?: TextVariant;
  /** Override color directly */
  color?: string;
  /** Make text uppercase */
  uppercase?: boolean;
  /** Truncate text with ellipsis */
  truncate?: boolean;
  /** Max width for truncation */
  maxWidth?: number;
}

const variantColors: Record<TextVariant, string> = {
  default: 'white',
  muted: 'gray',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'cyan',
  code: 'magenta',
};

/**
 * Extended Text component with semantic variants and utilities.
 */
export function Text({
  variant = 'default',
  color,
  uppercase,
  truncate,
  maxWidth,
  children,
  ...props
}: TextProps) {
  const resolvedColor = color || variantColors[variant];

  let content = children;

  // Handle uppercase
  if (uppercase && typeof content === 'string') {
    content = content.toUpperCase();
  }

  // Handle truncation
  if (truncate && maxWidth && typeof content === 'string') {
    if (content.length > maxWidth) {
      content = content.slice(0, maxWidth - 1) + '\u2026'; // ellipsis
    }
  }

  return (
    <InkText color={resolvedColor} {...props}>
      {content}
    </InkText>
  );
}

/** Helper components for common variants */
export function MutedText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="muted" {...props} />;
}

export function SuccessText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="success" {...props} />;
}

export function ErrorText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="error" {...props} />;
}

export function WarningText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="warning" {...props} />;
}

export function InfoText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="info" {...props} />;
}

export function CodeText(props: Omit<TextProps, 'variant'>) {
  return <Text variant="code" {...props} />;
}

export default Text;
