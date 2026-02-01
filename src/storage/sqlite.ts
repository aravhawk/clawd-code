/**
 * SQLite database storage layer
 * Provides persistent storage for sessions, messages, and metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDataDir } from './paths.js';

export interface DatabaseOptions {
  filename?: string;
  inMemory?: boolean;
  verbose?: boolean;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface Migration {
  id: number;
  name: string;
  up: string;
  down: string;
}

export class SQLiteDatabase {
  private db: unknown = null;
  private filename: string;
  private inMemory: boolean;
  private initialized = false;

  constructor(options: DatabaseOptions = {}) {
    this.inMemory = options.inMemory ?? false;
    this.filename = options.filename ?? path.join(getDataDir(), 'clawd.db');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Ensure data directory exists
    const dir = path.dirname(this.filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // In production, would use better-sqlite3 or sql.js
    // For now, we implement a JSON-based fallback
    this.db = new JSONDatabase(this.filename);
    await (this.db as JSONDatabase).initialize();

    this.initialized = true;
  }

  async close(): Promise<void> {
    if (this.db && this.initialized) {
      await (this.db as JSONDatabase).close();
      this.initialized = false;
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<QueryResult> {
    this.ensureInitialized();
    return (this.db as JSONDatabase).run(sql, params);
  }

  async get<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = []
  ): Promise<T | undefined> {
    this.ensureInitialized();
    return (this.db as JSONDatabase).get<T>(sql, params);
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.ensureInitialized();
    return (this.db as JSONDatabase).all<T>(sql, params);
  }

  async exec(sql: string): Promise<void> {
    this.ensureInitialized();
    return (this.db as JSONDatabase).exec(sql);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
  }
}

/**
 * JSON-based database fallback when SQLite is not available
 * Provides basic SQL-like operations using JSON files
 */
class JSONDatabase {
  private filename: string;
  private data: Record<string, unknown[]> = {};
  private lastInsertRowid = 0;

  constructor(filename: string) {
    this.filename = filename.replace('.db', '.json');
  }

  async initialize(): Promise<void> {
    if (fs.existsSync(this.filename)) {
      try {
        const content = fs.readFileSync(this.filename, 'utf-8');
        this.data = JSON.parse(content);
      } catch {
        this.data = {};
      }
    }
  }

  async close(): Promise<void> {
    await this.save();
  }

  async run(sql: string, params: unknown[] = []): Promise<QueryResult> {
    const result = this.executeSQL(sql, params);
    await this.save();
    return result;
  }

  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const result = this.executeSQL(sql, params);
    return result.rows[0] as T | undefined;
  }

  async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = this.executeSQL(sql, params);
    return result.rows as T[];
  }

  async exec(sql: string): Promise<void> {
    // Execute multiple statements
    const statements = sql.split(';').filter((s) => s.trim());
    for (const stmt of statements) {
      this.executeSQL(stmt, []);
    }
    await this.save();
  }

  private executeSQL(sql: string, params: unknown[]): QueryResult {
    const normalized = sql.trim().toLowerCase();

    if (normalized.startsWith('create table')) {
      return this.handleCreateTable(sql);
    }

    if (normalized.startsWith('insert')) {
      return this.handleInsert(sql, params);
    }

    if (normalized.startsWith('select')) {
      return this.handleSelect(sql, params);
    }

    if (normalized.startsWith('update')) {
      return this.handleUpdate(sql, params);
    }

    if (normalized.startsWith('delete')) {
      return this.handleDelete(sql, params);
    }

    return { rows: [], changes: 0, lastInsertRowid: 0 };
  }

  private handleCreateTable(sql: string): QueryResult {
    const match = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/i);
    if (match) {
      const tableName = match[1];
      if (!this.data[tableName]) {
        this.data[tableName] = [];
      }
    }
    return { rows: [], changes: 0, lastInsertRowid: 0 };
  }

  private handleInsert(sql: string, params: unknown[]): QueryResult {
    const match = sql.match(/insert\s+into\s+(\w+)\s*\(([^)]+)\)/i);
    if (!match) return { rows: [], changes: 0, lastInsertRowid: 0 };

    const tableName = match[1];
    const columns = match[2].split(',').map((c) => c.trim());

    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }

    const row: Record<string, unknown> = { id: ++this.lastInsertRowid };
    columns.forEach((col, idx) => {
      row[col] = params[idx];
    });

    this.data[tableName].push(row);
    return { rows: [], changes: 1, lastInsertRowid: this.lastInsertRowid };
  }

  private handleSelect(sql: string, params: unknown[]): QueryResult {
    const match = sql.match(/from\s+(\w+)/i);
    if (!match) return { rows: [], changes: 0, lastInsertRowid: 0 };

    const tableName = match[1];
    const rows = this.data[tableName] || [];

    // Simple WHERE clause handling
    const whereMatch = sql.match(/where\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params.length > 0) {
      const column = whereMatch[1];
      const value = params[0];
      const filtered = rows.filter((r) => (r as Record<string, unknown>)[column] === value);
      return { rows: filtered as Record<string, unknown>[], changes: 0, lastInsertRowid: 0 };
    }

    return { rows: rows as Record<string, unknown>[], changes: 0, lastInsertRowid: 0 };
  }

  private handleUpdate(sql: string, params: unknown[]): QueryResult {
    const match = sql.match(/update\s+(\w+)\s+set\s+(\w+)\s*=\s*\?.*where\s+(\w+)\s*=\s*\?/i);
    if (!match) return { rows: [], changes: 0, lastInsertRowid: 0 };

    const [, tableName, setColumn, whereColumn] = match;
    const rows = this.data[tableName] || [];
    let changes = 0;

    for (const row of rows) {
      if ((row as Record<string, unknown>)[whereColumn] === params[1]) {
        (row as Record<string, unknown>)[setColumn] = params[0];
        changes++;
      }
    }

    return { rows: [], changes, lastInsertRowid: 0 };
  }

  private handleDelete(sql: string, params: unknown[]): QueryResult {
    const match = sql.match(/delete\s+from\s+(\w+)(?:\s+where\s+(\w+)\s*=\s*\?)?/i);
    if (!match) return { rows: [], changes: 0, lastInsertRowid: 0 };

    const [, tableName, whereColumn] = match;
    const rows = this.data[tableName] || [];

    if (whereColumn && params.length > 0) {
      const before = rows.length;
      this.data[tableName] = rows.filter(
        (r) => (r as Record<string, unknown>)[whereColumn] !== params[0]
      );
      return { rows: [], changes: before - this.data[tableName].length, lastInsertRowid: 0 };
    }

    this.data[tableName] = [];
    return { rows: [], changes: rows.length, lastInsertRowid: 0 };
  }

  private async save(): Promise<void> {
    const dir = path.dirname(this.filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  }
}

// Singleton instance
let dbInstance: SQLiteDatabase | null = null;

export async function getDatabase(options?: DatabaseOptions): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = new SQLiteDatabase(options);
    await dbInstance.initialize();
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
