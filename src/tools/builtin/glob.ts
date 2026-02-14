import { globby } from 'globby';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';
import * as path from 'path';

const log = Logger.create('GlobTool');

interface GlobInput {
  pattern: string;
  includePatterns?: string[];
}

export class GlobTool extends BaseTool {
  name = 'Glob';

  description =
    'Find files by pattern. Use glob patterns like **/*.ts to search recursively. Returns list of matching file paths sorted by modification time.';

  inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The glob pattern to match files',
      },
      includePatterns: {
        type: 'array',
        items: { type: 'string' },
        description: 'Additional patterns to include',
      },
    },
    required: ['pattern'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { pattern, includePatterns = [] } = input as GlobInput;

    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
      return {
        success: false,
        content: 'Pattern must be a non-empty string',
      };
    }

    log.debug(`Globbing files: ${pattern}`);

    try {
      const patterns = [pattern, ...(Array.isArray(includePatterns) ? includePatterns : [])];
      
      // Validate all patterns are strings
      for (const p of patterns) {
        if (typeof p !== 'string' || p.trim().length === 0) {
          return {
            success: false,
            content: 'All patterns must be non-empty strings',
          };
        }
      }

      const files = await globby(patterns, {
        cwd: this.context.cwd,
        absolute: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });

      if (!files || files.length === 0) {
        return {
          success: true,
          content: 'No files matched the pattern',
          metadata: { count: 0 },
        };
      }

      // Limit results to prevent memory issues
      const MAX_FILES = 1000;
      if (files.length > MAX_FILES) {
        log.warn(`Found ${files.length} files, limiting to ${MAX_FILES}`);
        const limited = files.slice(0, MAX_FILES);
        return {
          success: true,
          content: limited.join('\n') + `\n\n[Results limited to ${MAX_FILES} of ${files.length} total files]`,
          metadata: { count: limited.length, total: files.length, limited: true },
        };
      }

      // Sort by modification time
      const filesWithTime = await Promise.all(
        files.map(async (file) => {
          try {
            const fullPath = path.join(this.context.cwd, file);
            const stats = await import('fs/promises').then((fs) =>
              fs.stat(fullPath)
            );
            return { file, mtime: stats.mtimeMs };
          } catch (error) {
            log.debug(`Failed to stat file ${file}:`, error);
            return { file, mtime: 0 };
          }
        })
      );

      filesWithTime.sort((a, b) => b.mtime - a.mtime);
      const sortedFiles = filesWithTime.map((f) => f.file);

      return {
        success: true,
        content: sortedFiles.join('\n'),
        metadata: { count: sortedFiles.length },
      };
    } catch (error) {
      log.error('Glob failed:', error);
      return {
        success: false,
        content: `Glob failed: ${(error as Error).message}`,
      };
    }
  }
}
