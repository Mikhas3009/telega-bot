import { PermanentError } from './infrastructure.error.js';

export class SchemaValidationError extends PermanentError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, { details });
  }
}
