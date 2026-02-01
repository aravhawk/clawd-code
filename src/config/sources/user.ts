/**
 * User-level configuration source (~/.clawd/settings.json).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getDataDir } from '../../storage/paths';
import type { ClawdConfig } from '../types';

/**
 * Load user configuration.
 */
export async function loadUserConfig(): Promise<Partial<ClawdConfig>> {
  const configPath = path.join(getDataDir(), 'settings.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Partial<ClawdConfig>;
  } catch {
    return {};
  }
}

/**
 * Save user configuration.
 */
export async function saveUserConfig(config: Partial<ClawdConfig>): Promise<void> {
  const configPath = path.join(getDataDir(), 'settings.json');

  // Ensure directory exists
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get the user config path.
 */
export function getUserConfigPath(): string {
  return path.join(getDataDir(), 'settings.json');
}

export default loadUserConfig;
