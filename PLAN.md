# CLAWD CODE: COMPREHENSIVE IMPLEMENTATION PLAN

---

## **CRITICAL: HOW TO USE THIS DOCUMENT**

> **1. Read the PRD and progress file.**
> **2. Find the next incomplete task and implement it.**
> **3. Commit your changes.**
> **4. Update progress.txt with what you did.**
> **5. ONLY DO ONE TASK AT A TIME.**

---

# EXECUTIVE SUMMARY

**Project Name:** Clawd Code  
**Tagline:** "An agentic coding tool that lives in your terminal"  
**Tech Stack:** TypeScript, Ink (React for CLI), Anthropic SDK  
**Target:** Full feature parity with Claude Code  
**License:** MIT (recommended for open-source adoption)

---

# PART I: ARCHITECTURAL FOUNDATION

## 1. HIGH-LEVEL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLAWD CODE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   CLI Layer  │  │   TUI Layer  │  │  Agent Core  │  │  Tool System │    │
│  │   (yargs)    │  │    (Ink)     │  │   (LLM Loop) │  │  (Executor)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │                 │            │
│         └────────────────┬┴─────────────────┴─────────────────┘            │
│                          │                                                  │
│  ┌───────────────────────▼───────────────────────────────────────────────┐ │
│  │                      APPLICATION CORE                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Session   │  │  Permission │  │   Config    │  │    Hooks    │   │ │
│  │  │   Manager   │  │   System    │  │   Loader    │  │   Engine    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│  ┌───────────────────────▼───────────────────────────────────────────────┐ │
│  │                      PROVIDER LAYER                                    │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │  Anthropic  │  │     MCP     │  │  File I/O   │  │   Process   │   │ │
│  │  │     SDK     │  │   Client    │  │   Manager   │  │   Spawner   │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                          │                                                  │
│  ┌───────────────────────▼───────────────────────────────────────────────┐ │
│  │                      DATA LAYER                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   SQLite    │  │   Session   │  │  Settings   │  │   Secrets   │   │ │
│  │  │   Store     │  │  Transcripts│  │    JSON     │  │   Keychain  │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. DIRECTORY STRUCTURE

```
clawd-code/
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── vitest.config.ts
├── README.md
├── LICENSE.md
├── CHANGELOG.md
│
├── bin/
│   └── clawd.ts                    # Entry point executable
│
├── src/
│   ├── index.ts                    # Main application bootstrap
│   │
│   ├── cli/                        # Command Line Interface Layer
│   │   ├── index.ts                # CLI entry point
│   │   ├── commands/
│   │   │   ├── index.ts            # Command registry
│   │   │   ├── run.ts              # Default interactive REPL
│   │   │   ├── print.ts            # Non-interactive mode (-p)
│   │   │   ├── update.ts           # Self-update command
│   │   │   ├── mcp/
│   │   │   │   ├── index.ts
│   │   │   │   ├── add.ts
│   │   │   │   ├── remove.ts
│   │   │   │   ├── list.ts
│   │   │   │   └── serve.ts
│   │   │   └── config.ts           # Configuration management
│   │   ├── flags.ts                # CLI flag definitions
│   │   └── parser.ts               # Argument parsing utilities
│   │
│   ├── tui/                        # Terminal User Interface (Ink)
│   │   ├── index.tsx               # TUI entry point
│   │   ├── app.tsx                 # Root application component
│   │   │
│   │   ├── components/
│   │   │   ├── core/
│   │   │   │   ├── Box.tsx         # Extended Box component
│   │   │   │   ├── Text.tsx        # Styled text component
│   │   │   │   ├── Spinner.tsx     # Loading spinner
│   │   │   │   └── Divider.tsx     # Visual separator
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── MessageList.tsx     # Conversation display
│   │   │   │   ├── Message.tsx         # Individual message
│   │   │   │   ├── UserMessage.tsx     # User input message
│   │   │   │   ├── AssistantMessage.tsx # Claude response
│   │   │   │   ├── ToolMessage.tsx     # Tool execution display
│   │   │   │   └── StreamingMessage.tsx # Live streaming text
│   │   │   │
│   │   │   ├── input/
│   │   │   │   ├── PromptInput.tsx     # Main text input
│   │   │   │   ├── MultiLineEditor.tsx # Multi-line editing
│   │   │   │   ├── CommandPalette.tsx  # Slash command picker
│   │   │   │   └── Autocomplete.tsx    # File/command autocomplete
│   │   │   │
│   │   │   ├── permission/
│   │   │   │   ├── PermissionDialog.tsx    # Permission request
│   │   │   │   ├── ToolApproval.tsx        # Tool-specific approval
│   │   │   │   └── DiffViewer.tsx          # File diff display
│   │   │   │
│   │   │   ├── session/
│   │   │   │   ├── SessionPicker.tsx   # Session list dialog
│   │   │   │   ├── SessionInfo.tsx     # Current session display
│   │   │   │   └── SessionActions.tsx  # Session management
│   │   │   │
│   │   │   ├── status/
│   │   │   │   ├── StatusBar.tsx       # Bottom status bar
│   │   │   │   ├── TokenCounter.tsx    # Token usage display
│   │   │   │   ├── CostDisplay.tsx     # API cost tracker
│   │   │   │   └── ModelIndicator.tsx  # Current model display
│   │   │   │
│   │   │   └── modals/
│   │   │       ├── HelpModal.tsx       # Keyboard shortcuts
│   │   │       ├── SettingsModal.tsx   # Settings editor
│   │   │       ├── ModelPicker.tsx     # Model selection
│   │   │       └── LogsViewer.tsx      # Debug logs viewer
│   │   │
│   │   ├── hooks/
│   │   │   ├── useInput.ts             # Input handling
│   │   │   ├── useApp.ts               # App-level state
│   │   │   ├── useSession.ts           # Session management
│   │   │   ├── useAgent.ts             # Agent loop control
│   │   │   ├── usePermissions.ts       # Permission state
│   │   │   ├── useKeyboard.ts          # Keyboard shortcuts
│   │   │   └── useTerminal.ts          # Terminal dimensions
│   │   │
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx          # Primary layout
│   │   │   ├── CompactLayout.tsx       # Minimal layout
│   │   │   └── SplitLayout.tsx         # Side-by-side layout
│   │   │
│   │   ├── themes/
│   │   │   ├── index.ts                # Theme system
│   │   │   ├── default.ts              # Default theme
│   │   │   └── types.ts                # Theme type definitions
│   │   │
│   │   └── context/
│   │       ├── AppContext.tsx          # Global app context
│   │       ├── SessionContext.tsx      # Session context
│   │       └── ThemeContext.tsx        # Theme context
│   │
│   ├── agent/                      # Agent Core (LLM Loop)
│   │   ├── index.ts                # Agent exports
│   │   ├── loop.ts                 # Main agentic loop
│   │   ├── planner.ts              # Task planning
│   │   ├── executor.ts             # Task execution
│   │   │
│   │   ├── subagents/
│   │   │   ├── index.ts            # Subagent registry
│   │   │   ├── base.ts             # Base subagent class
│   │   │   ├── explore.ts          # Codebase exploration
│   │   │   ├── plan.ts             # Planning agent
│   │   │   ├── general.ts          # General-purpose agent
│   │   │   └── loader.ts           # Custom subagent loader
│   │   │
│   │   └── prompts/
│   │       ├── system.ts           # System prompts
│   │       ├── templates.ts        # Prompt templates
│   │       └── builder.ts          # Dynamic prompt builder
│   │
│   ├── tools/                      # Tool System
│   │   ├── index.ts                # Tool registry
│   │   ├── base.ts                 # Base tool interface
│   │   ├── executor.ts             # Tool execution engine
│   │   │
│   │   ├── builtin/
│   │   │   ├── index.ts            # Built-in tool exports
│   │   │   ├── bash.ts             # Shell command execution
│   │   │   ├── read.ts             # File reading
│   │   │   ├── write.ts            # File writing
│   │   │   ├── edit.ts             # File editing (diff-based)
│   │   │   ├── glob.ts             # File pattern matching
│   │   │   ├── grep.ts             # Content search
│   │   │   ├── ls.ts               # Directory listing
│   │   │   ├── webfetch.ts         # URL fetching
│   │   │   ├── websearch.ts        # Web search
│   │   │   ├── task.ts             # Subagent spawning
│   │   │   ├── todowrite.ts        # Task list management
│   │   │   ├── todoread.ts         # Task list reading
│   │   │   └── question.ts         # User interaction
│   │   │
│   │   └── validation/
│   │       ├── schema.ts           # JSON schema validation
│   │       ├── sanitize.ts         # Input sanitization
│   │       └── security.ts         # Security checks
│   │
│   ├── mcp/                        # Model Context Protocol
│   │   ├── index.ts                # MCP exports
│   │   ├── client.ts               # MCP client implementation
│   │   ├── server.ts               # MCP server mode
│   │   ├── registry.ts             # Server registry
│   │   │
│   │   ├── transports/
│   │   │   ├── stdio.ts            # Stdio transport
│   │   │   ├── http.ts             # HTTP transport
│   │   │   └── sse.ts              # Server-Sent Events
│   │   │
│   │   └── types/
│   │       ├── protocol.ts         # Protocol types
│   │       ├── tools.ts            # Tool definitions
│   │       └── resources.ts        # Resource types
│   │
│   ├── hooks/                      # Lifecycle Hooks System
│   │   ├── index.ts                # Hooks exports
│   │   ├── engine.ts               # Hook execution engine
│   │   ├── loader.ts               # Hook configuration loader
│   │   ├── types.ts                # Hook type definitions
│   │   │
│   │   └── events/
│   │       ├── sessionStart.ts     # Session start hooks
│   │       ├── sessionEnd.ts       # Session end hooks
│   │       ├── preToolUse.ts       # Pre-tool execution
│   │       ├── postToolUse.ts      # Post-tool execution
│   │       ├── permissionRequest.ts # Permission hooks
│   │       ├── userPromptSubmit.ts # Prompt submission
│   │       └── stop.ts             # Agent stop hooks
│   │
│   ├── permissions/                # Permission System
│   │   ├── index.ts                # Permission exports
│   │   ├── manager.ts              # Permission management
│   │   ├── rules.ts                # Permission rules
│   │   ├── modes.ts                # Permission modes
│   │   ├── allowlist.ts            # Allowed tools/commands
│   │   └── types.ts                # Permission types
│   │
│   ├── session/                    # Session Management
│   │   ├── index.ts                # Session exports
│   │   ├── manager.ts              # Session lifecycle
│   │   ├── storage.ts              # Session persistence
│   │   ├── transcript.ts           # Conversation transcripts
│   │   ├── compact.ts              # Context compaction
│   │   └── types.ts                # Session types
│   │
│   ├── config/                     # Configuration System
│   │   ├── index.ts                # Config exports
│   │   ├── loader.ts               # Configuration loading
│   │   ├── schema.ts               # Config validation schema
│   │   ├── defaults.ts             # Default values
│   │   ├── merge.ts                # Config merging logic
│   │   │
│   │   ├── sources/
│   │   │   ├── user.ts             # ~/.clawd/settings.json
│   │   │   ├── project.ts          # .clawd/settings.json
│   │   │   ├── local.ts            # .clawd/settings.local.json
│   │   │   └── managed.ts          # System-wide managed settings
│   │   │
│   │   └── types.ts                # Configuration types
│   │
│   ├── providers/                  # LLM Provider Layer
│   │   ├── index.ts                # Provider exports
│   │   ├── anthropic.ts            # Anthropic Claude integration
│   │   ├── streaming.ts            # Streaming response handler
│   │   └── types.ts                # Provider types
│   │
│   ├── skills/                     # Skills System
│   │   ├── index.ts                # Skills exports
│   │   ├── loader.ts               # Skill file loader
│   │   ├── parser.ts               # Markdown frontmatter parser
│   │   ├── executor.ts             # Skill execution
│   │   │
│   │   └── builtin/
│   │       ├── index.ts            # Built-in skills
│   │       ├── frontend-design.ts  # Frontend design skill
│   │       └── code-review.ts      # Code review skill
│   │
│   ├── commands/                   # Slash Commands
│   │   ├── index.ts                # Command registry
│   │   ├── parser.ts               # Command parsing
│   │   │
│   │   └── builtin/
│   │       ├── help.ts             # /help
│   │       ├── compact.ts          # /compact
│   │       ├── clear.ts            # /clear
│   │       ├── permissions.ts      # /permissions
│   │       ├── mcp.ts              # /mcp
│   │       ├── bug.ts              # /bug
│   │       ├── model.ts            # /model
│   │       ├── resume.ts           # /resume
│   │       └── agents.ts           # /agents
│   │
│   ├── storage/                    # Data Storage Layer
│   │   ├── index.ts                # Storage exports
│   │   ├── sqlite.ts               # SQLite database
│   │   ├── keychain.ts             # Secure credential storage
│   │   ├── files.ts                # File system operations
│   │   │
│   │   ├── migrations/
│   │   │   ├── index.ts            # Migration runner
│   │   │   ├── 001_initial.ts      # Initial schema
│   │   │   └── 002_sessions.ts     # Session tables
│   │   │
│   │   └── paths.ts                # Path resolution utilities
│   │
│   ├── utils/                      # Shared Utilities
│   │   ├── index.ts                # Utility exports
│   │   ├── logger.ts               # Logging system
│   │   ├── errors.ts               # Error handling
│   │   ├── tokens.ts               # Token counting
│   │   ├── diff.ts                 # Diff generation
│   │   ├── markdown.ts             # Markdown parsing
│   │   ├── git.ts                  # Git operations
│   │   ├── platform.ts             # Platform detection
│   │   └── env.ts                  # Environment variables
│   │
│   └── types/                      # Global Type Definitions
│       ├── index.ts                # Type exports
│       ├── message.ts              # Message types
│       ├── tool.ts                 # Tool types
│       ├── session.ts              # Session types
│       └── config.ts               # Configuration types
│
├── tests/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── scripts/
│   ├── build.ts                    # Build script
│   ├── install.sh                  # Unix installation
│   ├── install.ps1                 # Windows installation
│   └── publish.ts                  # NPM publishing
│
└── examples/
    ├── hooks/                      # Example hook scripts
    ├── skills/                     # Example skills
    ├── agents/                     # Example subagents
    └── mcp/                        # Example MCP servers
```

