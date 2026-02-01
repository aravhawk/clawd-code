/**
 * Security checks for tool inputs.
 */

import * as path from 'path';

export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Perform security checks on tool input.
 */
export function checkSecurity(
  toolName: string,
  input: Record<string, unknown>,
  cwd: string
): SecurityCheckResult {
  // Tool-specific security checks
  switch (toolName) {
    case 'Bash':
      return checkBashSecurity(input, cwd);
    case 'Read':
    case 'Write':
    case 'Edit':
      return checkFilePathSecurity(input, cwd);
    case 'WebFetch':
      return checkUrlSecurity(input);
    default:
      return { allowed: true };
  }
}

/**
 * Security checks for Bash commands.
 */
function checkBashSecurity(input: Record<string, unknown>, cwd: string): SecurityCheckResult {
  const command = String(input.command || '');

  // Block dangerous commands
  const dangerousPatterns = [
    /rm\s+(-rf?|--recursive)\s+[\/~]/i, // rm -rf /
    /mkfs\./i, // Filesystem formatting
    /dd\s+.+of=\/dev/i, // Writing to block devices
    /:(){ :\|:& };:/i, // Fork bomb
    />\s*\/dev\/sd[a-z]/i, // Writing to block devices
    /chmod\s+777\s+\//i, // Dangerous permissions on root
    /curl.*\|\s*(bash|sh)/i, // Piping curl to shell
    /wget.*\|\s*(bash|sh)/i, // Piping wget to shell
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        allowed: false,
        reason: 'Command contains potentially dangerous operations',
      };
    }
  }

  // Check workdir if specified
  const workdir = input.workdir as string | undefined;
  if (workdir) {
    const pathCheck = isPathAllowed(workdir, cwd);
    if (!pathCheck.allowed) {
      return pathCheck;
    }
  }

  return { allowed: true };
}

/**
 * Security checks for file path operations.
 */
function checkFilePathSecurity(input: Record<string, unknown>, cwd: string): SecurityCheckResult {
  const filePath = String(input.filePath || '');
  return isPathAllowed(filePath, cwd);
}

/**
 * Check if a path is allowed.
 */
function isPathAllowed(filePath: string, cwd: string): SecurityCheckResult {
  // Must be absolute path
  if (!path.isAbsolute(filePath)) {
    return {
      allowed: false,
      reason: 'Path must be absolute',
    };
  }

  // Resolve path to handle .. etc
  const resolvedPath = path.resolve(filePath);

  // Block access to sensitive directories
  const blockedPaths = ['/etc/passwd', '/etc/shadow', '/etc/sudoers', '/root', '/.ssh'];

  for (const blocked of blockedPaths) {
    if (resolvedPath === blocked || resolvedPath.startsWith(blocked + '/')) {
      return {
        allowed: false,
        reason: `Access to ${blocked} is not allowed`,
      };
    }
  }

  // Allow paths under home directory or cwd
  const home = process.env.HOME || '/tmp';
  const isUnderHome = resolvedPath.startsWith(home);
  const isUnderCwd = resolvedPath.startsWith(cwd);

  if (!isUnderHome && !isUnderCwd) {
    return {
      allowed: false,
      reason: 'Path must be under home directory or current working directory',
    };
  }

  return { allowed: true };
}

/**
 * Security checks for URLs.
 */
function checkUrlSecurity(input: Record<string, unknown>): SecurityCheckResult {
  const url = String(input.url || '');

  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        allowed: false,
        reason: 'Only HTTP and HTTPS URLs are allowed',
      };
    }

    // Block local network addresses
    const hostname = parsed.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'metadata.google.internal',
      '169.254.169.254', // AWS/GCP metadata
    ];

    if (blockedHosts.includes(hostname)) {
      return {
        allowed: false,
        reason: 'Access to local network addresses is not allowed',
      };
    }

    // Block private IP ranges
    if (isPrivateIP(hostname)) {
      return {
        allowed: false,
        reason: 'Access to private IP addresses is not allowed',
      };
    }

    return { allowed: true };
  } catch {
    return {
      allowed: false,
      reason: 'Invalid URL',
    };
  }
}

/**
 * Check if a hostname is a private IP.
 */
function isPrivateIP(hostname: string): boolean {
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4Match) return false;

  const [, a, b] = ipv4Match.map(Number);

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;

  return false;
}

export default checkSecurity;
