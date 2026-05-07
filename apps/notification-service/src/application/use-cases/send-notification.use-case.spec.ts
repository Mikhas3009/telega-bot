import { NotificationSendV1, messageEnvelope } from '@app/contracts';
import type { Envelope } from '@app/contracts';
import { describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';

import type { NotificationMessage } from '../domain/notification-message.js';
import { RecipientResolutionError } from '../domain/notification.errors.js';
import type {
  NotificationChannel,
  NotificationChannelRegistry,
} from '../ports/notification-channel.port.js';
import type { TemplateRenderer } from '../ports/template-renderer.port.js';

import { SendNotificationUseCase } from './send-notification.use-case.js';

const buildEnvelope = (overrides?: Partial<z.infer<typeof NotificationSendV1.schema>>) =>
  messageEnvelope(NotificationSendV1.schema).parse({
    eventId: '00000000-0000-4000-8000-000000000001',
    eventName: NotificationSendV1.name,
    schemaVersion: 1,
    occurredAt: '2026-05-04T12:00:00.000Z',
    correlationId: '11111111-1111-4111-8111-111111111111',
    causationId: '22222222-2222-4222-8222-222222222222',
    producer: 'consumer-service',
    payload: {
      channel: 'telegram',
      recipient: {},
      template: 'user-welcome',
      variables: { email: 'user@example.com' },
      ...overrides,
    },
  }) as Envelope<z.infer<typeof NotificationSendV1.schema>>;

interface FakeRenderer extends TemplateRenderer {
  renderMock: ReturnType<typeof vi.fn>;
}

const fakeRenderer = (output: string): FakeRenderer => {
  const renderMock = vi.fn().mockReturnValue(output);
  return {
    renderMock,
    render: renderMock as TemplateRenderer['render'],
  };
};

interface FakeChannel extends NotificationChannel {
  sent: NotificationMessage[];
}

const fakeChannel = (kind = 'telegram'): FakeChannel => ({
  kind,
  sent: [],
  send(msg: NotificationMessage): Promise<void> {
    this.sent.push(msg);
    return Promise.resolve();
  },
});

const registryFor = (...channels: NotificationChannel[]): NotificationChannelRegistry => ({
  resolve: (kind) => channels.find((c) => c.kind === kind),
});

describe('SendNotificationUseCase', () => {
  it('renders template, resolves chatId from default, and sends via the right channel', async () => {
    const renderer = fakeRenderer('Welcome user@example.com');
    const channel = fakeChannel('telegram');
    const useCase = new SendNotificationUseCase(registryFor(channel), renderer, {
      defaultChatId: 'default-chat',
    });

    await useCase.execute(buildEnvelope());

    expect(channel.sent).toHaveLength(1);
    expect(channel.sent[0]).toEqual({
      channel: 'telegram',
      recipient: { chatId: 'default-chat' },
      body: 'Welcome user@example.com',
    });
    expect(renderer.renderMock).toHaveBeenCalledWith('user-welcome', { email: 'user@example.com' });
  });

  it('uses recipient.chatId from payload when present', async () => {
    const renderer = fakeRenderer('Hi');
    const channel = fakeChannel('telegram');
    const useCase = new SendNotificationUseCase(registryFor(channel), renderer, {
      defaultChatId: 'default',
    });

    await useCase.execute(
      buildEnvelope({
        recipient: { chatId: 'specific-chat' },
        template: 'user-welcome',
        variables: {},
      }),
    );

    expect(channel.sent[0]?.recipient.chatId).toBe('specific-chat');
  });

  it('throws RecipientResolutionError when no chatId is available anywhere', async () => {
    const useCase = new SendNotificationUseCase(registryFor(fakeChannel()), fakeRenderer('x'), {});

    await expect(useCase.execute(buildEnvelope())).rejects.toBeInstanceOf(RecipientResolutionError);
  });

  it('throws when the channel for the requested kind is not registered', async () => {
    const useCase = new SendNotificationUseCase(
      registryFor(fakeChannel('email')),
      fakeRenderer('x'),
      { defaultChatId: 'd' },
    );

    await expect(useCase.execute(buildEnvelope())).rejects.toThrow(/telegram/);
  });
});
