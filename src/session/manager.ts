import { v4 as uuidv4 } from 'uuid';
import type { Session, Message, SessionConfig } from './types';
import { SessionStorage } from './storage';
import { Logger } from '../utils/logger';
import { compactMessages, estimateTotalTokens, type CompactOptions } from './compact';

const log = Logger.create('SessionManager');

const DEFAULT_CONFIG: SessionConfig = {
  dataDir: path.join(process.env.HOME || '', '.clawd'),
  transcriptDir: path.join(process.env.HOME || '', '.clawd', 'transcripts'),
  compactThreshold: 100000,
};

import * as path from 'path';

export class SessionManager {
  private storage: SessionStorage;
  private config: SessionConfig;
  private currentSession: Session | null = null;
  private messages: Message[] = [];
  private tokenUsage = 0;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = new SessionStorage(this.config.dataDir);
  }

  get currentId(): string | null {
    return this.currentSession?.id ?? null;
  }

  get name(): string {
    return this.currentSession?.name ?? 'New Session';
  }

  get isReady(): boolean {
    return this.currentSession !== null;
  }

  async create(name?: string): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      name: name ?? `Session ${new Date().toLocaleString()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectPath: process.cwd(),
    };

    await this.storage.save(session);
    this.currentSession = session;
    this.messages = [];
    this.tokenUsage = 0;

    log.info(`Created session: ${session.id}`);
    return session;
  }

  async resume(sessionId: string): Promise<Session | null> {
    const session = await this.storage.load(sessionId);
    if (!session) return null;

    this.currentSession = session;
    // Messages would be loaded from transcript
    this.messages = [];
    this.tokenUsage = session.tokenUsage ?? 0;

    log.info(`Resumed session: ${sessionId}`);
    return session;
  }

  async loadMostRecent(): Promise<Session | null> {
    const sessions = await this.storage.list(process.cwd());
    if (sessions.length === 0) return null;

    return this.resume(sessions[0].id);
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.tokenUsage += this.estimateTokens(message);

    if (this.currentSession) {
      this.currentSession.updatedAt = new Date();
      this.currentSession.tokenUsage = this.tokenUsage;
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  async clear(): Promise<void> {
    if (this.currentSession) {
      await this.create();
    }
  }

  async getAllSessions(): Promise<Session[]> {
    return this.storage.list(process.cwd());
  }

  private estimateTokens(message: Message): number {
    const content = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);
    return Math.ceil(content.length / 4);
  }

  async saveCurrent(): Promise<void> {
    if (this.currentSession) {
      await this.storage.save(this.currentSession);
    }
  }

  async compact(options?: CompactOptions): Promise<{
    originalCount: number;
    compactedCount: number;
    tokensSaved: number;
  }> {
    const result = compactMessages(this.messages, options);
    this.messages = result.messages;
    this.tokenUsage = estimateTotalTokens(this.messages);

    if (this.currentSession) {
      this.currentSession.updatedAt = new Date();
      this.currentSession.tokenUsage = this.tokenUsage;
    }

    log.info(
      `Compacted session: ${result.originalCount} -> ${result.compactedCount} messages, saved ${result.tokensSaved} tokens`,
    );

    return {
      originalCount: result.originalCount,
      compactedCount: result.compactedCount,
      tokensSaved: result.tokensSaved,
    };
  }

  getTokenCount(): number {
    return this.tokenUsage;
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}
