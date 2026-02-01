import { execSync, spawn } from 'child_process';

/**
 * Check if we're in a git repository
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current branch name
 */
export function getCurrentBranch(cwd: string = process.cwd()): string | null {
  try {
    return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get the repository root directory
 */
export function getRepoRoot(cwd: string = process.cwd()): string | null {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get git status
 */
export function getStatus(cwd: string = process.cwd()): string {
  try {
    return execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
  } catch {
    return '';
  }
}

/**
 * Check if there are uncommitted changes
 */
export function hasUncommittedChanges(cwd: string = process.cwd()): boolean {
  return getStatus(cwd).trim().length > 0;
}

/**
 * Get recent commits
 */
export function getRecentCommits(count: number = 5, cwd: string = process.cwd()): string[] {
  try {
    const output = execSync(`git log -${count} --oneline`, { cwd, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get the remote URL
 */
export function getRemoteUrl(
  remote: string = 'origin',
  cwd: string = process.cwd()
): string | null {
  try {
    return execSync(`git remote get-url ${remote}`, { cwd, encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}