---

# PART II: CORE SYSTEMS DEEP DIVE

## 3. AGENT LOOP ARCHITECTURE

The heart of Clawd Code is the **agentic loop** - a state machine that orchestrates LLM calls, tool execution, and user interaction.

### 3.1 Agent Loop State Machine

```
                                    ┌───────────────┐
                                    │    START      │
                                    └───────┬───────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  WAIT_INPUT   │◄──────────────────┐
                                    └───────┬───────┘                   │
                                            │ User submits prompt       │
                                            ▼                           │
                                    ┌───────────────┐                   │
                           ┌────────│ PRE_PROCESS   │                   │
                           │        └───────┬───────┘                   │
                           │                │ Run UserPromptSubmit      │
                           │                │ hooks                     │
                           │                ▼                           │
                           │        ┌───────────────┐                   │
                           │        │   LLM_CALL    │                   │
                           │        └───────┬───────┘                   │
                           │                │ Stream response           │
                           │                ▼                           │
                           │        ┌───────────────┐                   │
                           │        │ PARSE_RESPONSE│                   │
                           │        └───────┬───────┘                   │
                           │                │                           │
                           │        ┌───────┴───────┐                   │
                           │        ▼               ▼                   │
                           │  ┌──────────┐   ┌──────────┐               │
                           │  │TEXT_ONLY │   │TOOL_USE  │               │
                           │  └────┬─────┘   └────┬─────┘               │
                           │       │              │                     │
                           │       │              ▼                     │
                           │       │       ┌───────────────┐            │
                           │       │       │ PRE_TOOL_HOOK │            │
                           │       │       └───────┬───────┘            │
                           │       │               │                    │
                           │       │       ┌───────┴───────┐            │
                           │       │       ▼               ▼            │
                           │       │  ┌─────────┐   ┌───────────┐       │
                           │       │  │APPROVED │   │PERMISSION │       │
                           │       │  └────┬────┘   │ REQUEST   │       │
                           │       │       │        └─────┬─────┘       │
                           │       │       │              │             │
                           │       │       │        ┌─────┴─────┐       │
                           │       │       │        ▼           ▼       │
                           │       │       │  ┌────────┐  ┌────────┐    │
                           │       │       │  │GRANTED │  │DENIED  │    │
                           │       │       │  └───┬────┘  └───┬────┘    │
                           │       │       │      │           │         │
                           │       │       ▼      ▼           │         │
                           │       │   ┌───────────────┐      │         │
                           │       │   │ EXECUTE_TOOL  │      │         │
                           │       │   └───────┬───────┘      │         │
                           │       │           │              │         │
                           │       │           ▼              │         │
                           │       │   ┌───────────────┐      │         │
                           │       │   │POST_TOOL_HOOK │      │         │
                           │       │   └───────┬───────┘      │         │
                           │       │           │              │         │
                           │       │           └──────────────┤         │
                           │       │                          │         │
                           │       ▼                          ▼         │
                           │  ┌───────────────┐       ┌───────────────┐ │
                           │  │   RUN_STOP    │       │  TOOL_RESULT  │ │
                           │  │    HOOKS      │       │    TO_LLM     │─┘
                           │  └───────┬───────┘       └───────────────┘
                           │          │                       ▲
                           │  ┌───────┴───────┐               │
                           │  ▼               ▼               │
                           │ ┌────────┐  ┌─────────────┐      │
                           │ │COMPLETE│  │CONTINUE_LOOP│──────┘
                           │ └───┬────┘  └─────────────┘
                           │     │
                           │     ▼
                           │ ┌───────────────┐
                           └►│   WAIT_INPUT   │
                             └───────────────┘
```

