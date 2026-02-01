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
  CONFIG_MODEL_REQUIRED = 'CONFIG_MODEL_REQUIRED',

  // MCP Errors
  MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
  MCP_TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',
}

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

export interface ErrorResponse {
  userMessage: string;
  technicalMessage: string;
  recoverable: boolean;
}

export class ErrorHandler {
  static handle(error: Error): ErrorResponse {
    if (error instanceof ClawdError) {
      return this.handleClawdError(error);
    }

    if (error.name === 'APIError') {
      return this.handleAPIError(error);
    }

    return {
      userMessage: 'An unexpected error occurred',
      technicalMessage: error.message,
      recoverable: false,
    };
  }

  private static handleClawdError(error: ClawdError): ErrorResponse {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.API_KEY_MISSING]:
        'API key not found. Set CLAWD_API_KEY or ANTHROPIC_API_KEY, or run: clawd auth',
      [ErrorCode.API_RATE_LIMITED]: 'Rate limited. Waiting before retry...',
      [ErrorCode.API_KEY_INVALID]: 'Invalid API key. Please check your credentials.',
      [ErrorCode.API_OVERLOADED]: 'API is overloaded. Please try again later.',
      [ErrorCode.API_NETWORK_ERROR]: 'Network error. Please check your connection.',
      [ErrorCode.TOOL_NOT_FOUND]: 'Tool not found in registry.',
      [ErrorCode.TOOL_EXECUTION_FAILED]: 'Tool execution failed.',
      [ErrorCode.TOOL_TIMEOUT]: 'Command timed out. Consider using a longer timeout.',
      [ErrorCode.TOOL_PERMISSION_DENIED]: 'Permission denied for tool execution.',
      [ErrorCode.FILE_NOT_FOUND]: 'File not found.',
      [ErrorCode.FILE_PERMISSION_DENIED]: 'Permission denied accessing file.',
      [ErrorCode.FILE_PATH_INVALID]: 'Invalid file path.',
      [ErrorCode.SESSION_NOT_FOUND]: 'Session not found.',
      [ErrorCode.SESSION_CORRUPTED]: 'Session data is corrupted.',
      [ErrorCode.CONFIG_INVALID]: 'Invalid configuration.',
      [ErrorCode.CONFIG_PARSE_ERROR]: 'Failed to parse configuration.',
      [ErrorCode.CONFIG_MODEL_REQUIRED]: 'Model is required for custom endpoints.',
      [ErrorCode.MCP_CONNECTION_FAILED]: 'Failed to connect to MCP server.',
      [ErrorCode.MCP_TOOL_NOT_FOUND]: 'MCP tool not found.',
    };

    return {
      userMessage: messages[error.code] ?? error.message,
      technicalMessage: error.message,
      recoverable: error.recoverable,
    };
  }

  private static handleAPIError(error: Error): ErrorResponse {
    return {
      userMessage: 'API request failed',
      technicalMessage: error.message,
      recoverable: true,
    };
  }
}
