/**
 * Configuration schema and validation.
 */

export interface ConfigSchema {
  model: {
    type: 'string';
    default: string;
    enum: string[];
    description: string;
  };
  maxTokens: {
    type: 'number';
    default: number;
    minimum: number;
    maximum: number;
    description: string;
  };
  temperature: {
    type: 'number';
    default: number;
    minimum: number;
    maximum: number;
    description: string;
  };
  permissions: {
    type: 'object';
    properties: {
      mode: { type: 'string'; enum: string[] };
      allowlist: { type: 'array' };
    };
  };
  mcp: {
    type: 'object';
    properties: {
      servers: { type: 'array' };
    };
  };
}

export const configSchema: ConfigSchema = {
  model: {
    type: 'string',
    default: 'claude-sonnet-4-20250514',
    enum: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    description: 'The Claude model to use',
  },
  maxTokens: {
    type: 'number',
    default: 8192,
    minimum: 1,
    maximum: 200000,
    description: 'Maximum tokens for responses',
  },
  temperature: {
    type: 'number',
    default: 0,
    minimum: 0,
    maximum: 1,
    description: 'Temperature for response generation',
  },
  permissions: {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['default', 'auto-accept', 'plan', 'deny-all'] },
      allowlist: { type: 'array' },
    },
  },
  mcp: {
    type: 'object',
    properties: {
      servers: { type: 'array' },
    },
  },
};

/**
 * Validate a configuration value against the schema.
 */
export function validateConfig<K extends keyof ConfigSchema>(
  key: K,
  value: unknown
): { valid: boolean; error?: string } {
  const schema = configSchema[key];

  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      return { valid: false, error: `${key} must be a string` };
    }
    if ('enum' in schema && !schema.enum.includes(value)) {
      return { valid: false, error: `${key} must be one of: ${schema.enum.join(', ')}` };
    }
  }

  if (schema.type === 'number') {
    if (typeof value !== 'number') {
      return { valid: false, error: `${key} must be a number` };
    }
    if ('minimum' in schema && value < schema.minimum) {
      return { valid: false, error: `${key} must be at least ${schema.minimum}` };
    }
    if ('maximum' in schema && value > schema.maximum) {
      return { valid: false, error: `${key} must be at most ${schema.maximum}` };
    }
  }

  return { valid: true };
}

export default configSchema;