### 3.2 Agent Loop Implementation

```typescript
// src/agent/loop.ts

import { EventEmitter } from 'events';
import { AnthropicProvider } from '../providers/anthropic';
import { ToolRegistry } from '../tools';
import { HooksEngine } from '../hooks';
import { PermissionManager } from '../permissions';
import { SessionManager } from '../session';

export interface AgentLoopConfig {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  tools: ToolDefinition[];
  permissions: PermissionManager;
  hooks: HooksEngine;
  session: SessionManager;
}

export type AgentState =
  | 'idle'
  | 'processing'
  | 'streaming'
  | 'tool_pending'
  | 'permission_pending'
  | 'executing_tool'
  | 'stopping';

export interface AgentLoopEvents {
  stateChange: (state: AgentState) => void;
  textDelta: (text: string) => void;
  toolStart: (tool: ToolUseBlock) => void;
  toolEnd: (tool: ToolUseBlock, result: ToolResult) => void;
  permissionRequest: (request: PermissionRequest) => void;
  error: (error: Error) => void;
  complete: () => void;
}

export class AgentLoop extends EventEmitter {
  private state: AgentState = 'idle';
  private provider: AnthropicProvider;
  private toolRegistry: ToolRegistry;
  private hooks: HooksEngine;
  private permissions: PermissionManager;
  private session: SessionManager;
  private abortController: AbortController | null = null;
  
  constructor(config: AgentLoopConfig) {
    super();
    this.provider = new AnthropicProvider(config.model);
    this.toolRegistry = new ToolRegistry(config.tools);
    this.hooks = config.hooks;
    this.permissions = config.permissions;
    this.session = config.session;
  }

  async processUserMessage(content: string): Promise<void> {
    // 1. Run UserPromptSubmit hooks
    const hookResult = await this.hooks.run('UserPromptSubmit', {
      prompt: content,
      sessionId: this.session.currentId,
    });
    
    if (hookResult.decision === 'block') {
      this.emit('error', new Error(hookResult.reason));
      return;
    }

    // Add any context from hooks
    const contextEnhancedContent = hookResult.additionalContext 
      ? `${content}\n\n[Context: ${hookResult.additionalContext}]`
      : content;

    // 2. Add message to session
    this.session.addMessage({
      role: 'user',
      content: contextEnhancedContent,
    });

    // 3. Enter agentic loop
    await this.runLoop();
  }

  private async runLoop(): Promise<void> {
    this.setState('processing');
    
    while (this.state !== 'idle') {
      try {
        // Get LLM response
        const response = await this.getLLMResponse();
        
        // Check for tool use
        const toolUseBlocks = response.content.filter(
          (block) => block.type === 'tool_use'
        );

        if (toolUseBlocks.length === 0) {
          // Text-only response - run stop hooks and complete
          const stopResult = await this.runStopHooks();
          if (stopResult.decision === 'block') {
            // Continue loop with stop hook reason
            this.session.addMessage({
              role: 'user',
              content: `[System: ${stopResult.reason}]`,
            });
            continue;
          }
          this.setState('idle');
          this.emit('complete');
          break;
        }

        // Process each tool use
        const toolResults = await this.processToolUses(toolUseBlocks);
        
        // Add assistant message and tool results to session
        this.session.addMessage({
          role: 'assistant',
          content: response.content,
        });
        
        this.session.addMessage({
          role: 'user',
          content: toolResults,
        });

        // Continue loop for next LLM response
      } catch (error) {
        this.emit('error', error as Error);
        this.setState('idle');
        break;
      }
    }
  }

  private async getLLMResponse(): Promise<MessageResponse> {
    this.setState('streaming');
    
    const stream = this.provider.streamMessage({
      messages: this.session.getMessages(),
      tools: this.toolRegistry.getDefinitions(),
      maxTokens: this.config.maxTokens,
      systemPrompt: this.buildSystemPrompt(),
    });

    let fullResponse: MessageResponse | null = null;
    
    for await (const event of stream) {
      if (event.type === 'text') {
        this.emit('textDelta', event.text);
      } else if (event.type === 'message') {
        fullResponse = event.message;
      }
    }

    return fullResponse!;
  }

  private async processToolUses(
    toolUseBlocks: ToolUseBlock[]
  ): Promise<ToolResultContent[]> {
    const results: ToolResultContent[] = [];

    for (const toolUse of toolUseBlocks) {
      // 1. Run PreToolUse hooks
      const preHookResult = await this.hooks.run('PreToolUse', {
        toolName: toolUse.name,
        toolInput: toolUse.input,
        toolUseId: toolUse.id,
      });

      if (preHookResult.permissionDecision === 'deny') {
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Tool denied: ${preHookResult.permissionDecisionReason}`,
          is_error: true,
        });
        continue;
      }

      // 2. Check permissions
      let needsPermission = this.permissions.needsApproval(toolUse);
      
      if (preHookResult.permissionDecision === 'allow') {
        needsPermission = false;
      } else if (preHookResult.permissionDecision === 'ask') {
        needsPermission = true;
      }

      if (needsPermission) {
        this.setState('permission_pending');
        const granted = await this.requestPermission(toolUse);
        
        if (!granted) {
          results.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: 'Permission denied by user',
            is_error: true,
          });
          continue;
        }
      }

      // 3. Execute tool
      this.setState('executing_tool');
      this.emit('toolStart', toolUse);
      
      const tool = this.toolRegistry.get(toolUse.name);
      const input = preHookResult.updatedInput || toolUse.input;
      
      let result: ToolResult;
      try {
        result = await tool.execute(input);
      } catch (error) {
        result = {
          success: false,
          content: `Tool execution failed: ${(error as Error).message}`,
        };
      }

      // 4. Run PostToolUse hooks
      const postHookResult = await this.hooks.run('PostToolUse', {
        toolName: toolUse.name,
        toolInput: input,
        toolResponse: result,
        toolUseId: toolUse.id,
      });

      this.emit('toolEnd', toolUse, result);

      // 5. Build tool result
      let content = result.content;
      if (postHookResult.additionalContext) {
        content += `\n\n[Hook feedback: ${postHookResult.additionalContext}]`;
      }

      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content,
        is_error: !result.success,
      });
    }

    return results;
  }

  private async requestPermission(toolUse: ToolUseBlock): Promise<boolean> {
    return new Promise((resolve) => {
      const request: PermissionRequest = {
        id: crypto.randomUUID(),
        toolUse,
        resolve,
      };
      this.emit('permissionRequest', request);
    });
  }

  private async runStopHooks(): Promise<HookResult> {
    return this.hooks.run('Stop', {
      sessionId: this.session.currentId,
      stopHookActive: false,
    });
  }

  abort(): void {
    this.abortController?.abort();
    this.setState('idle');
  }

  private setState(state: AgentState): void {
    this.state = state;
    this.emit('stateChange', state);
  }
}
```

---

## 4. TOOL SYSTEM ARCHITECTURE

### 4.1 Tool Base Interface

```typescript
// src/tools/base.ts

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface ToolResult {
  success: boolean;
  content: string | object;
  metadata?: Record<string, unknown>;
}

export interface ToolContext {
  cwd: string;
  sessionId: string;
  permissionMode: PermissionMode;
}

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract inputSchema: JSONSchema;
  
  protected context: ToolContext;
  
  constructor(context: ToolContext) {
    this.context = context;
  }

  abstract execute(input: unknown): Promise<ToolResult>;
  
  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
    };
  }

  protected validateInput(input: unknown): void {
    // JSON schema validation
  }
}
```

### 4.2 Built-in Tools

#### Bash Tool
```typescript
// src/tools/builtin/bash.ts

import { spawn } from 'child_process';
import { BaseTool, ToolResult } from '../base';

export class BashTool extends BaseTool {
  name = 'Bash';
  description = `Execute shell commands in the terminal. Use for running scripts, installing packages, building projects, and system operations. Commands run in the project directory.`;
  
  inputSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
      description: {
        type: 'string',
        description: 'Brief description of what this command does',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 120000)',
      },
      workdir: {
        type: 'string',
        description: 'Working directory for the command',
      },
    },
    required: ['command', 'description'],
  };

  async execute(input: BashInput): Promise<ToolResult> {
    const { command, timeout = 120000, workdir } = input;
    const cwd = workdir || this.context.cwd;

    return new Promise((resolve) => {
      const child = spawn('bash', ['-c', command], {
        cwd,
        timeout,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');
        
        resolve({
          success: code === 0,
          content: this.truncateOutput(output),
          metadata: {
            exitCode: code,
            truncated: output.length > 51200,
          },
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          content: `Command failed: ${error.message}`,
        });
      });
    });
  }

  private truncateOutput(output: string): string {
    const MAX_BYTES = 51200;
    const MAX_LINES = 2000;
    
    const lines = output.split('\n');
    if (lines.length > MAX_LINES) {
      return lines.slice(0, MAX_LINES).join('\n') + 
        `\n\n[Output truncated: ${lines.length} lines total]`;
    }
    
    if (output.length > MAX_BYTES) {
      return output.slice(0, MAX_BYTES) + 
        `\n\n[Output truncated: ${output.length} bytes total]`;
    }
    
    return output;
  }
}
```

#### Edit Tool
```typescript
// src/tools/builtin/edit.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseTool, ToolResult } from '../base';

