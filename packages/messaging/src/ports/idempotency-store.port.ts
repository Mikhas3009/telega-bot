export type IdempotencyStatus = 'CAPTURED' | 'COMPLETED' | 'IN_PROGRESS';

export interface CaptureResult {
  status: IdempotencyStatus;
}

export interface IdempotencyStore {
  capture(eventId: string, ttlSeconds: number): Promise<CaptureResult>;
  complete(eventId: string, ttlSeconds: number): Promise<void>;
  release(eventId: string): Promise<void>;
}

export const IDEMPOTENCY_STORE = Symbol('IdempotencyStore');
