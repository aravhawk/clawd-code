import React, { PropsWithChildren } from 'react';
import { Box as InkBox, BoxProps as InkBoxProps } from 'ink';

export interface BoxProps extends PropsWithChildren<InkBoxProps> {
  /** Add a subtle glow effect via border */
  glow?: boolean;
  /** Preset padding sizes */
  pad?: 'none' | 'sm' | 'md' | 'lg';
  /** Center content both horizontally and vertically */
  center?: boolean;
}

const paddingMap = {
  none: 0,
  sm: 1,
  md: 2,
  lg: 3,
};

/**
 * Extended Box component with convenience props.
 * Wraps Ink's Box with additional styling utilities.
 */
export function Box({ glow, pad = 'none', center, children, ...props }: BoxProps) {
  const paddingValue = paddingMap[pad];

  return (
    <InkBox
      padding={paddingValue}
      justifyContent={center ? 'center' : props.justifyContent}
      alignItems={center ? 'center' : props.alignItems}
      borderStyle={glow ? 'round' : props.borderStyle}
      borderColor={glow ? 'cyan' : props.borderColor}
      {...props}
    >
      {children}
    </InkBox>
  );
}

export default Box;
