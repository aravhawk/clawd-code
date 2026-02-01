/**
 * Secure credential storage using system keychain
 * Falls back to encrypted file storage when keychain is unavailable
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getDataDir } from './paths.js';

const SERVICE_NAME = 'clawd-code';
const CREDENTIALS_FILE = 'credentials.enc';

export interface KeychainEntry {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeychainOptions {
  service?: string;
  fallbackPath?: string;
}

export class Keychain {
  private service: string;
  private fallbackPath: string;
  private encryptionKey: Buffer | null = null;

  constructor(options: KeychainOptions = {}) {
    this.service = options.service ?? SERVICE_NAME;
    this.fallbackPath = options.fallbackPath ?? path.join(getDataDir(), CREDENTIALS_FILE);
  }

  /**
   * Store a credential securely
   */
  async set(key: string, value: string): Promise<void> {
    // Try system keychain first
    const stored = await this.trySystemKeychain('set', key, value);
    if (stored) return;

    // Fall back to encrypted file storage
    await this.setEncrypted(key, value);
  }

  /**
   * Retrieve a credential
   */
  async get(key: string): Promise<string | null> {
    // Try system keychain first
    const value = await this.trySystemKeychain('get', key);
    if (typeof value === 'string') return value;

    // Fall back to encrypted file storage
    return this.getEncrypted(key);
  }

  /**
   * Delete a credential
   */
  async delete(key: string): Promise<boolean> {
    // Try system keychain first
    const deleted = await this.trySystemKeychain('delete', key);
    if (deleted) return true;

    // Fall back to encrypted file storage
    return this.deleteEncrypted(key);
  }

  /**
   * List all stored credential keys
   */
  async list(): Promise<string[]> {
    const entries = await this.getAllEncrypted();
    return entries.map((e) => e.key);
  }

  /**
   * Check if a credential exists
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Clear all stored credentials
   */
  async clear(): Promise<void> {
    if (fs.existsSync(this.fallbackPath)) {
      fs.unlinkSync(this.fallbackPath);
    }
  }

  /**
   * Attempt to use system keychain (macOS Keychain, Windows Credential Manager, etc.)
   */
  private async trySystemKeychain(
    operation: 'set' | 'get' | 'delete',
    key: string,
    value?: string
  ): Promise<string | boolean | null> {
    // Platform-specific keychain access
    // In production, would use keytar or similar library
    // For now, return null to use fallback
    return null;
  }

  /**
   * Get or derive the encryption key
   */
  private getEncryptionKey(): Buffer {
    if (this.encryptionKey) return this.encryptionKey;

    // Derive key from machine-specific data
    const machineId = this.getMachineId();
    this.encryptionKey = crypto.scryptSync(machineId, this.service, 32);
    return this.encryptionKey;
  }

  /**
   * Get a machine-specific identifier
   */
  private getMachineId(): string {
    // Use environment variables and paths for a semi-stable machine ID
    const parts = [
      process.env.HOME || process.env.USERPROFILE || '',
      process.env.USER || process.env.USERNAME || '',
      process.platform,
      process.arch,
    ];
    return parts.join(':');
  }

  /**
   * Encrypt and store a value
   */
  private async setEncrypted(key: string, value: string): Promise<void> {
    const entries = await this.getAllEncrypted();
    const now = new Date().toISOString();

    const existingIndex = entries.findIndex((e) => e.key === key);
    if (existingIndex >= 0) {
      entries[existingIndex].value = value;
      entries[existingIndex].updatedAt = now;
    } else {
      entries.push({
        key,
        value,
        createdAt: now,
        updatedAt: now,
      });
    }

    await this.saveEncrypted(entries);
  }

  /**
   * Get an encrypted value
   */
  private async getEncrypted(key: string): Promise<string | null> {
    const entries = await this.getAllEncrypted();
    const entry = entries.find((e) => e.key === key);
    return entry?.value ?? null;
  }

  /**
   * Delete an encrypted value
   */
  private async deleteEncrypted(key: string): Promise<boolean> {
    const entries = await this.getAllEncrypted();
    const filtered = entries.filter((e) => e.key !== key);

    if (filtered.length === entries.length) {
      return false;
    }

    await this.saveEncrypted(filtered);
    return true;
  }

  /**
   * Load all encrypted entries
   */
  private async getAllEncrypted(): Promise<KeychainEntry[]> {
    if (!fs.existsSync(this.fallbackPath)) {
      return [];
    }

    try {
      const encrypted = fs.readFileSync(this.fallbackPath);
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return [];
    }
  }

  /**
   * Save all encrypted entries
   */
  private async saveEncrypted(entries: KeychainEntry[]): Promise<void> {
    const dir = path.dirname(this.fallbackPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const json = JSON.stringify(entries);
    const encrypted = this.encrypt(json);
    fs.writeFileSync(this.fallbackPath, encrypted);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encrypt(plaintext: string): Buffer {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Format: iv (16 bytes) + authTag (16 bytes) + encrypted data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decrypt(data: Buffer): string {
    const key = this.getEncryptionKey();
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const encrypted = data.subarray(32);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }
}

// Singleton instance
let keychainInstance: Keychain | null = null;

export function getKeychain(options?: KeychainOptions): Keychain {
  if (!keychainInstance) {
    keychainInstance = new Keychain(options);
  }
  return keychainInstance;
}

// Convenience functions for API key management
export async function getApiKey(provider: string): Promise<string | null> {
  const keychain = getKeychain();
  return keychain.get(`api_key:${provider}`);
}

export async function setApiKey(provider: string, key: string): Promise<void> {
  const keychain = getKeychain();
  await keychain.set(`api_key:${provider}`, key);
}

export async function deleteApiKey(provider: string): Promise<boolean> {
  const keychain = getKeychain();
  return keychain.delete(`api_key:${provider}`);
}
