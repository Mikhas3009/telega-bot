import type { IdempotencyStore } from '../ports/idempotency-store.port.js';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

export class IdempotencyMiddleware implements ConsumerMiddleware {
  readonly name = 'Idempotency';

  private readonly store: IdempotencyStore;
  private readonly serviceName: string;
  private readonly ttlSeconds: number;

  constructor(store: IdempotencyStore, serviceName: string, ttlSeconds: number) {
    this.store = store;
    this.serviceName = serviceName;
    this.ttlSeconds = ttlSeconds;
  }

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    if (!ctx.envelope) {
      await next();
      return;
    }
    const key = `${this.serviceName}:${ctx.envelope.eventId}`;
    const result = await this.store.capture(key, this.ttlSeconds);
    if (result.status === 'COMPLETED') return;
    try {
      await next();
      await this.store.complete(key, this.ttlSeconds);
    } catch (error) {
      await this.store.release(key);
      throw error;
    }
  }
}
