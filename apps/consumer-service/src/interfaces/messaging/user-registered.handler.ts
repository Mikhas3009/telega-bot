import { UserRegisteredV1, type Envelope } from '@app/contracts';
import { DomainError } from '@app/errors';
import type { MessageContext } from '@app/messaging';
import { Injectable } from '@nestjs/common';
import type { z } from 'zod';

import { HandleUserRegisteredUseCase } from '../../application/use-cases/handle-user-registered.use-case.js';

class HandlerInputError extends DomainError {}

@Injectable()
export class UserRegisteredHandler {
  private readonly useCase: HandleUserRegisteredUseCase;

  constructor(useCase: HandleUserRegisteredUseCase) {
    this.useCase = useCase;
  }

  async handle(ctx: MessageContext): Promise<void> {
    const envelope = ctx.envelope;
    if (!envelope) {
      throw new HandlerInputError('envelope is missing in context');
    }
    if (envelope.eventName !== UserRegisteredV1.name) {
      throw new HandlerInputError(
        `expected eventName=${UserRegisteredV1.name}, got ${envelope.eventName}`,
      );
    }
    await this.useCase.execute(envelope as Envelope<z.infer<typeof UserRegisteredV1.schema>>);
  }
}
