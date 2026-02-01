import Anthropic from '@anthropic-ai/sdk';
import type { CLIContext } from '../index.js';
import { getApiCredentials } from '../../utils/env.js';

/**
 * Run in non-interactive (print) mode
 * Sends a single prompt and prints the response
 */
export async function runPrint(context: CLIContext): Promise<void> {
  const prompt = context.args.prompt;

  if (!prompt) {
    console.error('Error: No prompt provided for print mode');
    console.error('Usage: clawd -p "your prompt here"');
    process.exit(1);
  }

  const credentials = getApiCredentials();
  if (!credentials) {
    console.error('Error: API key not found. Set CLAWD_API_KEY or ANTHROPIC_API_KEY.');
    process.exit(1);
  }

  const client = new Anthropic({
    apiKey: credentials.apiKey,
    baseURL: credentials.baseUrl,
  });
  const model = context.args.model || 'claude-sonnet-4-20250514';

  try {
    const stream = await client.messages.stream({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    // Stream the response to stdout
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta as { type: string; text?: string };
        if (delta.type === 'text_delta' && delta.text) {
          process.stdout.write(delta.text);
        }
      }
    }

    // Ensure we end with a newline
    console.log('');
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}
