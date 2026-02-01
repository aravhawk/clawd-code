/**
 * Session transcript export and formatting.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Message } from './types';
import { getTranscriptDir } from '../storage/paths';

export interface TranscriptOptions {
  format: 'markdown' | 'json' | 'text';
  includeToolCalls: boolean;
  includeTimestamps: boolean;
  includeMetadata: boolean;
}

export interface Transcript {
  sessionId: string;
  sessionName: string;
  createdAt: number;
  messages: Message[];
  metadata?: Record<string, unknown>;
}

const defaultOptions: TranscriptOptions = {
  format: 'markdown',
  includeToolCalls: true,
  includeTimestamps: true,
  includeMetadata: false,
};

/**
 * Generate a transcript from session messages.
 */
export function generateTranscript(
  transcript: Transcript,
  options: Partial<TranscriptOptions> = {}
): string {
  const opts = { ...defaultOptions, ...options };

  switch (opts.format) {
    case 'markdown':
      return formatMarkdown(transcript, opts);
    case 'json':
      return formatJson(transcript, opts);
    case 'text':
      return formatText(transcript, opts);
    default:
      return formatMarkdown(transcript, opts);
  }
}

/**
 * Format transcript as Markdown.
 */
function formatMarkdown(transcript: Transcript, options: TranscriptOptions): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${transcript.sessionName || 'Session Transcript'}`);
  lines.push('');

  if (options.includeMetadata) {
    lines.push('## Metadata');
    lines.push('');
    lines.push(`- **Session ID:** ${transcript.sessionId}`);
    lines.push(`- **Created:** ${new Date(transcript.createdAt).toISOString()}`);
    lines.push(`- **Messages:** ${transcript.messages.length}`);
    lines.push('');
  }

  lines.push('## Conversation');
  lines.push('');

  // Messages
  for (const message of transcript.messages) {
    const roleLabel = message.role === 'user' ? '**You**' : '**Clawd**';
    const timestamp =
      options.includeTimestamps && message.timestamp
        ? ` (${new Date(message.timestamp).toLocaleTimeString()})`
        : '';

    lines.push(`### ${roleLabel}${timestamp}`);
    lines.push('');

    // Handle content
    if (typeof message.content === 'string') {
      lines.push(message.content);
    } else if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'text' && block.text) {
          lines.push(block.text);
        } else if (options.includeToolCalls && block.type === 'tool_use') {
          lines.push('```');
          lines.push(`Tool: ${block.name}`);
          lines.push(`Input: ${JSON.stringify(block.input, null, 2)}`);
          lines.push('```');
        }
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format transcript as JSON.
 */
function formatJson(transcript: Transcript, options: TranscriptOptions): string {
  const output: Record<string, unknown> = {
    sessionId: transcript.sessionId,
    sessionName: transcript.sessionName,
    createdAt: transcript.createdAt,
    messages: transcript.messages.map((msg) => {
      const formatted: Record<string, unknown> = {
        role: msg.role,
        content: msg.content,
      };

      if (options.includeTimestamps && msg.timestamp) {
        formatted.timestamp = msg.timestamp;
      }

      return formatted;
    }),
  };

  if (options.includeMetadata && transcript.metadata) {
    output.metadata = transcript.metadata;
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Format transcript as plain text.
 */
function formatText(transcript: Transcript, options: TranscriptOptions): string {
  const lines: string[] = [];

  lines.push(`Session: ${transcript.sessionName || transcript.sessionId}`);
  lines.push(`Created: ${new Date(transcript.createdAt).toISOString()}`);
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  for (const message of transcript.messages) {
    const role = message.role === 'user' ? 'You' : 'Clawd';
    const timestamp =
      options.includeTimestamps && message.timestamp
        ? ` [${new Date(message.timestamp).toLocaleTimeString()}]`
        : '';

    lines.push(`${role}${timestamp}:`);

    if (typeof message.content === 'string') {
      lines.push(message.content);
    } else if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'text' && block.text) {
          lines.push(block.text);
        }
      }
    }

    lines.push('');
    lines.push('-'.repeat(40));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Save a transcript to disk.
 */
export async function saveTranscript(
  transcript: Transcript,
  options: Partial<TranscriptOptions> = {}
): Promise<string> {
  const opts = { ...defaultOptions, ...options };
  const content = generateTranscript(transcript, opts);

  const ext = opts.format === 'json' ? '.json' : opts.format === 'text' ? '.txt' : '.md';
  const filename = `${transcript.sessionId}_${Date.now()}${ext}`;
  const dir = getTranscriptDir();
  const filePath = path.join(dir, filename);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');

  return filePath;
}

export default generateTranscript;