export class EditTool extends BaseTool {
  name = 'Edit';
  description = `Perform exact string replacements in files. The oldString must match exactly, including whitespace and indentation. For new files, use the Write tool instead.`;

  inputSchema = {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: 'Absolute path to the file to modify',
      },
      oldString: {
        type: 'string',
        description: 'The exact text to replace',
      },
      newString: {
        type: 'string',
        description: 'The text to replace it with',
      },
      replaceAll: {
        type: 'boolean',
        description: 'Replace all occurrences (default: false)',
      },
    },
    required: ['filePath', 'oldString', 'newString'],
  };

  async execute(input: EditInput): Promise<ToolResult> {
    const { filePath, oldString, newString, replaceAll = false } = input;

    // Security: Validate path is within allowed directories
    if (!this.isPathAllowed(filePath)) {
      return {
        success: false,
        content: `Path not allowed: ${filePath}`,
      };
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if oldString exists
      if (!content.includes(oldString)) {
        return {
          success: false,
          content: 'oldString not found in file content',
        };
      }

      // Check for multiple matches if not replaceAll
      if (!replaceAll) {
        const matches = content.split(oldString).length - 1;
        if (matches > 1) {
          return {
            success: false,
            content: `oldString found ${matches} times. Provide more context to uniquely identify the match, or use replaceAll: true`,
          };
        }
      }

      // Perform replacement
      const newContent = replaceAll 
        ? content.replaceAll(oldString, newString)
        : content.replace(oldString, newString);

      await fs.writeFile(filePath, newContent, 'utf-8');

      return {
        success: true,
        content: `Successfully edited ${filePath}`,
        metadata: {
          filePath,
          bytesWritten: newContent.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        content: `Edit failed: ${(error as Error).message}`,
      };
    }
  }

  private isPathAllowed(filePath: string): boolean {
    // Must be absolute path
    if (!path.isAbsolute(filePath)) return false;
    
    // Must be within project directory or below
    const projectDir = this.context.cwd;
    const resolvedPath = path.resolve(filePath);
    
    return resolvedPath.startsWith(projectDir);
  }
}
```

---

## 5. TERMINAL USER INTERFACE (TUI)

### 5.1 Main Application Component

```tsx
// src/tui/app.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdin } from 'ink';
import { MainLayout } from './layouts/MainLayout';
import { MessageList } from './components/chat/MessageList';
import { PromptInput } from './components/input/PromptInput';
import { StatusBar } from './components/status/StatusBar';
import { PermissionDialog } from './components/permission/PermissionDialog';
import { HelpModal } from './components/modals/HelpModal';
import { SessionPicker } from './components/session/SessionPicker';
import { CommandPalette } from './components/input/CommandPalette';
import { useAgent } from './hooks/useAgent';
import { useSession } from './hooks/useSession';
import { useKeyboard } from './hooks/useKeyboard';
import { AppContext, AppContextType } from './context/AppContext';

export interface AppProps {
  initialPrompt?: string;
  continueSession?: boolean;
  resumeSessionId?: string;
  debugMode?: boolean;
}

export function App({ 
  initialPrompt, 
  continueSession,
  resumeSessionId,
  debugMode = false,
}: AppProps) {
  const { exit } = useApp();
  
  // Application state
  const [showHelp, setShowHelp] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [verboseMode, setVerboseMode] = useState(false);
  
  // Core hooks
  const session = useSession({ continueSession, resumeSessionId });
  const agent = useAgent({ session });

  // Keyboard shortcuts
  useKeyboard({
    onEscape: () => {
      if (showHelp) setShowHelp(false);
      else if (showSessionPicker) setShowSessionPicker(false);
      else if (showCommandPalette) setShowCommandPalette(false);
      else if (agent.isProcessing) agent.abort();
    },
    onHelp: () => setShowHelp(true),
    onSessionPicker: () => setShowSessionPicker(true),
    onVerbose: () => setVerboseMode((v) => !v),
    onClear: () => session.clear(),
    onNewSession: () => session.create(),
    onAbort: () => agent.abort(),
  });

  // Handle prompt submission
  const handleSubmit = useCallback(async (text: string) => {
    if (text.startsWith('/')) {
      // Handle slash command
      await handleSlashCommand(text);
    } else {
      // Regular message
      await agent.processMessage(text);
    }
  }, [agent]);

  // Handle slash commands
  const handleSlashCommand = async (text: string) => {
    const [command, ...args] = text.slice(1).split(' ');
    
    switch (command) {
      case 'help':
        setShowHelp(true);
        break;
      case 'clear':
        session.clear();
        break;
      case 'compact':
        await session.compact();
        break;
      case 'mcp':
        // Show MCP management
        break;
      case 'permissions':
        // Show permissions
        break;
      // ... more commands
    }
  };

  // Process initial prompt
  useEffect(() => {
    if (initialPrompt && session.isReady) {
      handleSubmit(initialPrompt);
    }
  }, [initialPrompt, session.isReady]);

  // Context value
  const contextValue: AppContextType = {
    session,
    agent,
    debugMode,
    verboseMode,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <MainLayout>
        {/* Message display area */}
        <Box flexGrow={1} flexDirection="column" overflowY="scroll">
          <MessageList 
            messages={session.messages}
            streamingContent={agent.streamingContent}
            isLoading={agent.isProcessing}
          />
        </Box>

        {/* Permission dialog (overlay) */}
        {agent.pendingPermission && (
          <PermissionDialog
            request={agent.pendingPermission}
            onAllow={() => agent.resolvePermission(true)}
            onDeny={() => agent.resolvePermission(false)}
            onAllowSession={() => agent.resolvePermission(true, true)}
          />
        )}

        {/* Input area */}
        <Box flexDirection="column" borderStyle="round" borderColor="gray">
          <PromptInput
            onSubmit={handleSubmit}
            disabled={agent.isProcessing}
            placeholder={agent.isProcessing ? 'Processing...' : 'Message Clawd...'}
            onSlashCommand={() => setShowCommandPalette(true)}
          />
        </Box>

        {/* Status bar */}
        <StatusBar
          model={agent.model}
          tokens={agent.tokenUsage}
          cost={agent.totalCost}
          sessionName={session.name}
        />

        {/* Modals */}
        {showHelp && (
          <HelpModal onClose={() => setShowHelp(false)} />
        )}
        {showSessionPicker && (
          <SessionPicker
            sessions={session.allSessions}
            onSelect={(id) => {
              session.resume(id);
              setShowSessionPicker(false);
            }}
            onClose={() => setShowSessionPicker(false)}
          />
        )}
        {showCommandPalette && (
          <CommandPalette
            onSelect={handleSlashCommand}
            onClose={() => setShowCommandPalette(false)}
          />
        )}
      </MainLayout>
    </AppContext.Provider>
  );
}
```

### 5.2 Message Components

```tsx
// src/tui/components/chat/StreamingMessage.tsx

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Spinner } from '../core/Spinner';

interface StreamingMessageProps {
  content: string;
  toolUse?: ToolUseBlock;
  isComplete: boolean;
}

export function StreamingMessage({ 
  content, 
  toolUse, 
  isComplete 
}: StreamingMessageProps) {
  const formattedContent = useMemo(() => {
    return <MarkdownRenderer content={content} />;
  }, [content]);

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Role indicator */}
      <Box>
        <Text bold color="magenta">Clawd</Text>
        {!isComplete && <Spinner />}
      </Box>

      {/* Message content */}
      <Box marginLeft={2} flexDirection="column">
        {formattedContent}
        
        {/* Cursor animation for streaming */}
        {!isComplete && (
          <Text dimColor>▋</Text>
        )}
      </Box>

      {/* Tool use indicator */}
      {toolUse && (
        <Box marginTop={1} marginLeft={2} borderStyle="single" padding={1}>
          <Text dimColor>
            Using tool: <Text bold>{toolUse.name}</Text>
          </Text>
        </Box>
      )}
    </Box>
  );
}
```

### 5.3 Permission Dialog

```tsx
// src/tui/components/permission/PermissionDialog.tsx

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { DiffViewer } from './DiffViewer';

interface PermissionDialogProps {
  request: PermissionRequest;
  onAllow: () => void;
  onDeny: () => void;
  onAllowSession: () => void;
}

