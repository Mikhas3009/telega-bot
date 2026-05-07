import { UserRegisteredV1 } from '@app/contracts';
import { PermanentError, TransientError } from '@app/errors';
import { describe, expect, it, vi } from 'vitest';

import type { EventPublisher } from '../ports/event-publisher.port.js';

import { defaultRetryPolicy } from './retry-policy.js';
import { RetryablePublisher } from './retryable-publisher.js';

class FlakyError extends TransientError {}
class FatalError extends PermanentError {}

const validPayload = {
  userId: '00000000-0000-4000-8000-000000000000',
  email: 'a@b.co',
  registeredAt: '2026-05-04T12:00:00.000Z',
};

const fastPolicy = { ...defaultRetryPolicy, initialDelayMs: 1, jitter: 'none' as const };

describe('RetryablePublisher', () => {
  it('retries transient failures up to maxAttempts and then succeeds', async () => {
    const publishFn = vi
      .fn<EventPublisher['publish']>()
      .mockRejectedValueOnce(new FlakyError('blip'))
      .mockRejectedValueOnce(new FlakyError('blip'))
      .mockResolvedValueOnce({ eventId: 'e', publishedAt: 't' });
    const inner: EventPublisher = { publish: publishFn };
    const pub = new RetryablePublisher(inner, fastPolicy);

    await pub.publish(UserRegisteredV1, validPayload);

    expect(publishFn).toHaveBeenCalledTimes(3);
  });

  it('does not retry permanent errors', async () => {
    const publishFn = vi.fn<EventPublisher['publish']>().mockRejectedValue(new FatalError('nope'));
    const inner: EventPublisher = { publish: publishFn };
    const pub = new RetryablePublisher(inner, fastPolicy);

    await expect(pub.publish(UserRegisteredV1, validPayload)).rejects.toBeInstanceOf(FatalError);
    expect(publishFn).toHaveBeenCalledOnce();
  });

  it('exhausts attempts and rethrows the last transient error', async () => {
    const publishFn = vi
      .fn<EventPublisher['publish']>()
      .mockRejectedValue(new FlakyError('persistent blip'));
    const inner: EventPublisher = { publish: publishFn };
    const pub = new RetryablePublisher(inner, fastPolicy);

    await expect(pub.publish(UserRegisteredV1, validPayload)).rejects.toBeInstanceOf(FlakyError);
    expect(publishFn).toHaveBeenCalledTimes(3);
  });
});
