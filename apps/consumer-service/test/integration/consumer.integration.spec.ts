import 'reflect-metadata';

import { Topology, UserRegisteredV1, messageEnvelope } from '@app/contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import amqplib, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';

import { startRabbitMQ, type StartedBroker } from './helpers/rabbitmq.testcontainer.js';
import { startRedis, type StartedRedis } from './helpers/redis.testcontainer.js';

const NOTIFICATION_QUEUE = 'test.notification.send.q';

interface CapturedNotification {
  routingKey: string;
  body: { eventName: string; payload: unknown; correlationId: string; causationId?: string };
}

describe('consumer-service integration — happy path', () => {
  let broker: StartedBroker;
  let redis: StartedRedis;
  let app: INestApplication;
  let inputConn: ChannelModel;
  let inputCh: Channel;
  let outputConn: ChannelModel;
  let outputCh: Channel;
  const captured: CapturedNotification[] = [];

  beforeAll(async () => {
    broker = await startRabbitMQ();
    redis = await startRedis();
    process.env.RABBITMQ_URL = broker.amqpUrl;
    process.env.REDIS_URL = redis.url;
    process.env.PORT = '0';

    // Sniffer for downstream notification.send.v1
    outputConn = await amqplib.connect(broker.amqpUrl);
    outputCh = await outputConn.createChannel();
    await outputCh.assertExchange(Topology.exchanges.events.name, 'topic', { durable: true });
    await outputCh.assertQueue(NOTIFICATION_QUEUE, { durable: false, autoDelete: true });
    await outputCh.bindQueue(
      NOTIFICATION_QUEUE,
      Topology.exchanges.events.name,
      'notification.send.v1',
    );
    await outputCh.consume(
      NOTIFICATION_QUEUE,
      (m: ConsumeMessage | null) => {
        if (!m) return;
        const body = JSON.parse(m.content.toString('utf8')) as CapturedNotification['body'];
        captured.push({ routingKey: m.fields.routingKey, body });
        outputCh.ack(m);
      },
      { noAck: false },
    );

    // Boot the consumer app
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    await app.init();
    await app.listen(0);

    // Publisher into events.topic (seed UserRegisteredV1)
    inputConn = await amqplib.connect(broker.amqpUrl);
    inputCh = await inputConn.createChannel();
  }, 90_000);

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await inputCh?.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await inputConn?.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await outputCh?.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await outputConn?.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await app?.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await broker?.stop();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- variables may be unset if beforeAll fails
    await redis?.stop();
  }, 60_000);

  const publishUserRegistered = (eventId: string, correlationId: string): void => {
    const envelope = messageEnvelope(UserRegisteredV1.schema).parse({
      eventId,
      eventName: UserRegisteredV1.name,
      schemaVersion: 1,
      occurredAt: '2026-05-04T12:00:00.000Z',
      correlationId,
      producer: 'producer-service',
      payload: {
        userId: '22222222-2222-4222-8222-222222222222',
        email: 'user@example.com',
        registeredAt: '2026-05-04T12:00:00.000Z',
      },
    });
    inputCh.publish(
      Topology.exchanges.events.name,
      'user.registered.v1',
      Buffer.from(JSON.stringify(envelope), 'utf8'),
      { persistent: true, contentType: 'application/json' },
    );
  };

  const waitForCapture = async (predicate: () => boolean, timeoutMs = 10_000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate()) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('waitForCapture timeout');
  };

  it('processes a UserRegisteredV1 and publishes NotificationSendV1', async () => {
    captured.length = 0;
    const eventId = '00000000-0000-4000-8000-000000000001';
    const correlationId = '11111111-1111-4111-8111-111111111111';

    publishUserRegistered(eventId, correlationId);
    await waitForCapture(() => captured.length >= 1);

    expect(captured).toHaveLength(1);
    expect(captured[0]?.routingKey).toBe('notification.send.v1');
    expect(captured[0]?.body).toMatchObject({
      eventName: 'notification.send.v1',
      correlationId,
      causationId: eventId,
      payload: {
        channel: 'telegram',
        template: 'user-welcome',
        variables: { email: 'user@example.com' },
      },
    });
  }, 30_000);

  it('does not republish a duplicate eventId (idempotency)', async () => {
    captured.length = 0;
    const eventId = '00000000-0000-4000-8000-000000000002';
    const correlationId = '22222222-2222-4222-8222-222222222222';

    publishUserRegistered(eventId, correlationId);
    await waitForCapture(() => captured.length >= 1);
    expect(captured).toHaveLength(1);

    // Re-publish same eventId — consumer must skip it
    publishUserRegistered(eventId, correlationId);
    await new Promise((r) => setTimeout(r, 1_500));
    expect(captured).toHaveLength(1);
  }, 30_000);

  it('reports both health indicators OK on /health/ready', async () => {
    const httpServer = app.getHttpServer() as { address: () => { port: number } | string | null };
    const address = httpServer.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    expect(port).toBeGreaterThan(0);

    const res = await fetch(`http://127.0.0.1:${String(port)}/health/ready`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  }, 15_000);
});
