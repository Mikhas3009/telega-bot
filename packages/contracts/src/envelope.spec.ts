import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { messageEnvelope } from './envelope.js';

const PayloadSchema = z.object({ id: z.string() });

describe('messageEnvelope', () => {
  it('parses a valid envelope', () => {
    const Envelope = messageEnvelope(PayloadSchema);
    const parsed = Envelope.parse({
      eventId: '00000000-0000-4000-8000-000000000000',
      eventName: 'thing.happened.v1',
      schemaVersion: 1,
      occurredAt: '2026-05-04T12:00:00.000Z',
      correlationId: '11111111-1111-4111-8111-111111111111',
      producer: 'producer-service',
      payload: { id: 'x' },
    });
    expect(parsed.payload).toEqual({ id: 'x' });
    expect(parsed.causationId).toBeUndefined();
  });

  it('rejects non-uuid eventId', () => {
    const Envelope = messageEnvelope(PayloadSchema);
    expect(() =>
      Envelope.parse({
        eventId: 'not-a-uuid',
        eventName: 'x',
        schemaVersion: 1,
        occurredAt: '2026-05-04T12:00:00.000Z',
        correlationId: '11111111-1111-4111-8111-111111111111',
        producer: 'p',
        payload: { id: 'x' },
      }),
    ).toThrow();
  });

  it('accepts optional causationId', () => {
    const Envelope = messageEnvelope(PayloadSchema);
    const parsed = Envelope.parse({
      eventId: '00000000-0000-4000-8000-000000000000',
      eventName: 'thing.happened.v1',
      schemaVersion: 1,
      occurredAt: '2026-05-04T12:00:00.000Z',
      correlationId: '11111111-1111-4111-8111-111111111111',
      causationId: '22222222-2222-4222-8222-222222222222',
      producer: 'p',
      payload: { id: 'x' },
    });
    expect(parsed.causationId).toBe('22222222-2222-4222-8222-222222222222');
  });
});
