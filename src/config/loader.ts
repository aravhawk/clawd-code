import * as fs from 'fs/promises';
import * as path from 'path';
import type { ClawdConfig } from './types';
import { defaultConfig } from './types';
import { ClawdError, ErrorCode } from '../utils/errors';
import { Logger } from '../utils/logger';

const log = Logger.create('ConfigLoader');

function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const output = { ...target } as T;
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key as keyof T])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof T] });
        } else {
          (output[key as keyof T] as unknown) = deepMerge(
            target[key as keyof T] as Record<string, unknown>,
            source[key as keyof T] as Record<string, unknown>
          );
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof T] });
      }
    });
  }
  return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

export class ConfigLoader {
  private config: ClawdConfig;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.config = { ...defaultConfig };
  }

  async load(): Promise<ClawdConfig> {
    const sources = [
      defaultConfig,
      await this.loadUserConfig(),
      await this.loadProjectConfig(),
      await this.loadLocalConfig(),
    ];

    this.config = sources.reduce(
      (merged, source) => deepMerge(merged, source as Partial<ClawdConfig>),
      defaultConfig
    );

    return this.config;
  }

  private async loadUserConfig(): Promise<Partial<ClawdConfig>> {
    const userDir = this.getUserConfigDir();
    return this.loadJsonFile(path.join(userDir, 'settings.json'));
  }

  private async loadProjectConfig(): Promise<Partial<ClawdConfig>> {
    return this.loadJsonFile(path.join(this.projectPath, '.clawd', 'settings.json'));
  }

  private async loadLocalConfig(): Promise<Partial<ClawdConfig>> {
    return this.loadJsonFile(path.join(this.projectPath, '.clawd', 'settings.local.json'));
  }

  private async loadJsonFile(filePath: string): Promise<Partial<ClawdConfig>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content || content.trim().length === 0) {
        log.debug('Empty config file:', filePath);
        return {};
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        log.error('Failed to parse JSON config:', filePath, (parseError as Error).message);
        return {};
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        log.error('Invalid config format in:', filePath);
        return {};
      }

      log.debug('Loaded config from', filePath);
      return parsed as Partial<ClawdConfig>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        log.warn('Failed to load config from', filePath, (error as Error).message);
      }
      return {};
    }
  }

  private getUserConfigDir(): string {
    const xdgConfig = process.env['XDG_CONFIG_HOME'];
    if (xdgConfig) {
      return path.join(xdgConfig, 'clawd');
    }
    return path.join(process.env['HOME'] ?? '', '.clawd');
  }

  getApiKey(): string {
    // Priority: CLAWD_API_KEY > ANTHROPIC_API_KEY > config file
    return (
      process.env['CLAWD_API_KEY'] ??
      process.env['ANTHROPIC_API_KEY'] ??
      this.config.providers?.anthropic?.apiKey ??
      ''
    );
  }

  getBaseUrl(): string | undefined {
    // Only use CLAWD_BASE_URL if CLAWD_API_KEY is also set
    if (process.env['CLAWD_API_KEY'] && process.env['CLAWD_BASE_URL']) {
      return process.env['CLAWD_BASE_URL'];
    }
    return this.config.providers?.anthropic?.baseURL;
  }

  getModel(): string {
    return this.config.model ?? 'claude-sonnet-4-20250514';
  }

  getMaxTokens(): number {
    const maxTokens = this.config.maxTokens ?? 8192;
    // Validate max tokens is within reasonable bounds
    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 200000) {
      log.warn(`Invalid maxTokens value: ${maxTokens}, using default 8192`);
      return 8192;
    }
    return maxTokens;
  }

  getMCPServers(): Record<string, unknown> {
    return this.config.mcpServers ?? {};
  }

  getHooks(): Record<string, unknown> {
    return (
      (this.config.hooks as Record<string, unknown> | undefined) ?? ({} as Record<string, unknown>)
    );
  }

  getPermissions(): unknown {
    return this.config.permissions ?? { mode: 'default', allow: [], deny: [] };
  }

  validate(): void {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ClawdError(
        'API key not found. Set CLAWD_API_KEY or ANTHROPIC_API_KEY environment variable.',
        ErrorCode.API_KEY_MISSING
      );
    }

    if (process.env['CLAWD_BASE_URL'] && !process.env['CLAWD_MODEL']) {
      throw new ClawdError(
        'CLAWD_MODEL is required when using CLAWD_BASE_URL. Set CLAWD_MODEL environment variable to specify the model for your custom endpoint.',
        ErrorCode.CONFIG_MODEL_REQUIRED
      );
    }

    // Validate model name format
    const model = this.getModel();
    if (!model || model.trim().length === 0) {
      throw new ClawdError(
        'Model name cannot be empty',
        ErrorCode.CONFIG_MODEL_REQUIRED
      );
    }
  }
}
