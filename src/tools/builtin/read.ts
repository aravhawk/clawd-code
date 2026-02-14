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

    if (!file_path || file_path.trim().length === 0) {
      return {
        success: false,
        content: 'File path cannot be empty',
      };
    }

    log.debug(`Reading file: ${file_path}`);

    try {
      // Check if file exists and is readable
      try {
        await fs.access(file_path, fs.constants.R_OK);
      } catch (accessError) {
        return {
          success: false,
          content: `Cannot access file: ${file_path}. ${(accessError as Error).message}`,
        };
      }

      // Get file stats to check size
      const stats = await fs.stat(file_path);
      if (!stats.isFile()) {
        return {
          success: false,
          content: `Path is not a file: ${file_path}`,
        };
      }

      // Warn about large files
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (stats.size > MAX_FILE_SIZE) {
        log.warn(`Reading large file (${stats.size} bytes): ${file_path}`);
      }

      // Try UTF-8 first
      let content: string;
      try {
        content = await fs.readFile(file_path, 'utf-8');
      } catch (encodingError) {
        // If UTF-8 fails, try binary and convert
        log.warn(`Failed to read as UTF-8, attempting binary read: ${file_path}`);
        try {
          const buffer = await fs.readFile(file_path);
          content = buffer.toString('latin1');
        } catch (binaryError) {
          return {
            success: false,
            content: `Failed to read file (encoding error): ${(binaryError as Error).message}`,
          };
        }
      }

      const lines = content.split('\n');

      // Validate offset and limit
      if (offset < 0) {
        return {
          success: false,
          content: 'Offset cannot be negative',
        };
      }

      if (limit !== undefined && limit < 0) {
        return {
          success: false,
          content: 'Limit cannot be negative',
        };
      }

      if (offset > 0 || limit !== undefined) {
        const start = Math.min(offset, lines.length);
        const end = limit !== undefined ? Math.min(start + limit, lines.length) : lines.length;
        const limited = lines.slice(start, end);
        return {
          success: true,
          content: limited.join('\n'),
          metadata: { 
            linesRead: limited.length, 
            totalLines: lines.length,
            fileSize: stats.size,
          },
        };
      }

      return { 
        success: true, 
        content,
        metadata: {
          fileSize: stats.size,
          totalLines: lines.length,
        },
      };
    } catch (error) {
      log.error('Failed to read file:', error);
      return {
        success: false,
        content: `Failed to read file: ${(error as Error).message}`,
      };
    }
  }
}
