import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';

const log = Logger.create('WriteTool');

interface WriteInput {
  file_path?: string;
  filePath?: string;
  content?: string;
}

export class WriteTool extends BaseTool {
  name = 'Write';

  description =
    'Write content to a file. Creates the file if it does not exist, or overwrites it if it does.';

  inputSchema = {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute path to the file to write',
      },
      content: {
        type: 'string',
        description: 'Content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { file_path, filePath, content } = input as WriteInput;
    const targetPath =
      typeof file_path === 'string'
        ? file_path
        : typeof filePath === 'string'
          ? filePath
          : undefined;

    if (!targetPath || targetPath.trim().length === 0) {
      return {
        success: false,
        content: 'Missing or empty required field: file_path',
      };
    }

    if (content === undefined || content === null) {
      return {
        success: false,
        content: 'Missing required field: content',
      };
    }

    if (typeof content !== 'string') {
      return {
        success: false,
        content: 'Content must be a string',
      };
    }

    log.debug(`Writing file: ${targetPath}`);

    if (!this.isPathAllowed(targetPath)) {
      return {
        success: false,
        content: `Path not allowed: ${targetPath}`,
      };
    }

    try {
      const dir = path.dirname(targetPath);
      
      // Validate directory path is allowed
      if (!this.isPathAllowed(dir)) {
        return {
          success: false,
          content: `Directory path not allowed: ${dir}`,
        };
      }

      // Create directory if it doesn't exist
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (mkdirError) {
        return {
          success: false,
          content: `Failed to create directory: ${(mkdirError as Error).message}`,
        };
      }

      // Check if file exists to determine if we're creating or overwriting
      let isNewFile = false;
      try {
        await fs.access(targetPath);
      } catch {
        isNewFile = true;
      }

      await fs.writeFile(targetPath, content, 'utf-8');

      return {
        success: true,
        content: `Successfully ${isNewFile ? 'created' : 'overwrote'} ${targetPath}`,
        metadata: { 
          filePath: targetPath, 
          bytesWritten: content.length,
          isNewFile,
        },
      };
    } catch (error) {
      log.error('Failed to write file:', error);
      return {
        success: false,
        content: `Failed to write file: ${(error as Error).message}`,
      };
    }
  }

  private isPathAllowed(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') return false;
    if (!path.isAbsolute(filePath)) return false;

    const projectDir = this.context.cwd;
    const resolvedPath = path.resolve(filePath);

    return resolvedPath.startsWith(projectDir);
  }
}
