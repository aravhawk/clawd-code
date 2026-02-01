/**
 * Allowlist for pre-approved tools and commands.
 */

export interface AllowlistEntry {
  id: string;
  type: 'tool' | 'command' | 'path' | 'url';
  pattern: string;
  regex?: boolean;
  scope: 'session' | 'persistent';
  addedAt: number;
  expiresAt?: number;
}

/**
 * Manages the allowlist of pre-approved operations.
 */
export class Allowlist {
  private entries: Map<string, AllowlistEntry> = new Map();

  constructor(initialEntries: AllowlistEntry[] = []) {
    for (const entry of initialEntries) {
      this.entries.set(entry.id, entry);
    }
  }

  /**
   * Add an entry to the allowlist.
   */
  add(entry: Omit<AllowlistEntry, 'id' | 'addedAt'>): AllowlistEntry {
    const id = `${entry.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullEntry: AllowlistEntry = {
      ...entry,
      id,
      addedAt: Date.now(),
    };

    this.entries.set(id, fullEntry);
    return fullEntry;
  }

  /**
   * Remove an entry from the allowlist.
   */
  remove(id: string): boolean {
    return this.entries.delete(id);
  }

  /**
   * Check if a value is allowed by the allowlist.
   */
  isAllowed(type: AllowlistEntry['type'], value: string): boolean {
    const now = Date.now();

    for (const entry of this.entries.values()) {
      if (entry.type !== type) continue;

      // Check expiration
      if (entry.expiresAt && entry.expiresAt < now) {
        this.entries.delete(entry.id);
        continue;
      }

      // Match pattern
      if (this.matchesPattern(value, entry)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a value matches an entry's pattern.
   */
  private matchesPattern(value: string, entry: AllowlistEntry): boolean {
    if (entry.regex) {
      try {
        const regex = new RegExp(entry.pattern);
        return regex.test(value);
      } catch {
        return false;
      }
    }

    // Simple glob-like matching
    if (entry.pattern.includes('*')) {
      const regexPattern = entry.pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(value);
    }

    return value === entry.pattern || value.startsWith(entry.pattern);
  }

  /**
   * Get all entries of a specific type.
   */
  getByType(type: AllowlistEntry['type']): AllowlistEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.type === type);
  }

  /**
   * Get all entries.
   */
  getAll(): AllowlistEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Clear session-scoped entries.
   */
  clearSession(): void {
    for (const [id, entry] of this.entries) {
      if (entry.scope === 'session') {
        this.entries.delete(id);
      }
    }
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Export entries for persistence.
   */
  export(): AllowlistEntry[] {
    return this.getAll().filter((e) => e.scope === 'persistent');
  }

  /**
   * Import entries from persistence.
   */
  import(entries: AllowlistEntry[]): void {
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
  }
}

// Pre-defined safe patterns
export const defaultAllowlist: Omit<AllowlistEntry, 'id' | 'addedAt'>[] = [
  // Safe npm commands
  {
    type: 'command',
    pattern: 'npm install',
    scope: 'persistent',
  },
  {
    type: 'command',
    pattern: 'npm run *',
    scope: 'persistent',
  },
  {
    type: 'command',
    pattern: 'npm test',
    scope: 'persistent',
  },
  // Safe git commands
  {
    type: 'command',
    pattern: 'git status',
    scope: 'persistent',
  },
  {
    type: 'command',
    pattern: 'git diff*',
    scope: 'persistent',
  },
  {
    type: 'command',
    pattern: 'git log*',
    scope: 'persistent',
  },
];

export default Allowlist;
