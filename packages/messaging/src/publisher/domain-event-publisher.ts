import type { EventDefinition } from '@app/contracts';
import { CorrelationContext } from '@app/logger';
import { v4 as uuid } from 'uuid';
import type { z } from 'zod';

import type {
  EventPublisher,
  PublishMetaOverrides,
  PublishResult,
} from '../ports/event-publisher.port.js';
import type { MessageBus } from '../ports/message-bus.port.js';

export interface DomainEventPublisherOptions {
  exchange: string;
  producerName: string;
}

export class DomainEventPublisher implements EventPublisher {
  private readonly bus: MessageBus;
  private readonly options: DomainEventPublisherOptions;

  constructor(bus: MessageBus, options: DomainEventPublisherOptions) {
    this.bus = bus;
    this.options = options;
  }

  async publish<TDef extends EventDefinition>(
    definition: TDef,
    payload: z.infer<TDef['schema']>,
    overrides: PublishMetaOverrides = {},
  ): Promise<PublishResult> {
    const eventId = overrides.eventId ?? uuid();
    const correlationId =
      overrides.correlationId ?? CorrelationContext.current()?.correlationId ?? uuid();
    const occurredAt = new Date().toISOString();

    const envelope = {
      eventId,
      eventName: definition.name,
      schemaVersion: definition.schemaVersion,
      occurredAt,
      correlationId,
      ...(overrides.causationId !== undefined ? { causationId: overrides.causationId } : {}),
      producer: this.options.producerName,
      payload,
    };

    await this.bus.publish(
      {
        exchange: this.options.exchange,
        routingKey: definition.routingKey,
        messageId: eventId,
        correlationId,
        timestamp: Date.now(),
        headers: {
          'x-event-name': definition.name,
          'x-schema-version': String(definition.schemaVersion),
        },
      },
      Buffer.from(JSON.stringify(envelope), 'utf8'),
    );

    return { eventId, publishedAt: occurredAt };
  }
}
