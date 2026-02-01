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

    log.debug(`Globbing files: ${pattern}`);

    try {
      const patterns = [pattern, ...includePatterns];
      const files = await globby(patterns, {
        cwd: this.context.cwd,
        absolute: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });

      // Sort by modification time
      const filesWithTime = await Promise.all(
        files.map(async (file) => {
          try {
            const fullPath = path.join(this.context.cwd, file);
            const stats = await import('fs/promises').then((fs) =>
              fs.stat(fullPath)
            );
            return { file, mtime: stats.mtimeMs };
          } catch {
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
