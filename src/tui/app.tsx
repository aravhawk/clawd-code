import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { AppProps } from './types';
import { useAgent } from './hooks/useAgent';
import { PermissionDialog } from './components/permission';
import { CommandRegistry } from '../commands';
import type { ToolUseBlock } from '../types/message';
import type { ContentBlock, Message as SessionMessage } from '../session/types';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function App({ initialPrompt, debugMode = false, provider, tools, session }: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [pendingPermission, setPendingPermission] = useState<{
    tool: ToolUseBlock;
    resolve: (granted: boolean, session?: boolean) => void;
  } | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Clear messages handler for commands
  const clearMessagesHandler = useCallback(() => {
    setMessages([]);
  }, []);

  // Set input handler for commands
  const setInputHandler = useCallback((input: string) => {
    setCurrentInput(input);
    setCursorPosition(input.length);
  }, []);

  // Initialize command registry
  const commandRegistry = useMemo(() => {
    return new CommandRegistry({
      session,
      exit,
      setInput: setInputHandler,
      clearMessages: clearMessagesHandler,
      setDebugMode: () => {}, // Could be implemented later
    });
  }, [session, exit, setInputHandler, clearMessagesHandler]);

  // Initialize agent hook
  const agent = useAgent({
    provider,
    tools,
    session,
    systemPrompt: `You are Clawd Code, an advanced agentic coding assistant built as a Claude Code clone.

You help users with software engineering tasks including:
- Writing, reading, editing, and analyzing code
- Running commands and tests
- Searching codebases
- Debugging and problem-solving

You have access to various tools to interact with the filesystem and execute commands.
Use tools proactively when needed to complete tasks.

Be concise and focused. Avoid unsolicited advice or lectures.
Prioritize code and practical solutions over theoretical explanations.`,
    maxTokens: 8192,
  });

  // Handle permission requests from agent
  useEffect(() => {
    if (agent.pendingPermission && !showPermissionDialog) {
      setPendingPermission(agent.pendingPermission);
      setShowPermissionDialog(true);
    } else if (!agent.pendingPermission && showPermissionDialog) {
      setShowPermissionDialog(false);
      setPendingPermission(null);
    }
  }, [agent.pendingPermission, showPermissionDialog]);

  // Sync messages from session to display
  useEffect(() => {
    const sessionMessages = session.getMessages();
    const displayMessages: DisplayMessage[] = [];

    const renderContentBlocks = (blocks: ContentBlock[], role: DisplayMessage['role']) => {
      const text = blocks
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .filter((value): value is string => typeof value === 'string')
        .join('\n');

      const toolUses = blocks.filter((block) => block.type === 'tool_use');
      const toolResults = blocks.filter((block) => block.type === 'tool_result');

      if (text) {
        displayMessages.push({ role, content: text });
      }

      if (!text && toolUses.length > 0) {
        const toolNames = toolUses
          .map((tool) => ('name' in tool ? tool.name : undefined))
          .filter((name): name is string => typeof name === 'string');
        if (toolNames.length > 0) {
          displayMessages.push({
            role: 'assistant',
            content: `Using tool: ${toolNames.join(', ')}`,
          });
        }
      }

      if (toolResults.length > 0) {
        const toolOutput = toolResults
          .map((result) => ('content' in result ? result.content : undefined))
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
          .join('\n');

        if (toolOutput) {
          displayMessages.push({
            role: 'assistant',
            content:
              toolResults.length > 1
                ? `Tool results:\n${toolOutput}`
                : `Tool result:\n${toolOutput}`,
          });
        }
      }
    };

    for (const msg of sessionMessages as SessionMessage[]) {
      const role = msg.role as 'user' | 'assistant';
      if (typeof msg.content === 'string') {
        displayMessages.push({ role, content: msg.content });
      } else {
        renderContentBlocks(msg.content as ContentBlock[], role);
      }
    }

    setMessages(displayMessages);
  }, [agent.isProcessing, session]);

  // Handle keyboard input
  useInput((input, key) => {
    // Don't handle input when permission dialog is shown (it handles its own input)
    if (showPermissionDialog) {
      if (key.ctrl && input === 'c') {
        exit();
      }
      return;
    }

    if (agent.isProcessing) {
      // Allow Ctrl+C to abort when processing
      if (key.ctrl && input === 'c') {
        agent.abort();
      }
      return;
    }

    if (key.return) {
      if (currentInput.trim()) {
        handleSubmit(currentInput);
        setCurrentInput('');
        setCursorPosition(0);
      }
    } else if (key.ctrl && input === 'c') {
      exit();
    } else if (key.ctrl && input === 'u') {
      // Clear line
      setCurrentInput('');
      setCursorPosition(0);
    } else if (key.ctrl && input === 'w') {
      // Delete word
      const words = currentInput.slice(0, cursorPosition).split(/\s+/);
      const lastWord = words[words.length - 1];
      const newCursorPos = cursorPosition - lastWord.length - (words.length > 1 ? 1 : 0);
      setCurrentInput(currentInput.slice(0, newCursorPos) + currentInput.slice(cursorPosition));
      setCursorPosition(Math.max(0, newCursorPos));
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        setCurrentInput(
          currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition)
        );
        setCursorPosition(cursorPosition - 1);
      }
    } else if (key.leftArrow) {
      setCursorPosition(Math.max(0, cursorPosition - 1));
    } else if (key.rightArrow) {
      setCursorPosition(Math.min(currentInput.length, cursorPosition + 1));
    } else if (input && !key.ctrl && !key.meta) {
      // Regular character input
      setCurrentInput(
        currentInput.slice(0, cursorPosition) + input + currentInput.slice(cursorPosition)
      );
      setCursorPosition(cursorPosition + 1);
    }
  });

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      handleSubmit(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim() || agent.isProcessing) return;

      // Check if it's a command
      const isCommand = await commandRegistry.execute(text);
      if (isCommand) {
        // Command was executed, sync messages from session
        const sessionMessages = session.getMessages() as SessionMessage[];
        const displayMessages: DisplayMessage[] = sessionMessages.map((msg: SessionMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content:
            typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2),
        }));
        setMessages(displayMessages);
        return;
      }

      // Regular message, process through agent
      await agent.processMessage(text);
    },
    [agent, commandRegistry, session]
  );

  // Display message with streaming content
  const displayContent = agent.streamingContent || '';

  // Permission dialog handlers
  const handleAllowPermission = useCallback(() => {
    if (pendingPermission) {
      agent.resolvePermission(true);
    }
  }, [pendingPermission, agent]);

  const handleDenyPermission = useCallback(() => {
    if (pendingPermission) {
      agent.resolvePermission(false);
    }
  }, [pendingPermission, agent]);

  const handleAllowSessionPermission = useCallback(() => {
    if (pendingPermission) {
      agent.resolvePermission(true, true);
    }
  }, [pendingPermission, agent]);

  return (
    <Box flexDirection="column" height="100%">
      {/* Message display area */}
      <Box flexGrow={1} flexDirection="column" paddingX={1} paddingBottom={1}>
        {messages.length === 0 && !agent.isProcessing && (
          <Box>
            <Text dimColor>
              Welcome to Clawd Code! Type a message to get started, or press Ctrl+C to exit.
            </Text>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box key={i} marginBottom={1} flexDirection="column">
            <Box>
              <Text bold color={msg.role === 'user' ? 'cyan' : 'magenta'}>
                {msg.role === 'user' ? 'You' : 'Clawd'}
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text>{msg.content}</Text>
            </Box>
          </Box>
        ))}

        {/* Show streaming response */}
        {agent.isProcessing && displayContent && (
          <Box marginBottom={1} flexDirection="column">
            <Box>
              <Text bold color="magenta">
                Clawd
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text>{displayContent}</Text>
            </Box>
          </Box>
        )}

        {agent.isProcessing && !displayContent && (
          <Box>
            <Text dimColor>Thinking...</Text>
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
        <Box>
          <Text color={agent.isProcessing ? 'gray' : 'white'}>
            {agent.isProcessing ? 'Processing...' : '> '}
          </Text>
          <Text color={agent.isProcessing ? 'gray' : 'white'}>{currentInput}</Text>
          <Text color={agent.isProcessing ? 'gray' : 'white'}>{'▋'}</Text>
        </Box>
      </Box>

      {/* Status bar */}
      <Box>
        <Text dimColor>
          {agent.isProcessing
            ? 'Press Ctrl+C to abort'
            : 'Ctrl+C: Exit | Ctrl+U: Clear | Ctrl+W: Delete word'}
        </Text>
      </Box>

      {/* Debug mode info */}
      {debugMode && (
        <Box borderStyle="single" borderColor="blue" padding={1} marginTop={1}>
          <Text dimColor>
            Session: {session.currentId || 'N/A'} | Messages: {messages.length} | Processing:{' '}
            {agent.isProcessing ? 'Yes' : 'No'}
          </Text>
        </Box>
      )}

      {/* Permission dialog overlay */}
      {showPermissionDialog && pendingPermission && (
        <Box marginTop={1} alignItems="center" justifyContent="center">
          <PermissionDialog
            toolName={pendingPermission.tool.name}
            toolInput={pendingPermission.tool.input}
            onAllow={handleAllowPermission}
            onDeny={handleDenyPermission}
            onAllowSession={handleAllowSessionPermission}
          />
        </Box>
      )}
    </Box>
  );
}
