/**
 * Hook configuration loader.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { HookConfig, HookScript } from './types';
import { getDataDir } from '../storage/paths';

/**
 * Load hook configurations from the filesystem.
 */
export async function loadHooks(cwd?: string): Promise<HookConfig[]> {
  const configs: HookConfig[] = [];
  const projectDir = cwd || process.cwd();

  // Load from project .clawd/hooks
  const projectHooksDir = path.join(projectDir, '.clawd', 'hooks');
  const projectHooks = await loadHooksFromDir(projectHooksDir);
  configs.push(...projectHooks);

  // Load from user ~/.clawd/hooks
  const userHooksDir = path.join(getDataDir(), 'hooks');
  const userHooks = await loadHooksFromDir(userHooksDir);
  configs.push(...userHooks);

  return configs;
}

/**
 * Load hooks from a directory.
 */
async function loadHooksFromDir(dir: string): Promise<HookConfig[]> {
  const configs: HookConfig[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name);
      if (!['.json', '.js', '.ts', '.sh'].includes(ext)) continue;

      const hookPath = path.join(dir, entry.name);

      try {
        if (ext === '.json') {
          const content = await fs.readFile(hookPath, 'utf-8');
          const config = JSON.parse(content) as HookConfig;
          configs.push(config);
        } else {
          // Infer hook type from filename
          const hookName = entry.name.replace(ext, '');
          const hookType = inferHookType(hookName);

          if (hookType) {
            configs.push({
              type: hookType,
              script: hookPath,
              enabled: true,
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to load hook ${hookPath}: ${(error as Error).message}`);
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return configs;
}

/**
 * Infer hook type from filename.
 */
function inferHookType(name: string): HookConfig['type'] | null {
  const typeMap: Record<string, HookConfig['type']> = {
    'session-start': 'SessionStart',
    'session-end': 'SessionEnd',
    'pre-tool': 'PreToolUse',
    'post-tool': 'PostToolUse',
    permission: 'PermissionRequest',
    prompt: 'UserPromptSubmit',
    stop: 'Stop',
  };

  for (const [pattern, type] of Object.entries(typeMap)) {
    if (name.toLowerCase().includes(pattern)) {
      return type;
    }
  }

  return null;
}

/**
 * Load a hook script.
 */
export async function loadHookScript(scriptPath: string): Promise<HookScript | null> {
  try {
    const content = await fs.readFile(scriptPath, 'utf-8');
    const ext = path.extname(scriptPath);

    if (ext === '.sh') {
      return {
        type: 'shell',
        content,
        path: scriptPath,
      };
    }

    if (ext === '.js' || ext === '.ts') {
      return {
        type: 'javascript',
        content,
        path: scriptPath,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default loadHooks;
