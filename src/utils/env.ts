/**
 * Environment variable utilities
 */

export function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

export function getAnthropicApiKey(): string | undefined {
  return getEnv('ANTHROPIC_API_KEY');
}

export function getClawdApiKey(): string | undefined {
  return getEnv('CLAWD_API_KEY');
}

export function getClawdBaseUrl(): string | undefined {
  return getEnv('CLAWD_BASE_URL');
}

export interface ApiCredentials {
  apiKey: string;
  baseUrl?: string;
}

/**
 * Returns API credentials with priority:
 * 1. CLAWD_BASE_URL + CLAWD_API_KEY → custom endpoint
 * 2. CLAWD_API_KEY alone → default Anthropic endpoint
 * 3. ANTHROPIC_API_KEY → default Anthropic endpoint
 * 4. undefined (caller should error)
 */
export function getApiCredentials(): ApiCredentials | undefined {
  const clawdKey = getClawdApiKey();
  const clawdBase = getClawdBaseUrl();
  const anthropicKey = getAnthropicApiKey();

  if (clawdKey && clawdBase) {
    return { apiKey: clawdKey, baseUrl: clawdBase };
  }
  if (clawdKey) {
    return { apiKey: clawdKey };
  }
  if (anthropicKey) {
    return { apiKey: anthropicKey };
  }
  return undefined;
}

export function isDebugMode(): boolean {
  return getEnv('CLAWD_DEBUG') === 'true' || getEnv('DEBUG') === 'true';
}

export function isVerboseMode(): boolean {
  return getEnv('CLAWD_VERBOSE') === 'true' || getEnv('VERBOSE') === 'true';
}

export function getLogLevel(): string {
  return getEnv('CLAWD_LOG_LEVEL', 'info') || 'info';
}

export function getDataDir(): string | undefined {
  return getEnv('CLAWD_DATA_DIR');
}

export function getModel(): string {
  return getEnv('CLAWD_MODEL', 'claude-sonnet-4-20250514') || 'claude-sonnet-4-20250514';
}

export function getMaxTokens(): number {
  const value = getEnv('CLAWD_MAX_TOKENS', '8192');
  return parseInt(value || '8192', 10);
}
