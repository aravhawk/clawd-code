import * as path from 'path';
import * as os from 'os';

const HOME = os.homedir();

export function getDataDir(): string {
  return process.env.CLAWD_DATA_DIR || path.join(HOME, '.clawd');
}

export function getTranscriptDir(): string {
  return path.join(getDataDir(), 'transcripts');
}

export function getConfigPath(scope: 'user' | 'project' | 'local' = 'user'): string {
  switch (scope) {
    case 'user':
      return path.join(getDataDir(), 'settings.json');
    case 'project':
      return path.join(process.cwd(), '.clawd', 'settings.json');
    case 'local':
      return path.join(process.cwd(), '.clawd', 'settings.local.json');
  }
}

export function getSessionDir(): string {
  return path.join(getDataDir(), 'sessions');
}

export function getCacheDir(): string {
  return path.join(getDataDir(), 'cache');
}

export function getLogsDir(): string {
  return path.join(getDataDir(), 'logs');
}

export function getMCPConfigPath(): string {
  return path.join(getDataDir(), 'mcp.json');
}

export interface StoragePaths {
  dataDir: string;
  transcriptDir: string;
  sessionDir: string;
  cacheDir: string;
  logsDir: string;
  userConfigDir: string;
  projectConfigDir: string;
}

export function getStoragePaths(): StoragePaths {
  return {
    dataDir: getDataDir(),
    transcriptDir: getTranscriptDir(),
    sessionDir: getSessionDir(),
    cacheDir: getCacheDir(),
    logsDir: getLogsDir(),
    userConfigDir: getDataDir(),
    projectConfigDir: process.cwd(),
  };
}