export function PermissionDialog({
  request,
  onAllow,
  onDeny,
  onAllowSession,
}: PermissionDialogProps) {
  const [selectedOption, setSelectedOption] = useState(0);
  
  const options = [
    { key: 'a', label: 'Allow', action: onAllow },
    { key: 'A', label: 'Allow for session', action: onAllowSession },
    { key: 'd', label: 'Deny', action: onDeny },
  ];

  useInput((input, key) => {
    if (key.leftArrow || input === 'h') {
      setSelectedOption((i) => Math.max(0, i - 1));
    } else if (key.rightArrow || input === 'l' || key.tab) {
      setSelectedOption((i) => Math.min(options.length - 1, i + 1));
    } else if (key.return || input === ' ') {
      options[selectedOption].action();
    } else {
      // Check for hotkey
      const option = options.find((o) => o.key === input);
      if (option) option.action();
    }
  });

  const { toolUse } = request;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      padding={1}
      marginY={1}
    >
      {/* Header */}
      <Box>
        <Text bold color="yellow">
          Permission Required
        </Text>
      </Box>

      {/* Tool info */}
      <Box marginTop={1} flexDirection="column">
        <Text>
          Clawd wants to use <Text bold color="cyan">{toolUse.name}</Text>
        </Text>
        
        {/* Tool-specific display */}
        {toolUse.name === 'Bash' && (
          <Box marginTop={1} paddingX={2}>
            <Text color="gray">$ </Text>
            <Text>{(toolUse.input as BashInput).command}</Text>
          </Box>
        )}
        
        {toolUse.name === 'Edit' && (
          <DiffViewer
            filePath={(toolUse.input as EditInput).filePath}
            oldString={(toolUse.input as EditInput).oldString}
            newString={(toolUse.input as EditInput).newString}
          />
        )}
        
        {toolUse.name === 'Write' && (
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Writing to: </Text>
            <Text>{(toolUse.input as WriteInput).filePath}</Text>
          </Box>
        )}
      </Box>

      {/* Options */}
      <Box marginTop={1} gap={2}>
        {options.map((option, index) => (
          <Box key={option.key}>
            <Text
              inverse={selectedOption === index}
              color={selectedOption === index ? 'white' : 'gray'}
            >
              {` [${option.key}] ${option.label} `}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
```

---

## 6. PERMISSION SYSTEM

### 6.1 Permission Modes

```typescript
// src/permissions/modes.ts

export type PermissionMode = 
  | 'default'      // Standard permission checking with prompts
  | 'plan'         // Read-only mode, denies all modifications
  | 'acceptEdits'  // Auto-accept file edits, prompt for commands
  | 'dontAsk'      // Auto-deny anything not pre-approved
  | 'bypassPermissions'; // Skip all permission checks (dangerous)

export interface PermissionRule {
  tool: string;        // Tool name pattern (e.g., "Bash", "Bash(git:*)")
  allow?: boolean;     // Explicit allow/deny
  requiresApproval?: boolean; // Requires user confirmation
  allowedPatterns?: string[]; // Command patterns to auto-approve
  deniedPatterns?: string[];  // Command patterns to always deny
}

export interface PermissionConfig {
  mode: PermissionMode;
  allow: PermissionRule[];
  deny: PermissionRule[];
}
```

### 6.2 Permission Manager

```typescript
// src/permissions/manager.ts

import { PermissionMode, PermissionRule, PermissionConfig } from './modes';
import { minimatch } from 'minimatch';

export class PermissionManager {
  private config: PermissionConfig;
  private sessionAllowlist: Set<string> = new Set();

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  needsApproval(toolUse: ToolUseBlock): boolean {
    const { name, input } = toolUse;

    // Check session allowlist first
    const toolSignature = this.getToolSignature(name, input);
    if (this.sessionAllowlist.has(toolSignature)) {
      return false;
    }

    // Check permission mode
    switch (this.config.mode) {
      case 'bypassPermissions':
        return false;
      
      case 'plan':
        // Only allow read-only tools
        return !this.isReadOnlyTool(name);
      
      case 'acceptEdits':
        // Auto-approve Edit and Write, prompt for Bash
        if (name === 'Edit' || name === 'Write') return false;
        break;
      
      case 'dontAsk':
        // Auto-deny if not in explicit allowlist
        return true;
    }

    // Check explicit deny rules
    for (const rule of this.config.deny) {
      if (this.matchesRule(rule, name, input)) {
        return true; // Must deny
      }
    }

    // Check explicit allow rules
    for (const rule of this.config.allow) {
      if (this.matchesRule(rule, name, input)) {
        return false; // Pre-approved
      }
    }

    // Default: requires approval
    return true;
  }

  allowForSession(toolUse: ToolUseBlock): void {
    const signature = this.getToolSignature(toolUse.name, toolUse.input);
    this.sessionAllowlist.add(signature);
  }

  private matchesRule(
    rule: PermissionRule, 
    name: string, 
    input: unknown
  ): boolean {
    // Parse rule pattern: "Bash(git:*)" -> { tool: "Bash", pattern: "git:*" }
    const { tool, pattern } = this.parseToolPattern(rule.tool);
    
    if (!minimatch(name, tool)) return false;
    
    if (pattern && name === 'Bash') {
      const command = (input as BashInput).command;
      return minimatch(command, pattern);
    }
    
    return true;
  }

  private parseToolPattern(pattern: string): { tool: string; pattern?: string } {
    const match = pattern.match(/^(\w+)(?:\((.+)\))?$/);
    if (match) {
      return { tool: match[1], pattern: match[2] };
    }
    return { tool: pattern };
  }

  private getToolSignature(name: string, input: unknown): string {
    if (name === 'Bash') {
      return `Bash:${(input as BashInput).command}`;
    }
    return name;
  }

  private isReadOnlyTool(name: string): boolean {
    const readOnlyTools = ['Read', 'Glob', 'Grep', 'Ls', 'WebFetch', 'WebSearch'];
    return readOnlyTools.includes(name);
  }
}
```

---

## 7. MCP (MODEL CONTEXT PROTOCOL) INTEGRATION

### 7.1 MCP Client Implementation

```typescript
// src/mcp/client.ts

import { EventEmitter } from 'events';
import { StdioTransport } from './transports/stdio';
import { HttpTransport } from './transports/http';
import { SSETransport } from './transports/sse';

export interface MCPServerConfig {
  name: string;
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export class MCPClient extends EventEmitter {
  private config: MCPServerConfig;
  private transport: StdioTransport | HttpTransport | SSETransport;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private connected = false;

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
    this.transport = this.createTransport();
  }

  private createTransport() {
    switch (this.config.type) {
      case 'stdio':
        return new StdioTransport(
          this.config.command!,
          this.config.args,
          this.config.env
        );
      case 'http':
        return new HttpTransport(
          this.config.url!,
          this.config.headers
        );
      case 'sse':
        return new SSETransport(
          this.config.url!,
          this.config.headers
        );
    }
  }

  async connect(): Promise<void> {
    await this.transport.connect();
    
    // Initialize handshake
    const initResponse = await this.transport.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      clientInfo: {
        name: 'clawd-code',
        version: '1.0.0',
      },
    });

    // Notify initialized
    await this.transport.notify('initialized', {});

    // Discover available tools and resources
    await this.discoverTools();
    await this.discoverResources();
    
    this.connected = true;
    this.emit('connected');
  }

  private async discoverTools(): Promise<void> {
    const response = await this.transport.request('tools/list', {});
    
    for (const tool of response.tools) {
      this.tools.set(tool.name, {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      });
    }
  }

  private async discoverResources(): Promise<void> {
    const response = await this.transport.request('resources/list', {});
    
    for (const resource of response.resources) {
      this.resources.set(resource.uri, {
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      });
    }
  }

  async callTool(name: string, arguments_: unknown): Promise<unknown> {
    const response = await this.transport.request('tools/call', {
      name,
      arguments: arguments_,
    });
    
    return response.content;
  }

  async readResource(uri: string): Promise<string> {
    const response = await this.transport.request('resources/read', {
      uri,
    });
    
    return response.contents[0]?.text ?? '';
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
    this.connected = false;
    this.emit('disconnected');
  }
}
```

### 7.2 MCP Registry

```typescript
// src/mcp/registry.ts

import { MCPClient, MCPServerConfig } from './client';
import { ConfigLoader } from '../config/loader';

export class MCPRegistry {
  private clients: Map<string, MCPClient> = new Map();
  private config: ConfigLoader;

  constructor(config: ConfigLoader) {
    this.config = config;
  }

  async loadServers(): Promise<void> {
    const mcpConfig = this.config.getMCPServers();
    
    for (const [name, serverConfig] of Object.entries(mcpConfig)) {
      await this.addServer(name, serverConfig);
    }
  }

  async addServer(name: string, config: MCPServerConfig): Promise<void> {
    const client = new MCPClient({ ...config, name });
    
    try {
      await client.connect();
      this.clients.set(name, client);
    } catch (error) {
      console.error(`Failed to connect to MCP server ${name}:`, error);
    }
  }

  removeServer(name: string): void {
    const client = this.clients.get(name);
    if (client) {
      client.disconnect();
      this.clients.delete(name);
    }
  }

  getAllTools(): { serverName: string; tool: MCPTool }[] {
    const tools: { serverName: string; tool: MCPTool }[] = [];
    
    for (const [serverName, client] of this.clients) {
      for (const tool of client.getTools()) {
        tools.push({
          serverName,
          tool: {
            ...tool,
            // Prefix tool name with server: mcp__server__tool
            name: `mcp__${serverName}__${tool.name}`,
          },
        });
      }
    }
    
    return tools;
  }

  async callTool(
    fullName: string, 
    arguments_: unknown
  ): Promise<unknown> {
    // Parse: mcp__server__tool
    const match = fullName.match(/^mcp__(.+?)__(.+)$/);
    if (!match) {
      throw new Error(`Invalid MCP tool name: ${fullName}`);
    }
    
    const [, serverName, toolName] = match;
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }
    
    return client.callTool(toolName, arguments_);
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.values())
      .map((client) => client.disconnect());
    
    await Promise.all(promises);
    this.clients.clear();
  }
}
```

---

## 8. HOOKS SYSTEM

### 8.1 Hook Engine

```typescript
// src/hooks/engine.ts

