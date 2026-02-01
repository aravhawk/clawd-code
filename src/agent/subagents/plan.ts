import { BaseSubagent, SubagentConfig, SubagentResult } from './base';
import type { Planner, Task } from '../planner';

export interface PlanAgentConfig extends SubagentConfig {
  maxTasks?: number;
}

/**
 * Planning subagent that creates structured task plans.
 */
export class PlanAgent extends BaseSubagent {
  name = 'plan';
  description = 'Creates structured task plans for complex goals';

  private maxTasks: number;

  constructor(config: PlanAgentConfig) {
    super(config);
    this.maxTasks = config.maxTasks ?? 10;
  }

  /**
   * Generate a plan for a given goal.
   */
  async execute(prompt: string): Promise<SubagentResult> {
    const startTime = Date.now();

    try {
      // Build a planning-specific prompt
      const planningPrompt = this.buildPlanningPrompt(prompt);

      // Use the provider to generate a plan
      const response = await this.config.provider.createMessage({
        messages: [{ role: 'user', content: planningPrompt }],
        maxTokens: 4096,
        system: this.getSystemPrompt(),
      });

      // Extract the plan from the response
      const plan = this.parsePlanFromResponse(response.content);

      return {
        success: true,
        output: JSON.stringify(plan, null, 2),
        metadata: {
          taskCount: plan.tasks.length,
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Planning failed: ${(error as Error).message}`,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Build a prompt specifically for planning.
   */
  private buildPlanningPrompt(goal: string): string {
    return `Create a detailed task plan for the following goal:

**Goal:** ${goal}

Please break this down into discrete, actionable tasks. For each task, provide:
1. A clear description
2. Priority (high/medium/low)
3. Any dependencies on other tasks

Format your response as a JSON object with the following structure:
\`\`\`json
{
  "goal": "the goal description",
  "tasks": [
    {
      "description": "task description",
      "priority": "high|medium|low",
      "dependencies": [] // array of task indices this depends on
    }
  ]
}
\`\`\`

Create no more than ${this.maxTasks} tasks. Focus on the most important steps.`;
  }

  /**
   * Get the system prompt for planning.
   */
  private getSystemPrompt(): string {
    return `You are a task planning assistant. Your job is to break down complex goals into discrete, actionable tasks.

Guidelines:
- Create clear, specific tasks that can be executed independently
- Identify dependencies between tasks
- Prioritize tasks appropriately
- Keep the plan focused and achievable
- Consider potential blockers and edge cases
- Output valid JSON that can be parsed`;
  }

  /**
   * Parse a plan from the LLM response.
   */
  private parsePlanFromResponse(content: string | Array<{ type: string; text?: string }>): {
    goal: string;
    tasks: Array<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;
  } {
    // Extract text content
    let text = '';
    if (typeof content === 'string') {
      text = content;
    } else {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          text += block.text;
        }
      }
    }

    // Extract JSON from code block or raw JSON
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('No valid JSON plan found in response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[1]);

      // Validate and normalize the plan
      return {
        goal: parsed.goal || 'Unknown goal',
        tasks: (parsed.tasks || []).map(
          (task: { description?: string; priority?: string; dependencies?: number[] }) => ({
            description: task.description || 'Unknown task',
            status: 'pending' as const,
            priority: this.normalizePriority(task.priority),
            dependencies: task.dependencies?.map((i: number) => `task_${i}`) || [],
          })
        ),
      };
    } catch (error) {
      throw new Error(`Failed to parse plan JSON: ${(error as Error).message}`);
    }
  }

  /**
   * Normalize priority value.
   */
  private normalizePriority(priority?: string): 'high' | 'medium' | 'low' {
    const normalized = priority?.toLowerCase();
    if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
      return normalized;
    }
    return 'medium';
  }
}

export default PlanAgent;
