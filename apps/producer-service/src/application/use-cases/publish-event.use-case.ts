import type { EventPublisher, PublishResult } from '@app/messaging';
import { Inject, Injectable } from '@nestjs/common';

import { resolveEventType } from '../../domain/events/event-type.js';
import type { PublishEventCommand } from '../dto/publish-event.command.js';
import { EVENT_PUBLISHER } from '../ports/event-publisher.token.js';

@Injectable()
export class PublishEventUseCase {
  private readonly publisher: EventPublisher;

  constructor(@Inject(EVENT_PUBLISHER) publisher: EventPublisher) {
    this.publisher = publisher;
  }

  async execute(command: PublishEventCommand): Promise<PublishResult> {
    const { definition } = resolveEventType(command.type);
    const overrides =
      command.correlationId !== undefined ? { correlationId: command.correlationId } : undefined;
    return this.publisher.publish(definition, command.payload, overrides);
  }
}
