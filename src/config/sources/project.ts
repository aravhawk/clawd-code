/**
 * Project-level configuration source (.clawd/settings.json).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ClawdConfig } from '../types';

/**
 * Load project configuration.
 */
export async function loadProjectConfig(cwd?: string): Promise<Partial<ClawdConfig>> {
  const projectDir = cwd || process.cwd();
  const configPath = path.join(projectDir, '.clawd', 'settings.json');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Partial<ClawdConfig>;
  } catch {
    return {};
  }
}

/**
 * Save project configuration.
 */
export async function saveProjectConfig(config: Partial<ClawdConfig>, cwd?: string): Promise<void> {
  const projectDir = cwd || process.cwd();
  const configPath = path.join(projectDir, '.clawd', 'settings.json');

  // Ensure directory exists
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get the project config path.
 */
export function getProjectConfigPath(cwd?: string): string {
  const projectDir = cwd || process.cwd();
  return path.join(projectDir, '.clawd', 'settings.json');
}

/**
 * Check if a project config exists.
 */
export async function hasProjectConfig(cwd?: string): Promise<boolean> {
  try {
    await fs.access(getProjectConfigPath(cwd));
    return true;
  } catch {
    return false;
  }
}

export default loadProjectConfig;
