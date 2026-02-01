/**
 * Skill execution engine.
 */

import type { Skill, SkillResult } from './parser';
import type { AnthropicProvider } from '../providers/anthropic';

export interface SkillExecutorConfig {
  provider: AnthropicProvider;
  model?: string;
  maxTokens?: number;
}

/**
 * Execute a skill with the given context.
 */
export async function executeSkill(
  skill: Skill,
  context: Record<string, unknown>,
  config: SkillExecutorConfig
): Promise<SkillResult> {
  const startTime = Date.now();

  try {
    // Build the prompt by expanding skill content with context
    const expandedContent = expandTemplate(skill.content, context);

    // Create the message with the skill's system prompt
    const response = await config.provider.createMessage({
      messages: [{ role: 'user', content: expandedContent }],
      system:
        skill.systemPrompt || `You are executing the "${skill.name}" skill. ${skill.description}`,
      maxTokens: config.maxTokens || 4096,
    });

    // Extract text content
    let output = '';
    if (typeof response.content === 'string') {
      output = response.content;
    } else {
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          output += block.text;
        }
      }
    }

    return {
      success: true,
      output,
      executionTime: Date.now() - startTime,
      tokensUsed: response.usage?.output_tokens || 0,
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: (error as Error).message,
      executionTime: Date.now() - startTime,
      tokensUsed: 0,
    };
  }
}

/**
 * Expand template variables in skill content.
 */
function expandTemplate(content: string, context: Record<string, unknown>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in context) {
      const value = context[key];
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    return match;
  });
}

/**
 * Validate skill prerequisites.
 */
export function validateSkillPrerequisites(
  skill: Skill,
  context: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check required context variables
  const requiredVars = skill.content.match(/\{\{(\w+)\}\}/g) || [];
  for (const varMatch of requiredVars) {
    const varName = varMatch.slice(2, -2);
    if (!(varName in context)) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

export default executeSkill;
