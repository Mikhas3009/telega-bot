import { NotificationSendV1, type Envelope } from '@app/contracts';
import { DomainError } from '@app/errors';
import { Inject, Injectable } from '@nestjs/common';
import type { z } from 'zod';

import { RecipientResolutionError, TemplateError } from '../domain/notification.errors.js';
import {
  NOTIFICATION_CHANNEL_REGISTRY,
  type NotificationChannelRegistry,
} from '../ports/notification-channel.port.js';
import { TEMPLATE_RENDERER, type TemplateRenderer } from '../ports/template-renderer.port.js';

export interface SendNotificationUseCaseOptions {
  defaultChatId?: string;
}

class ChannelNotRegisteredError extends DomainError {}

type NotificationSendEnvelope = Envelope<z.infer<typeof NotificationSendV1.schema>>;

@Injectable()
export class SendNotificationUseCase {
  private readonly registry: NotificationChannelRegistry;
  private readonly renderer: TemplateRenderer;
  private readonly options: SendNotificationUseCaseOptions;

  constructor(
    @Inject(NOTIFICATION_CHANNEL_REGISTRY) registry: NotificationChannelRegistry,
    @Inject(TEMPLATE_RENDERER) renderer: TemplateRenderer,
    options: SendNotificationUseCaseOptions,
  ) {
    this.registry = registry;
    this.renderer = renderer;
    this.options = options;
  }

  async execute(envelope: NotificationSendEnvelope): Promise<void> {
    const { channel: kind, recipient, template, variables } = envelope.payload;

    const channel = this.registry.resolve(kind);
    if (!channel) {
      throw new ChannelNotRegisteredError(`No channel registered for kind: ${kind}`, { kind });
    }

    const chatId = recipient.chatId ?? this.options.defaultChatId;
    if (chatId === undefined || chatId.length === 0) {
      throw new RecipientResolutionError(
        'Cannot resolve chatId: payload.recipient.chatId is empty and no default configured',
      );
    }

    let body: string;
    try {
      body = this.renderer.render(template, variables);
    } catch (error) {
      throw new TemplateError(
        `Failed to render template ${template}`,
        error instanceof Error ? { cause: error.message } : { error: String(error) },
      );
    }

    await channel.send({ channel: kind, recipient: { chatId }, body });
  }
}
