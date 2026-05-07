import { UserRegisteredV1 } from '@app/contracts';
import { SchemaValidationError } from '@app/errors';
import { describe, expect, it, vi } from 'vitest';

import { ValidatingPublisher } from './validating-publisher.js';

describe('ValidatingPublisher', () => {
  it('passes valid payload to the inner publisher', async () => {
    const inner = { publish: vi.fn().mockResolvedValue({ eventId: 'x', publishedAt: 't' }) };
    const pub = new ValidatingPublisher(inner);

    await pub.publish(UserRegisteredV1, {
      userId: '00000000-0000-4000-8000-000000000000',
      email: 'a@b.co',
      registeredAt: '2026-05-04T12:00:00.000Z',
    });

    expect(inner.publish).toHaveBeenCalledOnce();
  });

  it('throws SchemaValidationError on invalid payload', async () => {
    const inner = { publish: vi.fn() };
    const pub = new ValidatingPublisher(inner);

    await expect(
      pub.publish(UserRegisteredV1, {
        userId: 'not-a-uuid', // invalid at runtime; z.string().uuid() accepts string at TS level
        email: 'a@b.co',
        registeredAt: '2026-05-04T12:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(SchemaValidationError);

    expect(inner.publish).not.toHaveBeenCalled();
  });
});
