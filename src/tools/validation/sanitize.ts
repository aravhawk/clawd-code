/**
 * Input sanitization for tool inputs.
 */

import type { JSONSchema, JSONSchemaProperty } from './schema';

/**
 * Sanitize input to remove potentially dangerous values.
 */
export function sanitizeInput(
  input: Record<string, unknown>,
  schema: JSONSchema
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const propSchema = schema.properties?.[key];

    if (propSchema) {
      sanitized[key] = sanitizeValue(value, propSchema);
    } else if (schema.additionalProperties !== false) {
      // Pass through unknown properties but sanitize strings
      sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
    }
  }

  return sanitized;
}

/**
 * Sanitize a value based on its schema.
 */
function sanitizeValue(value: unknown, schema: JSONSchemaProperty): unknown {
  if (value === null || value === undefined) {
    return schema.default ?? value;
  }

  const types = Array.isArray(schema.type) ? schema.type : [schema.type];

  if (types.includes('string') && typeof value === 'string') {
    return sanitizeString(value);
  }

  if (types.includes('number') && typeof value === 'number') {
    return sanitizeNumber(value, schema);
  }

  if (types.includes('array') && Array.isArray(value)) {
    return value.map((item) => (schema.items ? sanitizeValue(item, schema.items) : item));
  }

  return value;
}

/**
 * Sanitize a string value.
 */
function sanitizeString(value: string): string {
  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');

  // Limit very long strings
  const MAX_STRING_LENGTH = 1_000_000;
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.slice(0, MAX_STRING_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize a number value.
 */
function sanitizeNumber(value: number, schema: JSONSchemaProperty): number {
  let sanitized = value;

  // Handle NaN and Infinity
  if (!Number.isFinite(sanitized)) {
    sanitized = 0;
  }

  // Clamp to bounds
  if (schema.minimum !== undefined && sanitized < schema.minimum) {
    sanitized = schema.minimum;
  }
  if (schema.maximum !== undefined && sanitized > schema.maximum) {
    sanitized = schema.maximum;
  }

  return sanitized;
}

/**
 * Sanitize a file path.
 */
export function sanitizePath(filePath: string): string {
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '');

  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');

  // Remove any attempt to escape with ..
  // This is a simple check - more thorough validation happens in security.ts
  sanitized = sanitized.replace(/\.\.+/g, '.');

  return sanitized;
}

/**
 * Sanitize a shell command.
 */
export function sanitizeCommand(command: string): string {
  // Remove null bytes
  let sanitized = command.replace(/\0/g, '');

  // Limit command length
  const MAX_COMMAND_LENGTH = 100_000;
  if (sanitized.length > MAX_COMMAND_LENGTH) {
    sanitized = sanitized.slice(0, MAX_COMMAND_LENGTH);
  }

  return sanitized;
}

export default sanitizeInput;
