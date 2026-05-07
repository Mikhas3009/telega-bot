import { messageEnvelope, UserRegisteredV1 } from '@app/contracts';
import { describe, expect, it } from 'vitest';

import type { MessageBus, PublishOptions } from '../ports/message-bus.port.js';

import { DomainEventPublisher } from './domain-event-publisher.js';

const validPayload = {
  userId: '00000000-0000-4000-8000-000000000000',
  email: 'user@example.com',
  registeredAt: '2026-05-04T12:00:00.000Z',
};

const fakeBus = (): {
  bus: MessageBus;
  published: { options: PublishOptions; body: Buffer }[];
} => {
  const published: { options: PublishOptions; body: Buffer }[] = [];
  return {
    published,
    bus: {
      publish: (options: PublishOptions, body: Buffer) => {
        published.push({ options, body });
        return Promise.resolve();
      },
    },
  };
};

describe('DomainEventPublisher', () => {
  it('publishes to the routing key from the event definition', async () => {
    const { bus, published } = fakeBus();
    const publisher = new DomainEventPublisher(bus, {
      exchange: 'events.topic',
      producerName: 'producer-service',
    });

    await publisher.publish(UserRegisteredV1, validPayload);

    expect(published).toHaveLength(1);
    expect(published[0].options.routingKey).toBe('user.registered.v1');
    expect(published[0].options.exchange).toBe('events.topic');
  });

  it('wraps payload in a valid envelope', async () => {
    const { bus, published } = fakeBus();
    const publisher = new DomainEventPublisher(bus, {
      exchange: 'events.topic',
      producerName: 'producer-service',
    });

    await publisher.publish(UserRegisteredV1, validPayload);

    const envelope = JSON.parse(published[0].body.toString('utf8')) as unknown;
    const Envelope = messageEnvelope(UserRegisteredV1.schema);
    expect(() => Envelope.parse(envelope)).not.toThrow();
  });

  it('uses provided eventId and correlationId when overrides are passed', async () => {
    const { bus, published } = fakeBus();
    const publisher = new DomainEventPublisher(bus, {
      exchange: 'events.topic',
      producerName: 'producer-service',
    });

    const result = await publisher.publish(UserRegisteredV1, validPayload, {
      eventId: '99999999-9999-4999-8999-999999999999',
      correlationId: '88888888-8888-4888-8888-888888888888',
    });

    expect(result.eventId).toBe('99999999-9999-4999-8999-999999999999');
    const envelope = JSON.parse(published[0].body.toString('utf8')) as {
      correlationId: string;
    };
    expect(envelope.correlationId).toBe('88888888-8888-4888-8888-888888888888');
  });
});
