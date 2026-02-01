/**
 * File system operations for storage layer
 * Provides safe, atomic file operations with proper error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface ReadOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

export interface WriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
  flag?: string;
  atomic?: boolean;
}

export interface CopyOptions {
  overwrite?: boolean;
  preserveTimestamps?: boolean;
}

/**
 * Read a file with proper error handling
 */
export async function readFile(filePath: string, options?: ReadOptions): Promise<string> {
  const encoding = options?.encoding ?? 'utf-8';
  try {
    return fs.readFileSync(filePath, { encoding, flag: options?.flag });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Read a file as Buffer
 */
export async function readFileBuffer(filePath: string): Promise<Buffer> {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Write a file atomically (write to temp, then rename)
 */
export async function writeFile(
  filePath: string,
  content: string | Buffer,
  options?: WriteOptions
): Promise<void> {
  const dir = path.dirname(filePath);
  ensureDir(dir);

  if (options?.atomic !== false) {
    // Atomic write: write to temp file, then rename
    const tempPath = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;

    try {
      fs.writeFileSync(tempPath, content, {
        encoding: options?.encoding,
        mode: options?.mode ?? 0o644,
        flag: options?.flag,
      });
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      // Clean up temp file on error
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  } else {
    fs.writeFileSync(filePath, content, {
      encoding: options?.encoding,
      mode: options?.mode ?? 0o644,
      flag: options?.flag,
    });
  }
}

/**
 * Append to a file
 */
export async function appendFile(
  filePath: string,
  content: string | Buffer,
  options?: WriteOptions
): Promise<void> {
  const dir = path.dirname(filePath);
  ensureDir(dir);

  fs.appendFileSync(filePath, content, {
    encoding: options?.encoding,
    mode: options?.mode ?? 0o644,
  });
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a path is a directory
 */
export function isDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
export function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Get file information
 */
export function getFileInfo(filePath: string): FileInfo {
  const stats = fs.statSync(filePath);
  const lstat = fs.lstatSync(filePath);

  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    isSymlink: lstat.isSymbolicLink(),
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    accessedAt: stats.atime,
  };
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Remove a file or directory
 */
export async function remove(targetPath: string): Promise<void> {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  const stats = fs.statSync(targetPath);

  if (stats.isDirectory()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(targetPath);
  }
}

/**
 * Copy a file or directory
 */
export async function copy(src: string, dest: string, options?: CopyOptions): Promise<void> {
  const srcStats = fs.statSync(src);

  if (srcStats.isDirectory()) {
    await copyDir(src, dest, options);
  } else {
    await copyFile(src, dest, options);
  }
}

/**
 * Copy a single file
 */
async function copyFile(src: string, dest: string, options?: CopyOptions): Promise<void> {
  const destDir = path.dirname(dest);
  ensureDir(destDir);

  if (!options?.overwrite && fileExists(dest)) {
    throw new Error(`Destination already exists: ${dest}`);
  }

  fs.copyFileSync(src, dest);

  if (options?.preserveTimestamps) {
    const stats = fs.statSync(src);
    fs.utimesSync(dest, stats.atime, stats.mtime);
  }
}

/**
 * Copy a directory recursively
 */
async function copyDir(src: string, dest: string, options?: CopyOptions): Promise<void> {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, options);
    } else {
      await copyFile(srcPath, destPath, options);
    }
  }
}

/**
 * Move a file or directory
 */
export async function move(src: string, dest: string): Promise<void> {
  const destDir = path.dirname(dest);
  ensureDir(destDir);

  try {
    // Try rename first (faster, works on same filesystem)
    fs.renameSync(src, dest);
  } catch (error) {
    // If rename fails (cross-device), copy then delete
    if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
      await copy(src, dest, { overwrite: true, preserveTimestamps: true });
      await remove(src);
    } else {
      throw error;
    }
  }
}

/**
 * List directory contents
 */
export function listDir(dirPath: string, recursive = false): string[] {
  if (!isDirectory(dirPath)) {
    throw new Error(`Not a directory: ${dirPath}`);
  }

  if (recursive) {
    return listDirRecursive(dirPath);
  }

  return fs.readdirSync(dirPath).map((name) => path.join(dirPath, name));
}

/**
 * List directory contents recursively
 */
function listDirRecursive(dirPath: string, basePath = dirPath): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    results.push(fullPath);

    if (entry.isDirectory()) {
      results.push(...listDirRecursive(fullPath, basePath));
    }
  }

  return results;
}

/**
 * Create a temporary file
 */
export function createTempFile(prefix = 'clawd-', suffix = ''): string {
  const tempDir = os.tmpdir();
  const randomId = crypto.randomBytes(8).toString('hex');
  return path.join(tempDir, `${prefix}${randomId}${suffix}`);
}

/**
 * Create a temporary directory
 */
export function createTempDir(prefix = 'clawd-'): string {
  const tempDir = os.tmpdir();
  const randomId = crypto.randomBytes(8).toString('hex');
  const dirPath = path.join(tempDir, `${prefix}${randomId}`);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

/**
 * Read JSON file with type safety
 */
export async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in file: ${filePath}`);
  }
}

/**
 * Write JSON file with formatting
 */
export async function writeJson<T>(
  filePath: string,
  data: T,
  options?: { pretty?: boolean }
): Promise<void> {
  const content = options?.pretty !== false ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await writeFile(filePath, content);
}

/**
 * Watch a file for changes
 */
export function watchFile(
  filePath: string,
  callback: (event: 'change' | 'rename') => void
): fs.FSWatcher {
  return fs.watch(filePath, (event) => {
    callback(event as 'change' | 'rename');
  });
}

/**
 * Watch a directory for changes
 */
export function watchDir(
  dirPath: string,
  callback: (event: 'change' | 'rename', filename: string | null) => void
): fs.FSWatcher {
  return fs.watch(dirPath, { recursive: true }, callback);
}

/**
 * Get file hash
 */
export async function getFileHash(
  filePath: string,
  algorithm: 'md5' | 'sha1' | 'sha256' = 'sha256'
): Promise<string> {
  const content = await readFileBuffer(filePath);
  return crypto.createHash(algorithm).update(content).digest('hex');
}
