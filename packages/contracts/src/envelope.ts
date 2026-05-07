import { z } from 'zod';

export const messageEnvelope = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    eventId: z.string().uuid(),
    eventName: z.string().min(1),
    schemaVersion: z.number().int().positive(),
    occurredAt: z.string().datetime(),
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
    producer: z.string().min(1),
    payload,
  });

export interface Envelope<P> {
  eventId: string;
  eventName: string;
  schemaVersion: number;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  producer: string;
  payload: P;
}
