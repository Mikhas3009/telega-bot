import type { Logger } from 'pino';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

export class LoggingMiddleware implements ConsumerMiddleware {
  readonly name = 'Logging';

  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    const meta = ctx.envelope
      ? { eventName: ctx.envelope.eventName, eventId: ctx.envelope.eventId }
      : { routingKey: ctx.message.routingKey };
    this.logger.info({ ...meta, attempt: ctx.attempt }, 'message received');
    try {
      await next();
      this.logger.info({ ...meta, durationMs: Date.now() - ctx.startedAt }, 'message processed');
    } catch (error) {
      this.logger.error(
        {
          ...meta,
          err: error instanceof Error ? { name: error.name, message: error.message } : { error },
          durationMs: Date.now() - ctx.startedAt,
        },
        'message processing failed',
      );
      throw error;
    }
  }
}
