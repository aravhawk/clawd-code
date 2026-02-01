import { EventEmitter } from 'events';
import type { SessionManager } from '../session';
import type { Message } from '../types';

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  result?: string;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Plan {
  id: string;
  goal: string;
  tasks: Task[];
  currentTaskIndex: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface PlannerConfig {
  maxTasks?: number;
  autoExecute?: boolean;
}

/**
 * Task planner that breaks down complex goals into executable steps.
 */
export class Planner extends EventEmitter {
  private plans: Map<string, Plan> = new Map();
  private config: PlannerConfig;

  constructor(config: PlannerConfig = {}) {
    super();
    this.config = {
      maxTasks: config.maxTasks ?? 20,
      autoExecute: config.autoExecute ?? false,
    };
  }

  /**
   * Create a new plan from a goal description.
   */
  createPlan(goal: string, tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]): Plan {
    const now = Date.now();
    const planId = `plan_${now}_${Math.random().toString(36).slice(2, 8)}`;

    const plan: Plan = {
      id: planId,
      goal,
      tasks: tasks.slice(0, this.config.maxTasks).map((task, index) => ({
        ...task,
        id: `task_${planId}_${index}`,
        createdAt: now,
        updatedAt: now,
      })),
      currentTaskIndex: 0,
      status: 'planning',
      createdAt: now,
      updatedAt: now,
    };

    this.plans.set(planId, plan);
    this.emit('planCreated', plan);
    return plan;
  }

  /**
   * Get the next pending task in a plan.
   */
  getNextTask(planId: string): Task | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    // Find first pending task with satisfied dependencies
    for (const task of plan.tasks) {
      if (task.status !== 'pending') continue;

      // Check dependencies
      const dependenciesSatisfied =
        !task.dependencies ||
        task.dependencies.every((depId) => {
          const depTask = plan.tasks.find((t) => t.id === depId);
          return depTask?.status === 'completed';
        });

      if (dependenciesSatisfied) {
        return task;
      }
    }

    return null;
  }

  /**
   * Update a task's status.
   */
  updateTask(planId: string, taskId: string, update: Partial<Task>): Task | null {
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = plan.tasks[taskIndex];
    const updatedTask = {
      ...task,
      ...update,
      updatedAt: Date.now(),
    };

    plan.tasks[taskIndex] = updatedTask;
    plan.updatedAt = Date.now();

    // Update plan status based on tasks
    this.updatePlanStatus(plan);

    this.emit('taskUpdated', { plan, task: updatedTask });
    return updatedTask;
  }

  /**
   * Mark a task as started.
   */
  startTask(planId: string, taskId: string): Task | null {
    return this.updateTask(planId, taskId, { status: 'in_progress' });
  }

  /**
   * Mark a task as completed.
   */
  completeTask(planId: string, taskId: string, result?: string): Task | null {
    return this.updateTask(planId, taskId, { status: 'completed', result });
  }

  /**
   * Mark a task as failed.
   */
  failTask(planId: string, taskId: string, error: string): Task | null {
    return this.updateTask(planId, taskId, { status: 'failed', error });
  }

  /**
   * Get a plan by ID.
   */
  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  /**
   * Get all plans.
   */
  getAllPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Get plan progress as percentage.
   */
  getPlanProgress(planId: string): number {
    const plan = this.plans.get(planId);
    if (!plan || plan.tasks.length === 0) return 0;

    const completed = plan.tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / plan.tasks.length) * 100);
  }

  /**
   * Update plan status based on task states.
   */
  private updatePlanStatus(plan: Plan): void {
    const allCompleted = plan.tasks.every((t) => t.status === 'completed');
    const anyFailed = plan.tasks.some((t) => t.status === 'failed');
    const anyInProgress = plan.tasks.some((t) => t.status === 'in_progress');

    if (allCompleted) {
      plan.status = 'completed';
      this.emit('planCompleted', plan);
    } else if (anyFailed) {
      plan.status = 'failed';
      this.emit('planFailed', plan);
    } else if (anyInProgress) {
      plan.status = 'executing';
    }
  }

  /**
   * Cancel a plan.
   */
  cancelPlan(planId: string): boolean {
    const plan = this.plans.get(planId);
    if (!plan) return false;

    plan.tasks.forEach((task) => {
      if (task.status === 'pending' || task.status === 'in_progress') {
        task.status = 'cancelled';
        task.updatedAt = Date.now();
      }
    });

    plan.status = 'failed';
    plan.updatedAt = Date.now();

    this.emit('planCancelled', plan);
    return true;
  }
}

export default Planner;
