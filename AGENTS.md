# AGENTS

This file guides agentic coding agents working in this repository.
Follow existing conventions and keep changes minimal and consistent.

## Project facts

- Language: TypeScript (ESM), React/Ink for TUI
- Package manager: npm (package-lock.json)
- Node version: >=18 (see package.json engines)
- Build output: dist/ (generated, do not edit by hand)
- Entry points: src/index.tsx, bin/clawd.ts

## Key directories

- src/cli/: CLI argument parsing and commands
- src/tui/: Ink/React terminal UI
- src/agent/: agent loop, subagents, prompts
- src/tools/: tool registry, validation, builtins
- src/providers/: LLM providers and streaming
- src/session/: session storage and transcripts
- src/config/: config loading and schema
- src/permissions/: permission modes and rules
- src/storage/: sqlite/keychain/files

## Build, lint, test

- Install deps: npm install
- Dev (watch): npm run dev
- Build: npm run build
- Start built CLI: npm run start
- Typecheck: npm run typecheck
- Lint: npm run lint
- Lint (fix): npm run lint:fix
- Format: npm run format
- Tests (watch): npm test
- Tests (coverage): npm run test:coverage

### Run a single test

- Single file (watch): npm test -- path/to/file.test.ts
- Single file (run once): npm test -- --run path/to/file.test.ts
- Single test name: npm test -- -t "test name substring"
- Direct vitest (run once): npx vitest run path/to/file.test.ts

## Code style and conventions

### Modules and imports

- Use ESM imports/exports; project is "type": "module".
- Keep ".js" extension on internal imports (tsup expects this).
- Prefer "import type" for type-only imports.
- Group imports: node builtins, external packages, internal modules, then type-only.
- Keep import order stable; avoid unused imports.

### Formatting (Prettier)

- Semicolons enabled.
- Single quotes.
- Trailing commas (es5).
- Print width 100, 2-space indentation.
- Arrow parens always.
- End of line: lf.

### Linting (ESLint)

- Explicit function return types are required (exceptions allowed for expressions).
- No floating promises; always await or handle errors.
- No misused promises (esp. in void-returning callbacks).
- Unused vars are errors; prefix intentionally unused args with "\_".
- React + react-hooks rules are enabled.

### TypeScript types

- strict: true, but strictNullChecks is disabled; still be explicit with null checks.
- Prefer "unknown" over "any" for external input; narrow with type guards.
- Use "Record<string, unknown>" for untyped objects (see tool inputs).
- Use unions and discriminated unions for message/tool block types.
- Keep exported types in src/types/ and re-export from src/types/index.ts when needed.

### Naming

- PascalCase: classes, React components, interfaces, types, enums.
- camelCase: functions, variables, methods, files (when not component).
- UPPER_SNAKE: constants (e.g. MAX_BYTES).
- Keep file names and directories lowercase as in existing structure.

### Async and concurrency

- Use await in loops when ordering matters.
- Use Promise.all for parallel work (see ToolExecutor.executeParallel).
- Avoid forEach with async callbacks.
- Use AbortController for cancellable flows.
- Return early on aborts to keep UI responsive.

### Error handling and logging

- Use ClawdError + ErrorCode for user-facing failures (see src/utils/errors.ts).
- Map errors through ErrorHandler when turning errors into UI messages.
- Prefer returning ToolResult with success:false instead of throwing inside tools.
- Wrap I/O and API calls with try/catch and log details.
- Use Logger.create("ModuleName") for logs; avoid console except CLI entrypoints.

### React/Ink UI

- Prefer function components and hooks; avoid class components.
- Keep UI state local to components; keep side effects in useEffect.
- Use useCallback/useMemo for handlers/registry where currently used.
- Keep Ink layout simple and readable; avoid heavy nesting.

### Tool system conventions

- Tools define name, description, and inputSchema (see BaseTool).
- Validate, sanitize, and security-check tool inputs (src/tools/validation/\*).
- Enforce absolute paths and project-root boundaries in file tools.
- For new tools, register in src/index.tsx and update toolCategories in src/types/tool.ts.
- Provide clear ToolResult content strings; keep metadata structured.

### Config and schema changes

- Update config types in src/config/types.ts.
- Update defaults in src/config/defaults.ts.
- Update validation in src/config/schema.ts.
- Keep config loading order: defaults -> user -> project -> local.
- Prefer environment variables only via ConfigLoader/getApiCredentials.

### Testing conventions

- Vitest is configured in vitest.config.ts (node environment).
- Put tests alongside code as _.test.ts or _.spec.ts.
- Keep tests deterministic; avoid network calls without explicit mocks.
- Coverage includes src/\*_/_.ts and excludes test files.

### Documentation

- Keep README.md and CLI help output in sync with behavior changes.
- Avoid adding comments unless they clarify non-obvious logic.

### Repo hygiene

- Do not edit generated artifacts in dist/.
- Keep .clawd, sessions/, transcripts/, \*.db out of commits (see .gitignore).
- Prefer src/ changes and run format/lint before commits.

## Editor rules

- No Cursor rules found (.cursor/rules/ or .cursorrules).
- No GitHub Copilot instructions found (.github/copilot-instructions.md).

## Notes for agents

- This repository is itself an agentic tool; preserve tool/security checks.
- When changing tool behavior, update validation and permissions together.
- Keep CLI output concise; this is a terminal-first UX.
- Respect current logging levels; avoid noisy logs in normal operation.

## Quick reference

- Default model: claude-sonnet-4-20250514 (config/schema.ts)
- API key envs: CLAWD_API_KEY or ANTHROPIC_API_KEY
- Custom endpoint: CLAWD_BASE_URL requires CLAWD_MODEL
- Dev entry: tsx watch src/index.tsx (npm run dev)
- Build entry: tsup (tsup.config.ts)

## Checklist before handing off

- Code compiles (npm run typecheck).
- Lint passes (npm run lint).
- Formatting matches Prettier (npm run format).
- Tests pass (npm test or targeted vitest run).
