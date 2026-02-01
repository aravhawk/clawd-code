import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';

const log = Logger.create('EditTool');

interface EditInput {
  filePath: string;
  oldString: string;
  newString: string;
  replaceAll?: boolean;
}

export class EditTool extends BaseTool {
  name = 'Edit';

  description =
    'Perform exact string replacements in files. The oldString must match exactly, including whitespace and indentation. For new files, use the Write tool instead.';

  inputSchema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Absolute path to the file to modify',
      },
      oldString: {
        type: 'string',
        description: 'The exact text to replace',
      },
      newString: {
        type: 'string',
        description: 'The text to replace it with',
      },
      replaceAll: {
        type: 'boolean',
        description: 'Replace all occurrences (default: false)',
      },
    },
    required: ['filePath', 'oldString', 'newString'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { filePath, oldString, newString, replaceAll = false } = input as EditInput;

    log.debug(`Editing file: ${filePath}`);

    if (!this.isPathAllowed(filePath)) {
      return {
        success: false,
        content: `Path not allowed: ${filePath}`,
      };
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (!content.includes(oldString)) {
        return {
          success: false,
          content: 'oldString not found in file content',
        };
      }

      if (!replaceAll) {
        const matches = content.split(oldString).length - 1;
        if (matches > 1) {
          return {
            success: false,
            content: `oldString found ${matches} times. Provide more context to uniquely identify the match, or use replaceAll: true`,
          };
        }
      }

      const newContent = replaceAll
        ? content.replaceAll(oldString, newString)
        : content.replace(oldString, newString);

      await fs.writeFile(filePath, newContent, 'utf-8');

      return {
        success: true,
        content: `Successfully edited ${filePath}`,
        metadata: {
          filePath,
          bytesWritten: newContent.length,
        },
      };
    } catch (error) {
      log.error('Failed to edit file:', error);
      return {
        success: false,
        content: `Edit failed: ${(error as Error).message}`,
      };
    }
  }

  private isPathAllowed(filePath: string): boolean {
    if (!path.isAbsolute(filePath)) return false;

    const projectDir = this.context.cwd;
    const resolvedPath = path.resolve(filePath);

    return resolvedPath.startsWith(projectDir);
  }
}
