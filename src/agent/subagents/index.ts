export { BaseSubagent } from './base.js';
export type { SubagentConfig, SubagentResult } from './base.js';
export { ExploreSubagent } from './explore.js';
export { GeneralSubagent } from './general.js';

import type { AnthropicProvider } from '../../providers/anthropic';
import type { ToolRegistry } from '../../tools/registry';
import type { SubagentConfig, SubagentResult } from './base';
import { ExploreSubagent } from './explore';
import { GeneralSubagent } from './general';

export function createSubagent(
  type: 'explore' | 'plan' | 'general',
  provider: AnthropicProvider,
  tools: ToolRegistry,
  systemPrompt?: string,
  maxTokens = 4096,
) {
  const config: SubagentConfig = {
    provider,
    tools,
    systemPrompt: systemPrompt || getDefaultSystemPrompt(type),
    maxTokens,
  };

  switch (type) {
    case 'explore':
      return new ExploreSubagent(config);
    case 'general':
      return new GeneralSubagent(config);
    default:
      return new GeneralSubagent(config);
  }
}

function getDefaultSystemPrompt(type: string): string {
  switch (type) {
    case 'explore':
      return 'You are a codebase exploration agent. Find and analyze code efficiently.';
    case 'plan':
      return 'You are a planning agent. Create detailed implementation plans.';
    case 'general':
      return 'You are a general-purpose assistant. Help with various tasks.';
    default:
      return 'You are a helpful assistant.';
  }
}

export async function runSubagent(
  type: 'explore' | 'plan' | 'general',
  task: string,
  provider: AnthropicProvider,
  tools: ToolRegistry,
): Promise<SubagentResult> {
  const subagent = createSubagent(type, provider, tools);
  return subagent.execute(task);
}
