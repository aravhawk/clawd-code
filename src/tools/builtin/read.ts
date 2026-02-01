import * as fs from 'fs/promises';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';

const log = Logger.create('ReadTool');

interface ReadInput {
  file_path: string;
  offset?: number;
  limit?: number;
}

export class ReadTool extends BaseTool {
  name = 'Read';

  description = 'Read a file from the file system. Supports offset and limit for reading portions of files.';

  inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to read',
      },
      offset: {
        type: 'number',
        description: 'Line number to start reading from (default: 0)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of lines to read (default: read entire file)',
      },
    },
    required: ['file_path'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { file_path, offset = 0, limit } = input as ReadInput;

    log.debug(`Reading file: ${file_path}`);

    try {
      const content = await fs.readFile(file_path, 'utf-8');
      const lines = content.split('\n');

      if (offset > 0 || limit !== undefined) {
        const start = offset;
        const end = limit ? start + limit : lines.length;
        const limited = lines.slice(start, end);
        return {
          success: true,
          content: limited.join('\n'),
          metadata: { linesRead: limited.length, totalLines: lines.length },
        };
      }

      return { success: true, content };
    } catch (error) {
      log.error('Failed to read file:', error);
      return {
        success: false,
        content: `Failed to read file: ${(error as Error).message}`,
      };
    }
  }
}
