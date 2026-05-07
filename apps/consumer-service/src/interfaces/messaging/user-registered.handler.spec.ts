import { UserRegisteredV1, messageEnvelope } from '@app/contracts';
import type { Envelope } from '@app/contracts';
import type { MessageContext } from '@app/messaging';
import { describe, expect, it, vi } from 'vitest';

import type { HandleUserRegisteredUseCase } from '../../application/use-cases/handle-user-registered.use-case.js';

import { UserRegisteredHandler } from './user-registered.handler.js';

describe('UserRegisteredHandler', () => {
  const buildCtx = (): MessageContext => {
    const envelope = messageEnvelope(UserRegisteredV1.schema).parse({
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
    }) as Envelope<unknown>;
    return {
      message: {
        raw: Buffer.from(''),
        routingKey: 'user.registered.v1',
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
    const useCase = { execute } as unknown as HandleUserRegisteredUseCase;
    const handler = new UserRegisteredHandler(useCase);

    await handler.handle(buildCtx());

    expect(execute).toHaveBeenCalledOnce();
    const arg = execute.mock.calls[0]?.[0] as { eventName: string };
    expect(arg.eventName).toBe(UserRegisteredV1.name);
  });

  it('throws when the envelope is missing from context', async () => {
    const useCase = { execute: vi.fn() } as unknown as HandleUserRegisteredUseCase;
    const handler = new UserRegisteredHandler(useCase);

    await expect(
      handler.handle({
        message: { raw: Buffer.from(''), routingKey: 'k', headers: {}, redelivered: false },
        attempt: 1,
        startedAt: Date.now(),
      }),
    ).rejects.toThrow(/envelope/i);
  });

  it('throws when the eventName does not match user.registered.v1', async () => {
    const useCase = { execute: vi.fn() } as unknown as HandleUserRegisteredUseCase;
    const handler = new UserRegisteredHandler(useCase);
    const ctx = buildCtx();
    ctx.envelope!.eventName = 'something.else.v1';

    await expect(handler.handle(ctx)).rejects.toThrow(/user\.registered\.v1/);
  });
});
