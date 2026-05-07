import { describe, expect, it } from 'vitest';

import { DomainError } from './domain.error.js';

class UserNotFound extends DomainError {
  constructor(userId: string) {
    super(`User ${userId} not found`, { userId });
  }
}

describe('DomainError', () => {
  it('preserves message and details', () => {
    const err = new UserNotFound('u-1');
    expect(err.message).toBe('User u-1 not found');
    expect(err.details).toEqual({ userId: 'u-1' });
    expect(err.name).toBe('UserNotFound');
  });

  it('is an instance of Error', () => {
    expect(new UserNotFound('u-1')).toBeInstanceOf(Error);
  });
});
