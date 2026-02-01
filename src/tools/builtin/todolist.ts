import { BaseTool } from '../base';
import type { ToolContext, ToolResult } from '../base';

// Simple in-memory task list storage
const taskLists = new Map<string, Array<{ id: string; subject: string; completed: boolean }>>();

interface TodoWriteInput {
  subject: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

interface TodoReadInput {
  status?: 'pending' | 'in_progress' | 'completed';
}

export class TodoWriteTool extends BaseTool {
  name = 'TodoWrite';
  description = 'Create or update tasks in a task list to track progress during a session.';
  inputSchema = {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'A short description of the task to be completed',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed'],
        description: 'The status of the task',
        default: 'pending',
      },
    },
    required: ['subject'],
  };

  constructor(context: ToolContext) {
    super(context);
  }

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { subject, status = 'pending' } = input as TodoWriteInput;
    const sessionId = this.context.sessionId;

    if (!taskLists.has(sessionId)) {
      taskLists.set(sessionId, []);
    }

    const list = taskLists.get(sessionId)!;
    const taskId = `${list.length + 1}`;

    const task = {
      id: taskId,
      subject,
      completed: status === 'completed',
    };

    list.push(task);

    return {
      success: true,
      content: `Created task ${taskId}: "${subject}" with status "${status}"`,
    };
  }
}

export class TodoReadTool extends BaseTool {
  name = 'TodoRead';
  description = 'Read the current task list. Use this to see all tasks and their status.';
  inputSchema = {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed'],
        description: 'Filter tasks by status (optional)',
      },
    },
  };

  constructor(context: ToolContext) {
    super(context);
  }

  async execute(input: unknown): Promise<ToolResult> {
    this.validateInput(input);
    const { status } = input as TodoReadInput;
    const sessionId = this.context.sessionId;

    const list = taskLists.get(sessionId) || [];

    let filteredList = list;
    if (status) {
      const statusMap = {
        pending: false,
        in_progress: false,
        completed: true,
      };
      filteredList = list.filter(
        (t) => t.completed === statusMap[status as keyof typeof statusMap]
      );
    }

    if (filteredList.length === 0) {
      return {
        success: true,
        content: status
          ? `No tasks with status "${status}"`
          : 'No tasks in the list. Use TodoWrite to create tasks.',
      };
    }

    const output = filteredList
      .map((t) => {
        const statusStr = t.completed ? '[x]' : '[ ]';
        return `${statusStr} ${t.id}. ${t.subject}`;
      })
      .join('\n');

    return {
      success: true,
      content: `Task list:\n${output}`,
    };
  }
}
