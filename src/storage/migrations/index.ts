/**
 * Database migration runner
 * Manages database schema versioning and migrations
 */

import { SQLiteDatabase, Migration } from '../sqlite.js';
import { migration001 } from './001_initial.js';
import { migration002 } from './002_sessions.js';

const migrations: Migration[] = [migration001, migration002];

export interface MigrationStatus {
  id: number;
  name: string;
  appliedAt: string | null;
  status: 'pending' | 'applied' | 'failed';
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationTable(db);

  for (const migration of migrations) {
    const applied = await isMigrationApplied(db, migration.id);

    if (!applied) {
      try {
        await applyMigration(db, migration);
      } catch (error) {
        throw new Error(
          `Failed to apply migration ${migration.id} (${migration.name}): ${(error as Error).message}`
        );
      }
    }
  }
}

/**
 * Get migration status for all migrations
 */
export async function getMigrationStatus(db: SQLiteDatabase): Promise<MigrationStatus[]> {
  await ensureMigrationTable(db);

  const applied = await db.all<{ id: number; name: string; applied_at: string }>(
    'SELECT id, name, applied_at FROM migrations ORDER BY id'
  );

  return migrations.map((migration) => {
    const record = applied.find((a) => a.id === migration.id);
    return {
      id: migration.id,
      name: migration.name,
      appliedAt: record?.applied_at ?? null,
      status: record ? 'applied' : 'pending',
    };
  });
}

/**
 * Rollback the last migration
 */
export async function rollbackMigration(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationTable(db);

  const lastApplied = await db.get<{ id: number; name: string }>(
    'SELECT id, name FROM migrations ORDER BY id DESC LIMIT 1'
  );

  if (!lastApplied) {
    throw new Error('No migrations to rollback');
  }

  const migration = migrations.find((m) => m.id === lastApplied.id);
  if (!migration) {
    throw new Error(`Migration ${lastApplied.id} not found`);
  }

  try {
    await db.exec(migration.down);
    await db.run('DELETE FROM migrations WHERE id = ?', [migration.id]);
  } catch (error) {
    throw new Error(
      `Failed to rollback migration ${migration.id} (${migration.name}): ${(error as Error).message}`
    );
  }
}

/**
 * Reset database by rolling back all migrations
 */
export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  await ensureMigrationTable(db);

  const status = await getMigrationStatus(db);
  const applied = status.filter((s) => s.status === 'applied').reverse();

  for (const migration of applied) {
    await rollbackMigration(db);
  }
}

/**
 * Ensure migration tracking table exists
 */
async function ensureMigrationTable(db: SQLiteDatabase): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Check if a migration has been applied
 */
async function isMigrationApplied(db: SQLiteDatabase, id: number): Promise<boolean> {
  const result = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM migrations WHERE id = ?',
    [id]
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Apply a migration
 */
async function applyMigration(db: SQLiteDatabase, migration: Migration): Promise<void> {
  // Execute migration SQL
  await db.exec(migration.up);

  // Record migration as applied
  await db.run('INSERT INTO migrations (id, name) VALUES (?, ?)', [migration.id, migration.name]);
}

/**
 * Get current migration version (highest applied migration id)
 */
export async function getCurrentVersion(db: SQLiteDatabase): Promise<number> {
  await ensureMigrationTable(db);

  const result = await db.get<{ max_id: number | null }>(
    'SELECT MAX(id) as max_id FROM migrations'
  );

  return result?.max_id ?? 0;
}

/**
 * Get latest available migration version
 */
export function getLatestVersion(): number {
  return migrations.length > 0 ? Math.max(...migrations.map((m) => m.id)) : 0;
}

/**
 * Check if database is up to date
 */
export async function isUpToDate(db: SQLiteDatabase): Promise<boolean> {
  const current = await getCurrentVersion(db);
  const latest = getLatestVersion();
  return current === latest;
}
