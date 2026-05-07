import { NotificationSendV1, UserRegisteredV1, type Envelope } from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';

import { EVENT_PUBLISHER, type EventPublisher } from '../ports/tokens.js';

type UserRegisteredEnvelope = Envelope<z.infer<typeof UserRegisteredV1.schema>>;

@Injectable()
export class HandleUserRegisteredUseCase {
  private readonly publisher: EventPublisher;

  constructor(@Inject(EVENT_PUBLISHER) publisher: EventPublisher) {
    this.publisher = publisher;
  }

  async execute(envelope: UserRegisteredEnvelope): Promise<void> {
    await this.publisher.publish(
      NotificationSendV1,
      {
        channel: 'telegram',
        recipient: {},
        template: 'user-welcome',
        variables: { email: envelope.payload.email },
      },
      {
        correlationId: envelope.correlationId,
        causationId: envelope.eventId,
      },
    );
  }
}
