import type { EventDefinition } from '@app/contracts';
import type { Logger } from 'pino';
import type { z } from 'zod';

import type {
  EventPublisher,
  PublishMetaOverrides,
  PublishResult,
} from '../ports/event-publisher.port.js';

export class LoggingPublisher implements EventPublisher {
  private readonly inner: EventPublisher;
  private readonly logger: Logger;

  constructor(inner: EventPublisher, logger: Logger) {
    this.inner = inner;
    this.logger = logger;
  }

  async publish<TDef extends EventDefinition>(
    definition: TDef,
    payload: z.infer<TDef['schema']>,
    overrides?: PublishMetaOverrides,
  ): Promise<PublishResult> {
    const startedAt = Date.now();
    try {
      const result = await this.inner.publish(definition, payload, overrides);
      this.logger.info(
        {
          eventName: definition.name,
          eventId: result.eventId,
          durationMs: Date.now() - startedAt,
        },
        'event published',
      );
      return result;
    } catch (error) {
      this.logger.error(
        {
          eventName: definition.name,
          err: error instanceof Error ? { name: error.name, message: error.message } : { error },
          durationMs: Date.now() - startedAt,
        },
        'event publish failed',
      );
      throw error;
    }
  }
}
