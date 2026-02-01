import * as fs from 'fs/promises';
import { BaseTool } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';
import * as path from 'path';

const log = Logger.create('LsTool');

interface LsInput {
  path?: string;
  detailed?: boolean;
}

export class LsTool extends BaseTool {
  name = 'Ls';

  description =
    'List directory contents. Returns files and directories. Use detailed=true for file sizes and types.';

  inputSchema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to list (default: current directory)',
      },
      detailed: {
        type: 'boolean',
        description: 'Show detailed information (size, type)',
      },
    },
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { path: inputPath = '.', detailed = false } = input as LsInput;

    log.debug(`Listing directory: ${inputPath}`);

    try {
      const fullPath = path.resolve(this.context.cwd, inputPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      if (detailed) {
        const details = await Promise.all(
          entries.map(async (entry) => {
            try {
              const entryPath = path.join(fullPath, entry.name);
              const stats = await fs.stat(entryPath);
              const type = entry.isDirectory()
                ? 'DIR'
                : entry.isSymbolicLink()
                ? 'SYMLINK'
                : 'FILE';
              return `${type.padEnd(8)} ${entry.name} (${stats.size} bytes)`;
            } catch {
              return `UNKNOWN  ${entry.name}`;
            }
          })
        );
        return {
          success: true,
          content: details.sort().join('\n'),
          metadata: { count: entries.length },
        };
      }

      const names = entries.map((e) => e.name);
      const dirs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name + '/');
      const files = entries.filter((e) => !e.isDirectory()).map((e) => e.name);

      return {
        success: true,
        content: [...dirs.sort(), ...files.sort()].join('\n'),
        metadata: {
          count: entries.length,
          directories: dirs.length,
          files: files.length,
        },
      };
    } catch (error) {
      log.error('Ls failed:', error);
      return {
        success: false,
        content: `Ls failed: ${(error as Error).message}`,
      };
    }
  }
}
