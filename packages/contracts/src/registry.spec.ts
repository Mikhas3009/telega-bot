import { describe, expect, it } from 'vitest';

import { NotificationSendV1, UserRegisteredV1 } from './events/index.js';
import { EventRegistry } from './registry.js';

describe('EventRegistry', () => {
  it('resolves a known event by name', () => {
    expect(EventRegistry.resolve(UserRegisteredV1.name)).toBe(UserRegisteredV1);
  });

  it('returns undefined for unknown names', () => {
    expect(EventRegistry.resolve('bogus.v99')).toBeUndefined();
  });

  it('lists all registered events', () => {
    expect(EventRegistry.all()).toEqual([UserRegisteredV1, NotificationSendV1]);
  });
});
