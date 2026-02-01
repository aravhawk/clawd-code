import { diffLines, diffWords, Change } from 'diff';

export interface DiffResult {
  added: number;
  removed: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  value: string;
  lineNumber?: number;
}

/**
 * Generate a line-by-line diff between two strings
 */
export function generateLineDiff(oldContent: string, newContent: string): DiffResult {
  const changes = diffLines(oldContent, newContent);
  const result: DiffChange[] = [];
  let added = 0;
  let removed = 0;
  let lineNumber = 1;

  for (const change of changes) {
    if (change.added) {
      added += change.count || 1;
      result.push({
        type: 'add',
        value: change.value,
        lineNumber,
      });
      lineNumber += change.count || 1;
    } else if (change.removed) {
      removed += change.count || 1;
      result.push({
        type: 'remove',
        value: change.value,
        lineNumber,
      });
    } else {
      result.push({
        type: 'unchanged',
        value: change.value,
        lineNumber,
      });
      lineNumber += change.count || 1;
    }
  }

  return { added, removed, changes: result };
}

/**
 * Generate a word-level diff
 */
export function generateWordDiff(oldContent: string, newContent: string): Change[] {
  return diffWords(oldContent, newContent);
}

/**
 * Format diff for terminal display
 */
export function formatDiffForTerminal(diff: DiffResult): string {
  const lines: string[] = [];

  for (const change of diff.changes) {
    const prefix = change.type === 'add' ? '+' : change.type === 'remove' ? '-' : ' ';
    const valueLines = change.value
      .split('\n')
      .filter((l) => l.length > 0 || change.value === '\n');

    for (const line of valueLines) {
      lines.push(`${prefix} ${line}`);
    }
  }

  return lines.join('\n');
}

/**
 * Create a unified diff header
 */
export function createDiffHeader(filePath: string): string {
  return `--- a/${filePath}\n+++ b/${filePath}`;
}
