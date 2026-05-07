import {
  NotificationSendV1,
  UserRegisteredV1,
  messageEnvelope,
  type Envelope,
} from '@app/contracts';
import type { EventPublisher } from '@app/messaging';
import { describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import { HandleUserRegisteredUseCase } from './handle-user-registered.use-case.js';

const buildEnvelope = (): Envelope<z.infer<typeof UserRegisteredV1.schema>> =>
  messageEnvelope(UserRegisteredV1.schema).parse({
    eventId: '00000000-0000-4000-8000-000000000000',
    eventName: UserRegisteredV1.name,
    schemaVersion: 1,
    occurredAt: '2026-05-04T12:00:00.000Z',
    correlationId: '11111111-1111-4111-8111-111111111111',
    producer: 'producer-service',
    payload: {
      userId: '22222222-2222-4222-8222-222222222222',
      email: 'user@example.com',
      registeredAt: '2026-05-04T12:00:00.000Z',
    },
  }) as Envelope<z.infer<typeof UserRegisteredV1.schema>>;

describe('HandleUserRegisteredUseCase', () => {
  it('publishes a NotificationSendV1 with telegram channel and welcome template', async () => {
    const execute = vi.fn().mockResolvedValue({ eventId: 'n-1', publishedAt: 't' });
    const publisher: EventPublisher = { publish: execute };
    const useCase = new HandleUserRegisteredUseCase(publisher);

    await useCase.execute(buildEnvelope());

    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      NotificationSendV1,
      expect.objectContaining({
        channel: 'telegram',
        template: 'user-welcome',
        variables: { email: 'user@example.com' },
      }),
      {
        correlationId: '11111111-1111-4111-8111-111111111111',
        causationId: '00000000-0000-4000-8000-000000000000',
      },
    );
  });
});
