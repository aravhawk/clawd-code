import { BaseTool } from '../base';
import type { ToolContext, ToolResult } from '../base';

interface QuestionInput {
  question: string;
  options?: string[];
}

export class QuestionTool extends BaseTool {
  name = 'ask_user_question';
  description =
    'Ask the user a question and wait for their response. Use for clarification or confirmation.';
  inputSchema = {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: 'The question to ask the user',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of suggested answers',
      },
    },
    required: ['question'],
  };

  constructor(context: ToolContext) {
    super(context);
  }

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { question, options } = input as QuestionInput;

    // Note: In a full TUI implementation, this would trigger a dialog
    // For now, return a response that explains this would ask the user
    let responseText = `Question for user: ${question}`;

    if (options && options.length > 0) {
      responseText += `\n\nOptions:\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`;
    }

    return {
      success: true,
      content: `${responseText}\n\n[Note: Interactive questions are not yet fully implemented in the TUI. This is a placeholder response.]`,
    };
  }
}
