import { NotificationSendV1, messageEnvelope } from '@app/contracts';
import type { Envelope } from '@app/contracts';
import type { MessageContext } from '@app/messaging';
import { describe, expect, it, vi } from 'vitest';

import type { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case.js';

import { NotificationSendHandler } from './notification-send.handler.js';

describe('NotificationSendHandler', () => {
  const buildCtx = (): MessageContext => {
    const envelope = messageEnvelope(NotificationSendV1.schema).parse({
      eventId: '00000000-0000-4000-8000-000000000001',
      eventName: NotificationSendV1.name,
      schemaVersion: 1,
      occurredAt: '2026-05-04T12:00:00.000Z',
      correlationId: '11111111-1111-4111-8111-111111111111',
      producer: 'consumer-service',
      payload: {
        channel: 'telegram',
        recipient: {},
        template: 'user-welcome',
        variables: { email: 'a@b.co' },
      },
    }) as Envelope<unknown>;
    return {
      message: {
        raw: Buffer.from(''),
        routingKey: 'notification.send.v1',
        headers: {},
        redelivered: false,
      },
      envelope,
      attempt: 1,
      startedAt: Date.now(),
    };
  };

  it('forwards the envelope to the use-case', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const useCase = { execute } as unknown as SendNotificationUseCase;
    const handler = new NotificationSendHandler(useCase);

    await handler.handle(buildCtx());

    expect(execute).toHaveBeenCalledOnce();
  });

  it('throws when the envelope is missing', async () => {
    const useCase = { execute: vi.fn() } as unknown as SendNotificationUseCase;
    const handler = new NotificationSendHandler(useCase);

    await expect(
      handler.handle({
        message: { raw: Buffer.from(''), routingKey: 'k', headers: {}, redelivered: false },
        attempt: 1,
        startedAt: Date.now(),
      }),
    ).rejects.toThrow(/envelope/i);
  });

  it('throws when eventName mismatches notification.send.v1', async () => {
    const useCase = { execute: vi.fn() } as unknown as SendNotificationUseCase;
    const handler = new NotificationSendHandler(useCase);
    const ctx = buildCtx();
    ctx.envelope!.eventName = 'something.else.v1';

    await expect(handler.handle(ctx)).rejects.toThrow(/notification\.send\.v1/);
  });
});
