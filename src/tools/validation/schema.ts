/**
 * JSON Schema validation for tool inputs.
 */

export interface JSONSchema {
  type: 'object' | 'string' | 'number' | 'boolean' | 'array';
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate input against a JSON schema.
 */
export function validateInput(input: unknown, schema: JSONSchema): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Input must be an object'] };
  }

  const inputObj = input as Record<string, unknown>;

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in inputObj) || inputObj[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Validate each property
  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in inputObj) {
        const propErrors = validateProperty(key, inputObj[key], propSchema);
        errors.push(...propErrors);
      }
    }
  }

  // Check for unknown properties if additionalProperties is false
  if (schema.additionalProperties === false && schema.properties) {
    for (const key of Object.keys(inputObj)) {
      if (!(key in schema.properties)) {
        errors.push(`Unknown property: ${key}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single property.
 */
function validateProperty(name: string, value: unknown, schema: JSONSchemaProperty): string[] {
  const errors: string[] = [];

  // Type validation
  const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
  const actualType = getType(value);

  if (!expectedTypes.includes(actualType)) {
    errors.push(`${name}: expected ${expectedTypes.join(' or ')}, got ${actualType}`);
    return errors;
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${name}: must be one of ${schema.enum.join(', ')}`);
  }

  // String validations
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${name}: must be at least ${schema.minLength} characters`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(`${name}: must be at most ${schema.maxLength} characters`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${name}: does not match pattern ${schema.pattern}`);
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${name}: must be at least ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${name}: must be at most ${schema.maximum}`);
    }
  }

  // Array validations
  if (Array.isArray(value) && schema.items) {
    for (let i = 0; i < value.length; i++) {
      const itemErrors = validateProperty(`${name}[${i}]`, value[i], schema.items);
      errors.push(...itemErrors);
    }
  }

  return errors;
}

/**
 * Get the JSON schema type of a value.
 */
function getType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export default validateInput;
