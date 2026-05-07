import type { CaptureResult, IdempotencyStatus, IdempotencyStore } from '@app/messaging';

interface Entry {
  status: IdempotencyStatus;
  expiresAt: number;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, Entry>();

  capture(key: string, ttlSeconds: number): Promise<CaptureResult> {
    const now = Date.now();
    const existing = this.map.get(key);
    if (existing && existing.expiresAt > now) {
      return Promise.resolve({ status: existing.status });
    }
    this.map.set(key, { status: 'CAPTURED', expiresAt: now + ttlSeconds * 1000 });
    return Promise.resolve({ status: 'CAPTURED' });
  }

  complete(key: string, ttlSeconds: number): Promise<void> {
    this.map.set(key, { status: 'COMPLETED', expiresAt: Date.now() + ttlSeconds * 1000 });
    return Promise.resolve();
  }

  release(key: string): Promise<void> {
    this.map.delete(key);
    return Promise.resolve();
  }

  reset(): void {
    this.map.clear();
  }
}
