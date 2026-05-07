import { describe, expect, it } from 'vitest';

import { InfrastructureError, PermanentError, TransientError } from './infrastructure.error.js';

class DbDown extends TransientError {}
class BadRequest extends PermanentError {}

describe('InfrastructureError hierarchy', () => {
  it('TransientError is an InfrastructureError', () => {
    const err = new DbDown('connection refused');
    expect(err).toBeInstanceOf(TransientError);
    expect(err).toBeInstanceOf(InfrastructureError);
    expect(err).toBeInstanceOf(Error);
  });

  it('PermanentError is an InfrastructureError', () => {
    const err = new BadRequest('400 from upstream');
    expect(err).toBeInstanceOf(PermanentError);
    expect(err).toBeInstanceOf(InfrastructureError);
  });

  it('exposes cause when provided', () => {
    const cause = new Error('socket hang up');
    const err = new DbDown('connection refused', { cause });
    expect(err.cause).toBe(cause);
  });
});
