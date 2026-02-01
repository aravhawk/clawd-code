/**
 * Estimate token count for a string
 * Uses a simple heuristic: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Estimate tokens for a message object
 */
export function estimateMessageTokens(message: { role: string; content: unknown }): number {
  const roleTokens = 4; // Approximate for role + formatting
  const content =
    typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  return roleTokens + estimateTokens(content);
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

/**
 * Check if we're approaching token limit
 */
export function isNearLimit(currentTokens: number, maxTokens: number, threshold = 0.9): boolean {
  return currentTokens >= maxTokens * threshold;
}

/**
 * Calculate remaining tokens
 */
export function remainingTokens(currentTokens: number, maxTokens: number): number {
  return Math.max(0, maxTokens - currentTokens);
}
