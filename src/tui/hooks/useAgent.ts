import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnthropicProvider } from '../../providers/anthropic';
import type { ToolRegistry } from '../../tools/registry';
import type { SessionManager } from '../../session';
import type { ContentBlock } from '../../session/types';
import type { ToolUseBlock, ToolResultBlock } from '../../types/message';

export interface UseAgentOptions {
  provider: AnthropicProvider;
  tools: ToolRegistry;
  session: SessionManager;
  systemPrompt: string;
  maxTokens: number;
}

export function useAgent({ provider, tools, session, systemPrompt, maxTokens }: UseAgentOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingPermission, setPendingPermission] = useState<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processMessage = useCallback(
    async (content: string) => {
      if (isProcessing) return;

      setIsProcessing(true);
      setStreamingContent('');

      // Add user message to session
      session.addMessage({
        role: 'user',
        content,
        timestamp: new Date(),
      });

      abortControllerRef.current = new AbortController();

      try {
        let pass = 0;

        while (true) {
          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          if (pass > 0) {
            setStreamingContent('');
          }
          pass += 1;

          const stream = provider.streamMessage({
            messages: session.getMessages().map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            system: systemPrompt,
            maxTokens,
            tools: tools.getDefinitions(),
          });

          let fullResponse = '';
          const toolUses: ToolUseBlock[] = [];

          for await (const event of stream) {
            if (abortControllerRef.current?.signal.aborted) {
              break;
            }

            if (event.type === 'text') {
              fullResponse += event.text;
              setStreamingContent(fullResponse);
            } else if (event.type === 'tool_use') {
              toolUses.push(event.tool);
            }
          }

          if (abortControllerRef.current?.signal.aborted) {
            break;
          }

          if (toolUses.length === 0) {
            session.addMessage({
              role: 'assistant',
              content: fullResponse || 'No response',
            });
            break;
          }

          const assistantBlocks: ContentBlock[] = [];
          if (fullResponse.trim()) {
            assistantBlocks.push({ type: 'text', text: fullResponse });
          }
          assistantBlocks.push(...toolUses);

          session.addMessage({
            role: 'assistant',
            content: assistantBlocks,
          });

          const toolResults: ToolResultBlock[] = [];

          for (const toolUse of toolUses) {
            const result = await tools.executeToolUse(toolUse);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content:
                typeof result.content === 'string'
                  ? result.content
                  : JSON.stringify(result.content),
              is_error: !result.success,
            });
          }

          session.addMessage({
            role: 'user',
            content: toolResults,
          });
        }
      } catch (error) {
        console.error('Agent error:', error);
        session.addMessage({
          role: 'assistant',
          content: `Error: ${(error as Error).message}`,
        });
      } finally {
        setIsProcessing(false);
        setStreamingContent('');
        abortControllerRef.current = null;
      }
    },
    [isProcessing, provider, session, systemPrompt, maxTokens, tools]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  }, []);

  const resolvePermission = useCallback(
    (granted: boolean, session = false) => {
      if (pendingPermission) {
        if (session) {
          // Allow for entire session
          // Would add to allowlist
        }
        pendingPermission.resolve(granted);
        setPendingPermission(null);
      }
    },
    [pendingPermission]
  );

  return {
    isProcessing,
    streamingContent,
    pendingPermission,
    processMessage,
    abort,
    resolvePermission,
  };
}
