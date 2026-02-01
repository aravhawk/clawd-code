import { spawn } from 'child_process';
import type {
  HookEvent,
  HookInput,
  HookResult,
  HookConfig,
  Hooks,
  HookConfigGroup,
} from './types';
import { Logger } from '../utils/logger';

const log = Logger.create('HooksEngine');

export class HooksEngine {
  private hooks: Map<HookEvent, HookConfig[]> = new Map();

  constructor() {
    // Initialize empty hooks for all events
    const events: HookEvent[] = [
      'SessionStart',
      'SessionEnd',
      'UserPromptSubmit',
      'PreToolUse',
      'PostToolUse',
      'PermissionRequest',
      'Stop',
      'SubagentStart',
      'SubagentStop',
      'PreCompact',
      'Notification',
      'Setup',
    ];

    events.forEach((event) => this.hooks.set(event, []));
  }

  loadFromConfig(config: Hooks): void {
    for (const [event, hookGroup] of Object.entries(config)) {
      if (hookGroup && typeof hookGroup === 'object' && 'hooks' in hookGroup) {
        this.hooks.set(
          event as HookEvent,
          (hookGroup as HookConfigGroup).hooks,
        );
      }
    }
  }

  async run(event: HookEvent, input: HookInput): Promise<HookResult> {
    const configs = this.hooks.get(event) || [];
    const results: HookResult[] = [];

    const matchingHooks = this.findMatchingHooks(configs, event, input);

    const promises = matchingHooks.flatMap((config) => {
      if ('hooks' in config) {
        return (config as HookConfigGroup).hooks.map((hook) =>
          this.executeHook(hook, input)
        );
      }
      return [];
    });

    const hookResults = await Promise.all(promises);

    return this.mergeResults(hookResults);
  }

  private findMatchingHooks(
    configs: (HookConfig | HookConfigGroup)[],
    event: HookEvent,
    input: HookInput,
  ): (HookConfig | HookConfigGroup)[] {
    return configs.filter((config) => {
      if (!config.matcher) return true;

      if ('toolName' in input) {
        const regex = new RegExp(`^(${config.matcher})$`);
        return regex.test(input.toolName as string);
      }

      if ('notificationType' in input && event === 'Notification') {
        return config.matcher === input.notificationType;
      }

      return true;
    });
  }

  private async executeHook(
    hook: HookConfig,
    input: HookInput,
  ): Promise<HookResult> {
    const timeout = hook.timeout ?? 60000;

    if (hook.type === 'command') {
      return this.executeCommandHook(hook.command!, input, timeout);
    } else if (hook.type === 'prompt') {
      return this.executePromptHook(hook.prompt!, input, timeout);
    }

    return { ok: true };
  }

  private async executeCommandHook(
    command: string,
    input: HookInput,
    timeout: number,
  ): Promise<HookResult> {
    return new Promise((resolve) => {
      const child = spawn('bash', ['-c', command], {
        timeout,
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: input.cwd,
        },
      });

      // Send input as JSON to stdin
      child.stdin?.write(JSON.stringify(input));
      child.stdin?.end();

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Try to parse JSON output
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed as HookResult);
          } catch {
            resolve({ ok: true, additionalContext: stdout });
          }
        } else if (code === 2) {
          // Exit code 2 = blocking error
          resolve({
            ok: false,
            reason: stderr,
            decision: 'block' as const,
          });
        } else {
          // Other exit codes = non-blocking error
          resolve({ ok: true });
        }
      });

      child.on('error', () => {
        resolve({ ok: true });
      });
    });
  }

  private async executePromptHook(
    prompt: string,
    input: HookInput,
    timeout: number,
  ): Promise<HookResult> {
    // For now, return success
    // In full implementation, this would use a fast LLM (Haiku)
    log.debug('Prompt hook not yet fully implemented');
    return { ok: true };
  }

  private mergeResults(results: HookResult[]): HookResult {
    // If any result blocks, the overall result blocks
    const blocking = results.find((r) => r.decision === 'block' || !r.ok);
    if (blocking) {
      return blocking;
    }

    // Merge additional context
    const contexts = results
      .map((r) => r.additionalContext)
      .filter(Boolean) as string[];

    // Merge permission decisions (deny > ask > allow)
    const decisions = results
      .map((r) => r.permissionDecision)
      .filter(Boolean) as Array<'allow' | 'deny' | 'ask'>;

    let permissionDecision: 'allow' | 'deny' | 'ask' | undefined = undefined;

    if (decisions.includes('deny')) permissionDecision = 'deny';
    else if (decisions.includes('ask')) permissionDecision = 'ask';
    else if (decisions.includes('allow')) permissionDecision = 'allow';

    return {
      ok: true,
      additionalContext: contexts.length > 0 ? contexts.join('\n') : undefined,
      permissionDecision,
    };
  }
}
