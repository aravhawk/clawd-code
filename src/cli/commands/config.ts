import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface ConfigOptions {
  action: 'get' | 'set' | 'list' | 'reset';
  key?: string;
  value?: string;
}

/**
 * Configuration management command
 */
export async function runConfig(options: ConfigOptions): Promise<void> {
  const configDir = path.join(os.homedir(), '.clawd');
  const configPath = path.join(configDir, 'settings.json');

  // Ensure config directory exists
  await fs.mkdir(configDir, { recursive: true });

  // Load existing config
  let config: Record<string, unknown> = {};
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch {
    // Config doesn't exist yet
  }

  switch (options.action) {
    case 'get':
      if (!options.key) {
        console.error('Error: Key is required for get');
        process.exit(1);
      }
      const value = getNestedValue(config, options.key);
      if (value === undefined) {
        console.log(`Key "${options.key}" is not set`);
      } else {
        console.log(JSON.stringify(value, null, 2));
      }
      break;

    case 'set':
      if (!options.key || options.value === undefined) {
        console.error('Error: Key and value are required for set');
        process.exit(1);
      }
      setNestedValue(config, options.key, parseValue(options.value));
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(`Set ${options.key} = ${options.value}`);
      break;

    case 'list':
      console.log(JSON.stringify(config, null, 2));
      break;

    case 'reset':
      await fs.writeFile(configPath, '{}');
      console.log('Configuration reset to defaults');
      break;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

function parseValue(value: string): unknown {
  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch {
    // Return as string if not valid JSON
    return value;
  }
}