import { spawn } from 'child_process';
import { HookConfig, HookEvent, HookResult, HookInput } from './types';

export class HooksEngine {
  private hooks: Map<HookEvent, HookConfig[]> = new Map();

  constructor() {
    // Initialize empty hooks for all events
    const events: HookEvent[] = [
      'SessionStart', 'SessionEnd', 'UserPromptSubmit',
      'PreToolUse', 'PostToolUse', 'PermissionRequest',
      'Stop', 'SubagentStart', 'SubagentStop', 'PreCompact',
      'Notification', 'Setup',
    ];
    
    events.forEach((event) => this.hooks.set(event, []));
  }

  loadFromConfig(config: Record<HookEvent, HookConfig[]>): void {
    for (const [event, hooks] of Object.entries(config)) {
      this.hooks.set(event as HookEvent, hooks);
    }
  }

  async run(event: HookEvent, input: HookInput): Promise<HookResult> {
    const configs = this.hooks.get(event) || [];
    const results: HookResult[] = [];

    // Find matching hooks
    const matchingHooks = this.findMatchingHooks(configs, event, input);

    // Execute hooks in parallel
    const promises = matchingHooks.flatMap((config) =>
      config.hooks.map((hook) => this.executeHook(hook, input))
    );

    const hookResults = await Promise.all(promises);
    
    // Merge results
    return this.mergeResults(hookResults);
  }

  private findMatchingHooks(
    configs: HookConfig[], 
    event: HookEvent,
    input: HookInput
  ): HookConfig[] {
    return configs.filter((config) => {
      if (!config.matcher) return true;
      
      // Match against tool name for tool-related events
      if ('toolName' in input) {
        const regex = new RegExp(`^(${config.matcher})$`);
        return regex.test(input.toolName);
      }
      
      // Match against notification type
      if ('notificationType' in input && event === 'Notification') {
        return config.matcher === input.notificationType;
      }
      
      return true;
    });
  }

  private async executeHook(
    hook: { type: string; command?: string; prompt?: string; timeout?: number },
    input: HookInput
  ): Promise<HookResult> {
    const timeout = hook.timeout ?? 60000;

    if (hook.type === 'command') {
      return this.executeCommandHook(hook.command!, input, timeout);
    } else if (hook.type === 'prompt') {
      return this.executePromptHook(hook.prompt!, input, timeout);
    }

    return { ok: true };
  }

  private async executeCommandHook(
    command: string,
    input: HookInput,
    timeout: number
  ): Promise<HookResult> {
    return new Promise((resolve) => {
      const child = spawn('bash', ['-c', command], {
        timeout,
        env: {
          ...process.env,
          CLAUDE_PROJECT_DIR: input.cwd,
        },
      });

      // Send input as JSON to stdin
      child.stdin.write(JSON.stringify(input));
      child.stdin.end();

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          // Try to parse JSON output
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed);
          } catch {
            resolve({ ok: true, additionalContext: stdout });
          }
        } else if (code === 2) {
          // Exit code 2 = blocking error
          resolve({ ok: false, reason: stderr, decision: 'block' });
        } else {
          // Other exit codes = non-blocking error
          resolve({ ok: true });
        }
      });

      child.on('error', () => {
        resolve({ ok: true });
      });
    });
  }

  private async executePromptHook(
    prompt: string,
    input: HookInput,
    timeout: number
  ): Promise<HookResult> {
    // Use fast LLM (Haiku) for prompt-based hooks
    const client = new Anthropic();
    
    const fullPrompt = prompt.includes('$ARGUMENTS')
      ? prompt.replace('$ARGUMENTS', JSON.stringify(input))
      : `${prompt}\n\nInput: ${JSON.stringify(input)}`;

    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    try {
      const text = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
      return JSON.parse(text);
    } catch {
      return { ok: true };
    }
  }

  private mergeResults(results: HookResult[]): HookResult {
    // If any result blocks, the overall result blocks
    const blocking = results.find((r) => r.decision === 'block' || !r.ok);
    if (blocking) {
      return blocking;
    }

    // Merge additional context
    const contexts = results
      .map((r) => r.additionalContext)
      .filter(Boolean);

    // Merge permission decisions (deny > ask > allow)
    const decisions = results.map((r) => r.permissionDecision).filter(Boolean);
    let permissionDecision: 'allow' | 'deny' | 'ask' | undefined;
    
    if (decisions.includes('deny')) permissionDecision = 'deny';
    else if (decisions.includes('ask')) permissionDecision = 'ask';
    else if (decisions.includes('allow')) permissionDecision = 'allow';

    return {
      ok: true,
      additionalContext: contexts.length > 0 ? contexts.join('\n') : undefined,
      permissionDecision,
    };
  }
}
```

---

## 9. SESSION MANAGEMENT

### 9.1 Session Manager

```typescript
// src/session/manager.ts

import { v4 as uuidv4 } from 'uuid';
import { SessionStorage } from './storage';
import { TranscriptManager } from './transcript';
import { Compactor } from './compact';
import { Message, Session, SessionConfig } from './types';

export class SessionManager {
  private storage: SessionStorage;
  private transcript: TranscriptManager;
  private compactor: Compactor;
  
  private currentSession: Session | null = null;
  private messages: Message[] = [];
  private tokenUsage = 0;

  constructor(config: SessionConfig) {
    this.storage = new SessionStorage(config.dataDir);
    this.transcript = new TranscriptManager(config.transcriptDir);
    this.compactor = new Compactor(config.compactThreshold);
  }

  get currentId(): string | null {
    return this.currentSession?.id ?? null;
  }

  get name(): string {
    return this.currentSession?.name ?? 'New Session';
  }

  get isReady(): boolean {
    return this.currentSession !== null;
  }

