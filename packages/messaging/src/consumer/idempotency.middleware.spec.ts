import { messageEnvelope, type Envelope } from '@app/contracts';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { CaptureResult, IdempotencyStore } from '../ports/idempotency-store.port.js';

import { IdempotencyMiddleware } from './idempotency.middleware.js';
import type { MessageContext } from './middleware.types.js';

const buildCtx = (): MessageContext => {
  const envelope = messageEnvelope(z.object({})).parse({
    eventId: '00000000-0000-4000-8000-000000000000',
    eventName: 'thing.v1',
    schemaVersion: 1,
    occurredAt: '2026-05-04T12:00:00.000Z',
    correlationId: '11111111-1111-4111-8111-111111111111',
    producer: 'p',
    payload: {},
  }) as Envelope<unknown>;
  return {
    message: { raw: Buffer.from(''), routingKey: 'k', headers: {}, redelivered: false },
    envelope,
    attempt: 1,
    startedAt: Date.now(),
  };
};

const fakeStore = (
  capture: CaptureResult,
): IdempotencyStore & { complete: ReturnType<typeof vi.fn> } => ({
  capture: vi.fn().mockResolvedValue(capture),
  complete: vi.fn().mockResolvedValue(undefined),
  release: vi.fn().mockResolvedValue(undefined),
});

describe('IdempotencyMiddleware', () => {
  it('runs handler and marks COMPLETED on first capture', async () => {
    const store = fakeStore({ status: 'CAPTURED' });
    const mw = new IdempotencyMiddleware(store, 'consumer-service', 60);
    const next = vi.fn().mockResolvedValue(undefined);
    await mw.handle(buildCtx(), next);
    expect(next).toHaveBeenCalledOnce();
    expect(store.complete).toHaveBeenCalledOnce();
  });

  it('skips handler when COMPLETED already', async () => {
    const store = fakeStore({ status: 'COMPLETED' });
    const mw = new IdempotencyMiddleware(store, 'consumer-service', 60);
    const next = vi.fn();
    await mw.handle(buildCtx(), next);
    expect(next).not.toHaveBeenCalled();
    expect(store.complete).not.toHaveBeenCalled();
  });

  it('runs handler when IN_PROGRESS (assumes previous worker died)', async () => {
    const store = fakeStore({ status: 'IN_PROGRESS' });
    const mw = new IdempotencyMiddleware(store, 'consumer-service', 60);
    const next = vi.fn().mockResolvedValue(undefined);
    await mw.handle(buildCtx(), next);
    expect(next).toHaveBeenCalledOnce();
  });
});
