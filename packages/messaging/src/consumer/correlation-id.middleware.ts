import { CorrelationContext } from '@app/logger';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

export class CorrelationIdMiddleware implements ConsumerMiddleware {
  readonly name = 'CorrelationId';

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    if (!ctx.envelope) {
      await next();
      return;
    }
    const store = {
      correlationId: ctx.envelope.correlationId,
      ...(ctx.envelope.causationId !== undefined ? { causationId: ctx.envelope.causationId } : {}),
    };
    await CorrelationContext.run(store, async () => next());
  }
}
