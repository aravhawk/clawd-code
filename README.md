# Clawd Code

An agentic coding tool that lives in your terminal.

## Installation

```bash
npm install -g clawd-code
```

## Quick Start

```bash
# Set your API key
export ANTHROPIC_API_KEY=your_key_here

# Run Clawd Code
clawd

# Or with a direct prompt
clawd "help me understand this codebase"
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Project Structure

- `src/cli/` - Command-line interface
- `src/tui/` - Terminal UI (Ink/React)
- `src/agent/` - Core agent loop
- `src/tools/` - Tool system
- `src/providers/` - LLM providers
- `src/config/` - Configuration management
- `src/session/` - Session management
- `src/permissions/` - Permission system
- `src/hooks/` - Lifecycle hooks
- `src/mcp/` - Model Context Protocol

## License

MIT
