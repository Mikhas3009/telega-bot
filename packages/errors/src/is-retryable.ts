import { DomainError } from './domain.error.js';
import { PermanentError, TransientError } from './infrastructure.error.js';

export const isRetryable = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  if (error instanceof TransientError) return true;
  if (error instanceof PermanentError) return false;
  if (error instanceof DomainError) return false;
  // Unknown Error: assume transient (network/lib errors usually are).
  // Domain code should throw typed errors, so this is a safe default.
  return true;
};
