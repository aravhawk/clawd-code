import { BaseSubagent, type SubagentResult, type SubagentConfig } from './base';
import { GlobTool, GrepTool, ReadTool } from '../../tools/builtin';

export class ExploreSubagent extends BaseSubagent {
  constructor(config: SubagentConfig) {
    super(config);
  }

  async execute(task: string): Promise<SubagentResult> {
    try {
      this.addMessage('user', task);

      // Create a specialized tool registry for exploration
      const exploreTools = new this.config.tools.constructor({
        cwd: process.cwd(),
        sessionId: 'explore',
        permissionMode: 'bypassPermissions', // Exploration is read-only
      }) as any;

      const toolContext = exploreTools.getContext();
      exploreTools.register(new GlobTool(toolContext));
      exploreTools.register(new GrepTool(toolContext));
      exploreTools.register(new ReadTool(toolContext));

      // Stream the response
      let output = '';
      const stream = this.config.provider.streamMessage({
        messages: this.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        system: this.getSystemPrompt(),
        maxTokens: this.config.maxTokens,
        tools: exploreTools.getDefinitions(),
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
          subagentType: 'explore',
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
    return `You are an exploration subagent. Your task is to explore codebases and find information.

You have access to:
- Glob: Find files by pattern
- Grep: Search for content in files
- Read: Read file contents

Guidelines:
- Be thorough and systematic in your exploration
- Use Glob to find relevant files first
- Use Grep to search for specific patterns
- Use Read to examine file contents
- Provide clear summaries of what you found

Return a comprehensive report of your findings.`;
  }
}
