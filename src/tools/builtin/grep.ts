import { globby } from 'globby';
import * as fs from 'fs/promises';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';
import * as path from 'path';

const log = Logger.create('GrepTool');

interface GrepInput {
  pattern: string;
  glob?: string;
  caseInsensitive?: boolean;
}

export class GrepTool extends BaseTool {
  name = 'Grep';

  description =
    'Search file contents for a pattern. Supports regex. Use glob parameter to filter files. Returns matching lines with file paths and line numbers.';

  inputSchema = {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The regex pattern to search for',
      },
      glob: {
        type: 'string',
        description: 'File pattern to filter (e.g., "**/*.ts")',
      },
      caseInsensitive: {
        type: 'boolean',
        description: 'Perform case-insensitive search',
      },
    },
    required: ['pattern'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { pattern, glob: globPattern = '**/*', caseInsensitive = false } =
      input as GrepInput;

    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
      return {
        success: false,
        content: 'Pattern must be a non-empty string',
      };
    }

    log.debug(`Grepping: ${pattern} in ${globPattern}`);

    try {
      // Validate regex pattern
      let regex: RegExp;
      try {
        regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
      } catch (regexError) {
        return {
          success: false,
          content: `Invalid regex pattern: ${(regexError as Error).message}`,
        };
      }

      const files = await globby(globPattern, {
        cwd: this.context.cwd,
        absolute: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });

      if (files.length === 0) {
        return {
          success: true,
          content: 'No files matched the glob pattern',
          metadata: { count: 0 },
        };
      }

      // Limit files to prevent excessive processing
      const MAX_FILES = 500;
      const filesToProcess = files.slice(0, MAX_FILES);
      
      if (files.length > MAX_FILES) {
        log.warn(`Limiting grep to ${MAX_FILES} of ${files.length} files`);
      }

      const results: string[] = [];
      const MAX_RESULTS = 1000;

      for (const file of filesToProcess) {
        if (results.length >= MAX_RESULTS) {
          results.push(`\n[Results limited to ${MAX_RESULTS} matches]`);
          break;
        }

        try {
          const fullPath = path.join(this.context.cwd, file);
          
          // Check file size before reading
          const stats = await fs.stat(fullPath);
          const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
          
          if (stats.size > MAX_FILE_SIZE) {
            log.debug(`Skipping large file: ${file} (${stats.size} bytes)`);
            continue;
          }

          if (!stats.isFile()) {
            continue;
          }

          let content: string;
          try {
            content = await fs.readFile(fullPath, 'utf-8');
          } catch (encodingError) {
            // Try binary read if UTF-8 fails
            log.debug(`UTF-8 read failed for ${file}, skipping`);
            continue;
          }

          const lines = content.split('\n');

          for (let index = 0; index < lines.length; index++) {
            if (results.length >= MAX_RESULTS) {
              break;
            }

            const line = lines[index];
            if (regex.test(line)) {
              results.push(`${file}:${index + 1}:${line}`);
            }
          }
        } catch (error) {
          // Skip files that can't be read
          log.debug(`Failed to process file ${file}:`, (error as Error).message);
        }
      }

      return {
        success: true,
        content: results.length > 0 ? results.join('\n') : 'No matches found',
        metadata: { 
          count: results.length,
          filesProcessed: filesToProcess.length,
          totalFiles: files.length,
        },
      };
    } catch (error) {
      log.error('Grep failed:', error);
      return {
        success: false,
        content: `Grep failed: ${(error as Error).message}`,
      };
    }
  }
}
