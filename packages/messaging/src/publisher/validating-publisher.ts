import type { EventDefinition } from '@app/contracts';
import { SchemaValidationError } from '@app/errors';
import type { z } from 'zod';

import type {
  EventPublisher,
  PublishMetaOverrides,
  PublishResult,
} from '../ports/event-publisher.port.js';

export class ValidatingPublisher implements EventPublisher {
  private readonly inner: EventPublisher;

  constructor(inner: EventPublisher) {
    this.inner = inner;
  }

  async publish<TDef extends EventDefinition>(
    definition: TDef,
    payload: z.infer<TDef['schema']>,
    overrides?: PublishMetaOverrides,
  ): Promise<PublishResult> {
    const result = definition.schema.safeParse(payload);
    if (!result.success) {
      throw new SchemaValidationError(
        `Outgoing payload for ${definition.name} failed schema validation`,
        { issues: result.error.issues },
      );
    }
    return this.inner.publish(definition, payload, overrides);
  }
}