  async create(name?: string): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      name: name ?? `Session ${new Date().toLocaleString()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectPath: process.cwd(),
    };

    await this.storage.save(session);
    this.currentSession = session;
    this.messages = [];
    this.tokenUsage = 0;

    return session;
  }

  async resume(sessionId: string): Promise<Session | null> {
    const session = await this.storage.load(sessionId);
    if (!session) return null;

    this.currentSession = session;
    this.messages = await this.transcript.load(sessionId);
    
    // Calculate token usage from messages
    this.tokenUsage = this.calculateTokens(this.messages);

    return session;
  }

  async loadMostRecent(): Promise<Session | null> {
    const sessions = await this.storage.list(process.cwd());
    if (sessions.length === 0) return null;

    // Sort by updatedAt descending
    sessions.sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );

    return this.resume(sessions[0].id);
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.tokenUsage += this.estimateTokens(message);
    
    // Persist to transcript
    this.transcript.append(this.currentSession!.id, message);

    // Check if compaction needed
    if (this.compactor.needsCompaction(this.tokenUsage)) {
      this.autoCompact();
    }
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  async clear(): Promise<void> {
    if (this.currentSession) {
      // Create new session, keep the old one for history
      await this.create();
    }
  }

  async compact(customInstructions?: string): Promise<void> {
    if (!this.currentSession) return;

    const summary = await this.compactor.compact(
      this.messages,
      customInstructions
    );

    // Create compaction boundary in transcript
    this.transcript.addCompactionBoundary(
      this.currentSession.id,
      this.tokenUsage
    );

    // Replace messages with summary
    this.messages = [
      {
        role: 'user',
        content: `[Previous conversation summary: ${summary}]`,
      },
    ];

    this.tokenUsage = this.calculateTokens(this.messages);
  }

  private async autoCompact(): Promise<void> {
    await this.compact();
  }

  async getAllSessions(): Promise<Session[]> {
    return this.storage.list(process.cwd());
  }

  private estimateTokens(message: Message): number {
    // Rough estimation: ~4 characters per token
    const content = typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);
    return Math.ceil(content.length / 4);
  }

  private calculateTokens(messages: Message[]): number {
    return messages.reduce((sum, m) => sum + this.estimateTokens(m), 0);
  }
}
```

---

## 10. CONFIGURATION SYSTEM

### 10.1 Config Loader

```typescript
// src/config/loader.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { deepMerge } from './merge';
import { validateConfig } from './schema';
import { ClawdConfig, defaultConfig } from './defaults';

export class ConfigLoader {
  private config: ClawdConfig;
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
    this.config = { ...defaultConfig };
  }

  async load(): Promise<ClawdConfig> {
    // Load in order of precedence (later overrides earlier)
    const sources = [
      // 1. Default config
      defaultConfig,
      // 2. User-level settings
      await this.loadUserConfig(),
      // 3. Project settings
      await this.loadProjectConfig(),
      // 4. Local settings (not committed)
      await this.loadLocalConfig(),
      // 5. Managed settings (enterprise)
      await this.loadManagedConfig(),
    ];

    // Merge all configurations
    this.config = sources.reduce(
      (merged, source) => deepMerge(merged, source),
      {} as ClawdConfig
    );

    // Validate final config
    validateConfig(this.config);

    return this.config;
  }

  private async loadUserConfig(): Promise<Partial<ClawdConfig>> {
    const userDir = this.getUserConfigDir();
    return this.loadJsonFile(path.join(userDir, 'settings.json'));
  }

  private async loadProjectConfig(): Promise<Partial<ClawdConfig>> {
    return this.loadJsonFile(
      path.join(this.projectPath, '.clawd', 'settings.json')
    );
  }

  private async loadLocalConfig(): Promise<Partial<ClawdConfig>> {
    return this.loadJsonFile(
      path.join(this.projectPath, '.clawd', 'settings.local.json')
    );
  }

  private async loadManagedConfig(): Promise<Partial<ClawdConfig>> {
    const managedPath = this.getManagedConfigPath();
    return this.loadJsonFile(managedPath);
  }

  private async loadJsonFile(filePath: string): Promise<Partial<ClawdConfig>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private getUserConfigDir(): string {
    const xdgConfig = process.env.XDG_CONFIG_HOME;
    if (xdgConfig) {
      return path.join(xdgConfig, 'clawd');
    }
    return path.join(process.env.HOME!, '.clawd');
  }

  private getManagedConfigPath(): string {
    switch (process.platform) {
      case 'darwin':
        return '/Library/Application Support/ClawdCode/managed-settings.json';
      case 'win32':
        return 'C:\\Program Files\\ClawdCode\\managed-settings.json';
      default:
        return '/etc/clawd-code/managed-settings.json';
    }
  }

  getApiKey(): string {
    return (
      process.env.ANTHROPIC_API_KEY ??
      this.config.providers?.anthropic?.apiKey ??
      ''
    );
  }

  getModel(): string {
    return this.config.model ?? 'claude-sonnet-4-20250514';
  }

  getMCPServers(): Record<string, MCPServerConfig> {
    return this.config.mcpServers ?? {};
  }

  getHooks(): Record<string, HookConfig[]> {
    return this.config.hooks ?? {};
  }

  getPermissions(): PermissionConfig {
    return this.config.permissions ?? { mode: 'default', allow: [], deny: [] };
  }
}
```

---

# PART III: IMPLEMENTATION TASKS

## PHASE 1: FOUNDATION

### 1.1 Project Setup & Core Infrastructure
- [ ] Initialize TypeScript project with strict configuration
- [ ] Set up build system (esbuild for fast builds)
- [ ] Configure ESLint, Prettier, and pre-commit hooks
- [ ] Set up Vitest for testing
- [ ] Create CLI entry point with yargs
- [ ] Implement basic configuration loader
- [ ] Set up logging system

### 1.2 Basic TUI Implementation
- [ ] Install and configure Ink
- [ ] Create core components (Box, Text, Spinner)
- [ ] Implement MainLayout
- [ ] Create PromptInput component with multi-line support
- [ ] Build MessageList and Message components
- [ ] Implement basic keyboard handling
- [ ] Add StatusBar component

### 1.3 Anthropic Integration
- [ ] Integrate Anthropic TypeScript SDK
- [ ] Implement streaming message handling
- [ ] Build tool use parsing
- [ ] Create message history management
- [ ] Implement token counting
- [ ] Add cost tracking
- [ ] Handle API errors gracefully

## PHASE 2: TOOL SYSTEM

### 2.1 Core Tools
- [ ] Implement tool base interface
- [ ] Create ToolRegistry
- [ ] Build Bash tool with timeout and output handling
- [ ] Implement Read tool with offset/limit support
- [ ] Create Write tool with path validation
- [ ] Build Edit tool with diff-based replacement
- [ ] Implement Glob and Grep tools

### 2.2 Advanced Tools & Validation
- [ ] Create Ls tool for directory listing
- [ ] Implement WebFetch tool for URL retrieval
- [ ] Build Task tool for subagent spawning
- [ ] Implement TodoWrite/TodoRead tools
- [ ] Create Question tool for user interaction
- [ ] Add input validation and sanitization
- [ ] Implement security checks

### 2.3 Agent Loop
- [ ] Build complete agent loop state machine
- [ ] Implement tool execution flow
- [ ] Create permission request handling
- [ ] Add abort/cancel functionality
- [ ] Implement error recovery
- [ ] Add streaming state management
- [ ] Build context window management

## PHASE 3: PERMISSION & SESSION

### 3.1 Permission System
- [ ] Implement permission modes
- [ ] Create permission rules engine
- [ ] Build allowlist/denylist matching
- [ ] Create PermissionDialog component
- [ ] Implement session-level permissions
- [ ] Add permission persistence
- [ ] Build DiffViewer for edit approval

### 3.2 Session Management
- [ ] Implement SessionManager
- [ ] Create SQLite storage for sessions
- [ ] Build transcript management
- [ ] Implement session resume/continue
- [ ] Add session naming and search
- [ ] Create SessionPicker component
- [ ] Build session cleanup/maintenance

### 3.3 Context Compaction
- [ ] Implement token limit detection
- [ ] Create compaction algorithm
- [ ] Build summary generation
- [ ] Add auto-compact triggers
- [ ] Implement manual /compact command
- [ ] Create compaction boundaries in transcripts
- [ ] Test with long conversations

## PHASE 4: ADVANCED FEATURES

### 4.1 Hooks System
- [ ] Implement HooksEngine
- [ ] Create hook configuration loader
- [ ] Build all hook event types
- [ ] Implement command-based hooks
- [ ] Add prompt-based hooks
- [ ] Create hook input/output handling
- [ ] Test hook integration with tools

### 4.2 MCP Integration
- [ ] Implement MCP protocol types
- [ ] Create Stdio transport
- [ ] Build HTTP transport
- [ ] Implement SSE transport
- [ ] Create MCPClient
- [ ] Build MCPRegistry
- [ ] Add MCP tool discovery
- [ ] Implement MCP server mode

### 4.3 Subagents & Skills
- [ ] Implement subagent base class
- [ ] Create built-in subagents (Explore, Plan, General)
- [ ] Build subagent spawning logic
- [ ] Implement skill file parser
- [ ] Create skill loader
- [ ] Build skill execution
- [ ] Add custom agent/skill creation

## PHASE 5: POLISH & DISTRIBUTION

### 5.1 Slash Commands & UI Polish
- [ ] Implement all slash commands
- [ ] Create CommandPalette component
- [ ] Build HelpModal with keyboard shortcuts
- [ ] Implement ModelPicker
- [ ] Add LogsViewer
- [ ] Create smooth animations
- [ ] Polish TUI styling

### 5.2 Testing & Documentation
- [ ] Write comprehensive unit tests
- [ ] Create integration tests
- [ ] Build end-to-end test suite
- [ ] Write user documentation
- [ ] Create API documentation
- [ ] Build example projects
- [ ] Add inline code comments

### 5.3 Distribution & Launch
- [ ] Create NPM package configuration
- [ ] Build installation scripts (sh, ps1)
- [ ] Set up GitHub Actions CI/CD
- [ ] Create Homebrew formula
- [ ] Build WinGet package
- [ ] Write release notes
- [ ] Prepare launch announcement

---

# PART IV: KEY IMPLEMENTATION DETAILS

## 11. SYSTEM PROMPT ARCHITECTURE

```typescript
// src/agent/prompts/system.ts

export const buildSystemPrompt = (context: SystemPromptContext): string => `
You are Clawd Code, a powerful agentic AI coding assistant designed to help developers write, debug, and understand code.

## Environment
- Working directory: ${context.cwd}
- Platform: ${context.platform}
- Date: ${context.date}
${context.projectContext ? `- Project: ${context.projectContext}` : ''}

## Core Principles
1. **Be Direct**: Execute tasks immediately. Don't ask for permission you don't need.
2. **Be Thorough**: Consider edge cases, error handling, and best practices.
3. **Be Honest**: If you're unsure, say so. If something isn't working, explain why.
4. **Be Efficient**: Use the right tool for the job. Don't read files unnecessarily.

## Tools Available
You have access to the following tools:
${context.toolDescriptions}

## Tool Usage Guidelines
- **Bash**: Use for running commands, scripts, builds, and git operations
- **Read**: Read files when you need to understand existing code
- **Edit**: Make precise changes to existing files
- **Write**: Create new files (prefer Edit for modifications)
- **Glob**: Find files by pattern
- **Grep**: Search file contents
- **Task**: Delegate complex research to subagents

## Best Practices
- Always quote file paths with spaces
- Use absolute paths, not relative
- Prefer editing over rewriting entire files
- Check for existing code before creating new
- Run tests after making changes
- Commit with meaningful messages

## Communication Style
- Be concise but complete
- Use markdown for formatting
- Show code snippets when explaining
- Provide context for decisions
${context.appendedPrompt ? `\n## Additional Instructions\n${context.appendedPrompt}` : ''}
`;
```

## 12. ERROR HANDLING STRATEGY

```typescript
// src/utils/errors.ts

export class ClawdError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = true,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ClawdError';
  }
}

export enum ErrorCode {
  // API Errors
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_OVERLOADED = 'API_OVERLOADED',
  API_NETWORK_ERROR = 'API_NETWORK_ERROR',
  
  // Tool Errors
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  TOOL_TIMEOUT = 'TOOL_TIMEOUT',
  TOOL_PERMISSION_DENIED = 'TOOL_PERMISSION_DENIED',
  
  // File Errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_PERMISSION_DENIED = 'FILE_PERMISSION_DENIED',
  FILE_PATH_INVALID = 'FILE_PATH_INVALID',
  
  // Session Errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_CORRUPTED = 'SESSION_CORRUPTED',
  
  // Config Errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_PARSE_ERROR = 'CONFIG_PARSE_ERROR',
  
  // MCP Errors
  MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  MCP_TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',
}

export class ErrorHandler {
  static handle(error: Error): ErrorResponse {
    if (error instanceof ClawdError) {
      return this.handleClawdError(error);
    }
    
    // Handle Anthropic SDK errors
    if (error.name === 'APIError') {
      return this.handleAPIError(error);
    }
    
    // Generic error
    return {
      userMessage: 'An unexpected error occurred',
      technicalMessage: error.message,
      recoverable: false,
    };
  }
  
  private static handleClawdError(error: ClawdError): ErrorResponse {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.API_KEY_MISSING]: 
        'API key not found. Set ANTHROPIC_API_KEY or run: clawd auth',
      [ErrorCode.API_RATE_LIMITED]:
        'Rate limited. Waiting before retry...',
      [ErrorCode.TOOL_TIMEOUT]:
        'Command timed out. Consider using a longer timeout.',
      // ... more messages
    };
    
    return {
      userMessage: messages[error.code] ?? error.message,
      technicalMessage: error.message,
      recoverable: error.recoverable,
    };
  }
}
```

## 13. PACKAGE.JSON CONFIGURATION

```json
{
  "name": "clawd-code",
  "version": "1.0.0",
  "description": "An agentic coding tool that lives in your terminal",
  "keywords": ["ai", "cli", "claude", "coding", "terminal", "developer-tools"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/clawd-code"
  },
  "homepage": "https://github.com/yourusername/clawd-code#readme",
  "bugs": {
    "url": "https://github.com/yourusername/clawd-code/issues"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "clawd": "./dist/bin/clawd.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE.md"
  ],
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts src/bin/clawd.ts --format esm --dts --clean",
    "start": "node dist/bin/clawd.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "ink": "^5.0.1",
    "ink-select-input": "^5.0.0",
    "ink-spinner": "^5.0.0",
    "ink-text-input": "^5.0.1",
    "react": "^18.2.0",
    "yargs": "^17.7.2",
    "better-sqlite3": "^9.4.3",
    "chalk": "^5.3.0",
    "globby": "^14.0.0",
    "minimatch": "^9.0.3",
    "uuid": "^9.0.1",
    "zod": "^3.22.4",
    "diff": "^5.2.0",
    "marked": "^11.1.1",
    "marked-terminal": "^6.2.0",
    "keychain": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/yargs": "^17.0.32",
    "@types/better-sqlite3": "^7.6.8",
    "@types/diff": "^5.0.9",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.2.4",
    "tsup": "^8.0.1",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.1",
    "@vitest/coverage-v8": "^1.2.1"
  }
}
```

---

# PART V: TESTING STRATEGY

## 14. TEST CATEGORIES

### Unit Tests
```typescript
// tests/unit/tools/bash.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BashTool } from '../../../src/tools/builtin/bash';

describe('BashTool', () => {
  it('executes simple commands', async () => {
    const tool = new BashTool({ cwd: '/tmp', sessionId: 'test' });
    
    const result = await tool.execute({
      command: 'echo "hello"',
      description: 'test echo',
    });
    
    expect(result.success).toBe(true);
    expect(result.content).toContain('hello');
  });

  it('handles command timeout', async () => {
    const tool = new BashTool({ cwd: '/tmp', sessionId: 'test' });
    
    const result = await tool.execute({
      command: 'sleep 10',
      description: 'test timeout',
      timeout: 100,
    });
    
    expect(result.success).toBe(false);
  });

  it('truncates large output', async () => {
    const tool = new BashTool({ cwd: '/tmp', sessionId: 'test' });
    
    const result = await tool.execute({
      command: 'seq 1 10000',
      description: 'test truncation',
    });
    
    expect(result.content.length).toBeLessThan(55000);
    expect(result.metadata?.truncated).toBe(true);
  });
});
```

### Integration Tests
```typescript
// tests/integration/agent-loop.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentLoop } from '../../src/agent/loop';
import { MockAnthropicProvider } from '../mocks/anthropic';

describe('AgentLoop Integration', () => {
  let agent: AgentLoop;
  let mockProvider: MockAnthropicProvider;

  beforeEach(() => {
    mockProvider = new MockAnthropicProvider();
    agent = new AgentLoop({
      provider: mockProvider,
      // ... config
    });
  });

  it('processes simple message without tools', async () => {
    mockProvider.setNextResponse({
      content: [{ type: 'text', text: 'Hello!' }],
      stop_reason: 'end_turn',
    });

    const messages: string[] = [];
    agent.on('textDelta', (text) => messages.push(text));

    await agent.processUserMessage('Hi');

    expect(messages.join('')).toContain('Hello');
  });

  it('executes tool and continues loop', async () => {
    mockProvider.setResponses([
      // First response: tool use
      {
        content: [
          { type: 'text', text: 'Let me check...' },
          { type: 'tool_use', id: '1', name: 'Read', input: { file_path: '/test.txt' } },
        ],
        stop_reason: 'tool_use',
      },
      // Second response: final answer
      {
        content: [{ type: 'text', text: 'The file contains: test' }],
        stop_reason: 'end_turn',
      },
    ]);

    const toolCalls: string[] = [];
    agent.on('toolStart', (tool) => toolCalls.push(tool.name));

    await agent.processUserMessage('Read the file');

    expect(toolCalls).toContain('Read');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/cli.test.ts
import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

describe('CLI E2E', () => {
  it('shows help with --help flag', async () => {
    const output = await runCLI(['--help']);
    expect(output).toContain('clawd');
    expect(output).toContain('Options');
  });

  it('processes print mode query', async () => {
    const output = await runCLI(['-p', 'echo hello']);
    expect(output.exitCode).toBe(0);
  });
});

async function runCLI(args: string[]): Promise<{ output: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn('node', ['./dist/bin/clawd.js', ...args]);
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (exitCode) => {
      resolve({ output, exitCode: exitCode ?? 0 });
    });
  });
}
```

---

# PART VI: METRICS & SUCCESS CRITERIA

## 15. KEY PERFORMANCE INDICATORS

### Performance Metrics
| Metric | Target | Critical |
|--------|--------|----------|
| Startup time | < 500ms | < 1000ms |
| First token latency | < 200ms | < 500ms |
| Tool execution overhead | < 50ms | < 100ms |
| Memory usage (idle) | < 100MB | < 200MB |
| Memory usage (active) | < 300MB | < 500MB |

### User Experience Metrics
| Metric | Target |
|--------|--------|
| Keystrokes to first action | < 5 |
| Time to understand permission prompt | < 3s |
| Command palette response time | < 100ms |
| Session resume time | < 1s |

### Quality Metrics
| Metric | Target |
|--------|--------|
| Test coverage | > 80% |
| TypeScript strict mode | 100% |
| ESLint errors | 0 |
| Accessibility (keyboard-only usage) | Full |

---

# PART VII: RISK MITIGATION

## 16. IDENTIFIED RISKS & MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Anthropic API changes | Medium | High | Abstract provider layer, version pin SDK |
| Terminal compatibility issues | High | Medium | Test on multiple terminals, fallback rendering |
| Performance on large codebases | Medium | High | Implement file limits, progressive loading |
| MCP protocol complexity | Medium | Medium | Start with stdio, add transports incrementally |
| Security vulnerabilities | Low | Critical | Regular audits, sandboxing, input validation |
| Context window exhaustion | High | Medium | Auto-compaction, efficient prompting |

---

# CONCLUSION

This plan provides a comprehensive blueprint for building **Clawd Code**, a full-featured Claude Code clone. The architecture prioritizes:

1. **Modularity**: Each system is isolated and testable
2. **Extensibility**: Plugin, hook, and MCP support enable customization
3. **Security**: Multi-layered permission system with explicit approval
4. **Performance**: Streaming, efficient context management, fast startup
5. **Developer Experience**: Intuitive TUI, helpful errors, extensive documentation
