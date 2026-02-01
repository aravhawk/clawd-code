import { BaseSubagent, type SubagentResult, type SubagentConfig } from './base';

export class GeneralSubagent extends BaseSubagent {
  constructor(config: SubagentConfig) {
    super(config);
  }

  async execute(task: string): Promise<SubagentResult> {
    try {
      this.addMessage('user', task);

      // Stream the response
      let output = '';
      const stream = this.config.provider.streamMessage({
        messages: this.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        system: this.getSystemPrompt(),
        maxTokens: this.config.maxTokens,
        tools: this.config.tools.getDefinitions(),
      });

      for await (const event of stream) {
        if (event.type === 'text') {
          output += event.text;
        }
      }

      this.addMessage('assistant', output);

      return {
        success: true,
        output,
        metadata: {
          subagentType: 'general',
          messages: this.messages.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: (error as Error).message,
      };
    }
  }

  private getSystemPrompt(): string {
    return `You are a general-purpose subagent working on a specific task.

You have access to various tools for file operations, code execution, and more.

Guidelines:
- Focus on completing the specific task you were given
- Be concise and direct in your responses
- Use tools proactively when needed
- Return clear results when done

Report back with your findings or results when the task is complete.`;
  }
}
