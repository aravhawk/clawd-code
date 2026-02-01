/**
 * Configuration merging logic.
 */

import type { ClawdConfig } from './types';
import { defaultConfig } from './defaults';

/**
 * Deep merge configuration objects.
 */
export function mergeConfig(
  base: Partial<ClawdConfig>,
  override: Partial<ClawdConfig>
): ClawdConfig {
  const result = { ...defaultConfig };

  // Merge base first
  deepMerge(result, base);

  // Then override
  deepMerge(result, override);

  return result;
}

/**
 * Deep merge two objects.
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): void {
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined) continue;

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
    } else {
      target[key] = sourceValue as T[keyof T];
    }
  }
}

/**
 * Check if a value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Merge multiple config sources in priority order.
 */
export function mergeConfigSources(sources: Array<Partial<ClawdConfig>>): ClawdConfig {
  return sources.reduce((merged, source) => mergeConfig(merged, source), { ...defaultConfig });
}

/**
 * Extract a subset of config keys.
 */
export function pickConfig<K extends keyof ClawdConfig>(
  config: ClawdConfig,
  keys: K[]
): Pick<ClawdConfig, K> {
  const result = {} as Pick<ClawdConfig, K>;
  for (const key of keys) {
    result[key] = config[key];
  }
  return result;
}

export default mergeConfig;
