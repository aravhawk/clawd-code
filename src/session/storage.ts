import * as fs from 'fs/promises';
import * as path from 'path';
import type { Session } from './types';
import { Logger } from '../utils/logger';

const log = Logger.create('SessionStorage');

export class SessionStorage {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async save(session: Session): Promise<void> {
    const sessionPath = this.getSessionPath(session.id);
    await fs.mkdir(path.dirname(sessionPath), { recursive: true });
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), 'utf-8');
    log.debug(`Saved session: ${session.id}`);
  }

  async load(sessionId: string): Promise<Session | null> {
    const sessionPath = this.getSessionPath(sessionId);
    try {
      const content = await fs.readFile(sessionPath, 'utf-8');
      const session = JSON.parse(content) as Session;
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);
      return session;
    } catch {
      return null;
    }
  }

  async list(projectPath: string): Promise<Session[]> {
    const sessionsDir = path.join(this.dataDir, 'sessions');
    try {
      const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
      const sessions: Session[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const session = await this.load(entry.name.slice(0, -5));
          if (session && session.projectPath === projectPath) {
            sessions.push(session);
          }
        }
      }

      return sessions.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    } catch {
      return [];
    }
  }

  async delete(sessionId: string): Promise<void> {
    const sessionPath = this.getSessionPath(sessionId);
    try {
      await fs.unlink(sessionPath);
      log.debug(`Deleted session: ${sessionId}`);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  private getSessionPath(sessionId: string): string {
    return path.join(this.dataDir, 'sessions', `${sessionId}.json`);
  }
}
