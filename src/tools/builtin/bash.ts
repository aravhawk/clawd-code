import { spawn } from 'child_process';
import { BaseTool, type ToolContext } from '../base';
import type { ToolResult } from '../base';
import { Logger } from '../../utils/logger';

const log = Logger.create('BashTool');

interface BashInput {
  command: string;
  description: string;
  timeout?: number;
  workdir?: string;
}

export class BashTool extends BaseTool {
  name = 'Bash';

  description =
    'Execute shell commands in the terminal. Use for running scripts, installing packages, building projects, and system operations. Commands run in the project directory.';

  inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      description: {
        type: 'string',
        description: 'Brief description of what this command does',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 120000)',
      },
      workdir: {
        type: 'string',
        description: 'Working directory for the command',
      },
    },
    required: ['command', 'description'],
  };

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { command, timeout = 120000, workdir } = input as BashInput;
    
    if (!command || command.trim().length === 0) {
      return {
        success: false,
        content: 'Command cannot be empty',
      };
    }

    const cwd = workdir || this.context.cwd;

    log.debug(`Executing command: ${command}`);

    return new Promise((resolve) => {
      let isResolved = false;
      let timeoutId: NodeJS.Timeout | null = null;

      const child = spawn('bash', ['-c', command], {
        cwd,
        env: { ...process.env },
        detached: true,
      });

      let stdout = '';
      let stderr = '';

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (!isResolved) {
            log.warn(`Command timed out after ${timeout}ms, killing process`);
            
            // Try to kill the process and its children
            try {
              if (child.pid) {
                process.kill(-child.pid, 'SIGKILL');
              }
            } catch (killError) {
              log.error('Failed to kill process:', killError);
              child.kill('SIGKILL');
            }

            isResolved = true;
            resolve({
              success: false,
              content: `Command timed out after ${timeout}ms\n\nPartial output:\n${stdout}\n\nPartial stderr:\n${stderr}`,
              metadata: {
                exitCode: null,
                timedOut: true,
              },
            });
          }
        }, timeout);
      }

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!isResolved) {
          if (timeoutId) clearTimeout(timeoutId);
          isResolved = true;

          const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');

          resolve({
            success: code === 0,
            content: this.truncateOutput(output),
            metadata: {
              exitCode: code,
              truncated: output.length > 51200,
            },
          });
        }
      });

      child.on('error', (error) => {
        if (!isResolved) {
          if (timeoutId) clearTimeout(timeoutId);
          isResolved = true;

          log.error('Command failed:', error);
          resolve({
            success: false,
            content: `Command failed: ${error.message}`,
          });
        }
      });
    });
  }

  private truncateOutput(output: string): string {
    const MAX_BYTES = 51200;
    const MAX_LINES = 2000;

    const lines = output.split('\n');
    if (lines.length > MAX_LINES) {
      return (
        lines.slice(0, MAX_LINES).join('\n') +
        `\n\n[Output truncated: ${lines.length} lines total]`
      );
    }

    if (output.length > MAX_BYTES) {
      return (
        output.slice(0, MAX_BYTES) +
        `\n\n[Output truncated: ${output.length} bytes total]`
      );
    }

    return output;
  }
}
