import { NotificationSendV1, type Envelope } from '@app/contracts';
import { DomainError } from '@app/errors';
import type { MessageContext } from '@app/messaging';
import { Injectable } from '@nestjs/common';
import type { z } from 'zod';

import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case.js';

class HandlerInputError extends DomainError {}

@Injectable()
export class NotificationSendHandler {
  private readonly useCase: SendNotificationUseCase;

  constructor(useCase: SendNotificationUseCase) {
    this.useCase = useCase;
  }

  async handle(ctx: MessageContext): Promise<void> {
    const envelope = ctx.envelope;
    if (!envelope) {
      throw new HandlerInputError('envelope is missing in context');
    }
    if (envelope.eventName !== NotificationSendV1.name) {
      throw new HandlerInputError(
        `expected eventName=${NotificationSendV1.name}, got ${envelope.eventName}`,
      );
    }
    await this.useCase.execute(envelope as Envelope<z.infer<typeof NotificationSendV1.schema>>);
  }
}
