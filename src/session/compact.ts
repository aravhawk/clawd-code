import type { Message } from './types';

export interface CompactOptions {
  maxTokens?: number;
  keepRecent?: number;
  summarizeOld?: boolean;
}

export interface CompactResult {
  messages: Message[];
  originalCount: number;
  compactedCount: number;
  tokensSaved: number;
}

export function estimateTokens(message: Message): number {
  const content =
    typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);
  return Math.ceil(content.length / 4);
}

export function estimateTotalTokens(messages: Message[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg), 0);
}

export function compactMessages(
  messages: Message[],
  options: CompactOptions = {},
): CompactResult {
  const {
    maxTokens = 50000,
    keepRecent = 10,
    summarizeOld = true,
  } = options;

  const originalCount = messages.length;
  const originalTokens = estimateTotalTokens(messages);

  // If we're under the token limit, no compaction needed
  if (originalTokens <= maxTokens && messages.length <= keepRecent * 2) {
    return {
      messages,
      originalCount,
      compactedCount: originalCount,
      tokensSaved: 0,
    };
  }

  const result: Message[] = [];

  // Always keep system messages (if any)
  const systemMessages = messages.filter((m) => m.role === 'system');
  result.push(...systemMessages);

  // Keep the most recent messages
  const recentMessages = messages.slice(-keepRecent);
  result.push(...recentMessages);

  // Summarize older messages if requested
  if (summarizeOld && messages.length > keepRecent + systemMessages.length) {
    const oldMessages = messages.slice(
      systemMessages.length,
      -keepRecent,
    );

    if (oldMessages.length > 0) {
      const summary = createSummary(oldMessages);
      result.unshift({
        role: 'system',
        content: `[Previous conversation summary]:\n${summary}`,
        timestamp: new Date(),
      });
    }
  }

  const compactedTokens = estimateTotalTokens(result);

  return {
    messages: result,
    originalCount,
    compactedCount: result.length,
    tokensSaved: originalTokens - compactedTokens,
  };
}

function createSummary(messages: Message[]): string {
  // Simple summary based on message types and content
  let summary = '';
  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  summary += `Conversation included ${userMessages.length} user messages and ${assistantMessages.length} assistant responses.\n`;

  // Extract key topics from user messages (very basic)
  const topics = userMessages
    .map((m) => {
      const content = typeof m.content === 'string' ? m.content : '';
      return content.split('\n')[0]?.slice(0, 50);
    })
    .filter(Boolean)
    .slice(0, 3);

  if (topics.length > 0) {
    summary += '\nTopics discussed:\n';
    topics.forEach((t) => {
      summary += `- ${t}...\n`;
    });
  }

  return summary;
}
