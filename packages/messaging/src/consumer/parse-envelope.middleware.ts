import { messageEnvelope, type Envelope } from '@app/contracts';
import { SchemaValidationError } from '@app/errors';
import { z } from 'zod';

import type { ConsumerMiddleware, MessageContext, Next } from './middleware.types.js';

const RawEnvelope = messageEnvelope(z.unknown());

export class ParseEnvelopeMiddleware implements ConsumerMiddleware {
  readonly name = 'ParseEnvelope';

  async handle(ctx: MessageContext, next: Next): Promise<void> {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(ctx.message.raw.toString('utf8'));
    } catch (error) {
      throw new SchemaValidationError('Body is not valid JSON', { cause: String(error) });
    }
    const result = RawEnvelope.safeParse(parsedJson);
    if (!result.success) {
      throw new SchemaValidationError('Envelope failed schema validation', {
        issues: result.error.issues,
      });
    }
    ctx.envelope = result.data as Envelope<unknown>;
    await next();
  }
}
