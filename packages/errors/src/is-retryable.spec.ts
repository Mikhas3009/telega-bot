import { describe, expect, it } from 'vitest';

import { DomainError } from './domain.error.js';
import { PermanentError, TransientError } from './infrastructure.error.js';
import { isRetryable } from './is-retryable.js';
import { SchemaValidationError } from './schema-validation.error.js';

class TempBlip extends TransientError {}
class HardFail extends PermanentError {}
class BizRule extends DomainError {}

describe('isRetryable', () => {
  it('returns true for TransientError', () => {
    expect(isRetryable(new TempBlip('blip'))).toBe(true);
  });

  it('returns false for PermanentError', () => {
    expect(isRetryable(new HardFail('fail'))).toBe(false);
  });

  it('returns false for SchemaValidationError', () => {
    expect(isRetryable(new SchemaValidationError('bad shape'))).toBe(false);
  });

  it('returns false for DomainError', () => {
    expect(isRetryable(new BizRule('not allowed'))).toBe(false);
  });

  it('defaults unknown errors to retryable', () => {
    expect(isRetryable(new Error('mystery'))).toBe(true);
  });

  it('returns false for non-Error values', () => {
    expect(isRetryable('a string')).toBe(false);
    expect(isRetryable(null)).toBe(false);
  });
});
