import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

export type SpinnerType = 'dots' | 'line' | 'arrow' | 'pulse' | 'bounce';

export interface SpinnerProps {
  /** Spinner animation style */
  type?: SpinnerType;
  /** Spinner color */
  color?: string;
  /** Label to show next to spinner */
  label?: string;
  /** Animation speed in ms */
  interval?: number;
}

const spinnerFrames: Record<SpinnerType, string[]> = {
  dots: [
    '\u280B',
    '\u2819',
    '\u2839',
    '\u2838',
    '\u283C',
    '\u2834',
    '\u2826',
    '\u2827',
    '\u2807',
    '\u280F',
  ],
  line: ['-', '\\', '|', '/'],
  arrow: ['\u2190', '\u2196', '\u2191', '\u2197', '\u2192', '\u2198', '\u2193', '\u2199'],
  pulse: ['\u2022', '\u25E6', '\u2022', '\u25E6'],
  bounce: ['\u2801', '\u2802', '\u2804', '\u2840', '\u2880', '\u2820', '\u2810', '\u2808'],
};

/**
 * Animated loading spinner with multiple styles.
 */
export function Spinner({ type = 'dots', color = 'cyan', label, interval = 80 }: SpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = spinnerFrames[type];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => clearInterval(timer);
  }, [frames.length, interval]);

  return (
    <Text>
      <Text color={color}>{frames[frameIndex]}</Text>
      {label && <Text> {label}</Text>}
    </Text>
  );
}

/**
 * Spinner with common presets
 */
export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return <Spinner type="dots" label={label} color="cyan" />;
}

export function ProcessingSpinner({ label = 'Processing...' }: { label?: string }) {
  return <Spinner type="dots" label={label} color="yellow" />;
}

export function ThinkingSpinner({ label = 'Thinking...' }: { label?: string }) {
  return <Spinner type="pulse" label={label} color="magenta" />;
}

export default Spinner;
