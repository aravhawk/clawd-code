import { EventEmitter } from 'events';
import type { Planner, Plan, Task } from './planner';
import type { ToolRegistry } from '../tools/registry';
import type { AgentLoop } from './loop';

export interface ExecutorConfig {
  maxConcurrentTasks?: number;
  retryFailedTasks?: boolean;
  maxRetries?: number;
}

export interface TaskExecution {
  taskId: string;
  planId: string;
  startTime: number;
  endTime?: number;
  attempts: number;
  output?: string;
  error?: string;
}

/**
 * Executes tasks from the planner, coordinating with the agent loop.
 */
export class Executor extends EventEmitter {
  private planner: Planner;
  private config: ExecutorConfig;
  private executions: Map<string, TaskExecution> = new Map();
  private isRunning: boolean = false;

  constructor(planner: Planner, config: ExecutorConfig = {}) {
    super();
    this.planner = planner;
    this.config = {
      maxConcurrentTasks: config.maxConcurrentTasks ?? 1,
      retryFailedTasks: config.retryFailedTasks ?? false,
      maxRetries: config.maxRetries ?? 2,
    };
  }

  /**
   * Start executing a plan.
   */
  async executePlan(planId: string, agent: AgentLoop): Promise<void> {
    const plan = this.planner.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    this.isRunning = true;
    this.emit('executionStarted', { planId });

    try {
      while (this.isRunning) {
        const nextTask = this.planner.getNextTask(planId);
        if (!nextTask) {
          // No more tasks to execute
          break;
        }

        await this.executeTask(planId, nextTask, agent);

        // Check if plan is complete or failed
        const updatedPlan = this.planner.getPlan(planId);
        if (updatedPlan?.status === 'completed' || updatedPlan?.status === 'failed') {
          break;
        }
      }
    } finally {
      this.isRunning = false;
      this.emit('executionCompleted', { planId });
    }
  }

  /**
   * Execute a single task.
   */
  private async executeTask(planId: string, task: Task, agent: AgentLoop): Promise<void> {
    const executionId = `${planId}_${task.id}`;
    const execution: TaskExecution = {
      taskId: task.id,
      planId,
      startTime: Date.now(),
      attempts: 0,
    };

    this.executions.set(executionId, execution);
    this.planner.startTask(planId, task.id);
    this.emit('taskStarted', { planId, task });

    try {
      execution.attempts++;

      // Build a prompt for the agent to execute this task
      const taskPrompt = this.buildTaskPrompt(task);

      // Process through the agent loop
      // The agent will use tools to complete the task
      await agent.processUserMessage(taskPrompt);

      // Mark task as completed
      execution.endTime = Date.now();
      this.planner.completeTask(planId, task.id, 'Task completed successfully');
      this.emit('taskCompleted', { planId, task, execution });
    } catch (error) {
      execution.error = (error as Error).message;
      execution.endTime = Date.now();

      // Retry logic
      if (this.config.retryFailedTasks && execution.attempts < (this.config.maxRetries || 2)) {
        this.emit('taskRetrying', { planId, task, attempt: execution.attempts });
        await this.executeTask(planId, task, agent);
      } else {
        this.planner.failTask(planId, task.id, execution.error);
        this.emit('taskFailed', { planId, task, error: execution.error });
      }
    }
  }

  /**
   * Build a prompt for the agent to execute a task.
   */
  private buildTaskPrompt(task: Task): string {
    return `Execute the following task:

**Task:** ${task.description}

**Priority:** ${task.priority}

Please complete this task using the available tools. When finished, summarize what was accomplished.`;
  }

  /**
   * Stop execution.
   */
  stop(): void {
    this.isRunning = false;
    this.emit('executionStopped');
  }

  /**
   * Check if executor is currently running.
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  /**
   * Get execution history for a plan.
   */
  getExecutions(planId: string): TaskExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.planId === planId);
  }

  /**
   * Get execution statistics.
   */
  getStats(planId: string): {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageExecutionTime: number;
  } {
    const executions = this.getExecutions(planId);
    const completedExecutions = executions.filter((e) => e.endTime && !e.error);
    const failedExecutions = executions.filter((e) => e.error);

    const totalTime = completedExecutions.reduce((sum, e) => {
      return sum + ((e.endTime || 0) - e.startTime);
    }, 0);

    return {
      totalTasks: executions.length,
      completedTasks: completedExecutions.length,
      failedTasks: failedExecutions.length,
      averageExecutionTime:
        completedExecutions.length > 0 ? totalTime / completedExecutions.length : 0,
    };
  }
}

export default Executor;
