import { EventRegistry } from '@app/contracts';
import { SchemaValidationError } from '@app/errors';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

export class ValidatePayloadMiddleware implements ConsumerMiddleware {
  readonly name = 'ValidatePayload';

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    if (!ctx.envelope) throw new SchemaValidationError('Envelope missing in context');
    const def = EventRegistry.resolve(ctx.envelope.eventName);
    if (!def) {
      throw new SchemaValidationError(`Unknown event: ${ctx.envelope.eventName}`);
    }
    const result = def.schema.safeParse(ctx.envelope.payload);
    if (!result.success) {
      throw new SchemaValidationError(
        `Payload for ${ctx.envelope.eventName} failed schema validation`,
        { issues: result.error.issues },
      );
    }
    ctx.envelope.payload = result.data as unknown;
    await next();
  }
}
