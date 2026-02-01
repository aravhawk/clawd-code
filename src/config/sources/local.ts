/**
 * Local configuration source (.clawd/settings.local.json).
 * This file should be gitignored and contains machine-specific settings.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ClawdConfig } from '../types';

/**
 * Load local configuration.
 */
export async function loadLocalConfig(cwd?: string): Promise<Partial<ClawdConfig>> {
  const projectDir = cwd || process.cwd();
  const configPath = path.join(projectDir, '.clawd', 'settings.local.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Partial<ClawdConfig>;
  } catch {
    return {};
  }
}

/**
 * Save local configuration.
 */
export async function saveLocalConfig(config: Partial<ClawdConfig>, cwd?: string): Promise<void> {
  const projectDir = cwd || process.cwd();
  const configPath = path.join(projectDir, '.clawd', 'settings.local.json');

  // Ensure directory exists
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get the local config path.
 */
export function getLocalConfigPath(cwd?: string): string {
  const projectDir = cwd || process.cwd();
  return path.join(projectDir, '.clawd', 'settings.local.json');
}

export default loadLocalConfig;
