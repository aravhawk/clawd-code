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

    log.debug(`Grepping: ${pattern} in ${globPattern}`);

    try {
      const files = await globby(globPattern, {
        cwd: this.context.cwd,
        absolute: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      });

      const results: string[] = [];
      const regex = new RegExp(
        pattern,
        caseInsensitive ? 'i' : ''
      );

      for (const file of files) {
        try {
          const fullPath = path.join(this.context.cwd, file);
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            if (regex.test(line)) {
              results.push(`${file}:${index + 1}:${line}`);
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }

      return {
        success: true,
        content: results.length > 0 ? results.join('\n') : 'No matches found',
        metadata: { count: results.length },
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
