import 'reflect-metadata';
import { NotificationSendV1, Topology, messageEnvelope } from '@app/contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import amqplib, { type Channel, type ChannelModel } from 'amqplib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';

import { startRabbitMQ, type StartedBroker } from './helpers/rabbitmq.testcontainer.js';
import { startRedis, type StartedRedis } from './helpers/redis.testcontainer.js';
import { startFakeTelegram, type FakeTelegram } from './helpers/wiremock-telegram.js';

describe('notification-service integration — happy path', () => {
  let broker: StartedBroker;
  let redis: StartedRedis;
  let telegram: FakeTelegram;
  let app: INestApplication;
  let pubConn: ChannelModel;
  let pubCh: Channel;

  beforeAll(async () => {
    broker = await startRabbitMQ();
    redis = await startRedis();
    telegram = await startFakeTelegram();
    process.env.RABBITMQ_URL = broker.amqpUrl;
    process.env.REDIS_URL = redis.url;
    process.env.PORT = '0';
    process.env.TELEGRAM_BASE_URL = telegram.url;
    process.env.TELEGRAM_BOT_TOKEN = 'TEST_BOT';
    process.env.TELEGRAM_DEFAULT_CHAT_ID = '999';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    await app.init();
    await app.listen(0);

    pubConn = await amqplib.connect(broker.amqpUrl);
    pubCh = await pubConn.createChannel();
    await pubCh.assertExchange(Topology.exchanges.events.name, 'topic', { durable: true });
  }, 120_000);

  afterAll(async () => {
    await pubCh.close();
    await pubConn.close();
    await app.close();
    await telegram.stop();
    await broker.stop();
    await redis.stop();
  }, 60_000);

  const publishNotificationSend = (eventId: string): void => {
    const envelope = messageEnvelope(NotificationSendV1.schema).parse({
      eventId,
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
      },
    });
    pubCh.publish(
      Topology.exchanges.events.name,
      'notification.send.v1',
      Buffer.from(JSON.stringify(envelope), 'utf8'),
      { persistent: true, contentType: 'application/json' },
    );
  };

  const waitFor = async (predicate: () => boolean, timeoutMs = 10_000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate()) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('waitFor timeout');
  };

  it('processes a NotificationSendV1 and POSTs to Telegram sendMessage', async () => {
    const sendMessageCalls = () => telegram.calls.filter((c) => c.path.endsWith('/sendMessage'));
    const before = sendMessageCalls().length;

    publishNotificationSend('00000000-0000-4000-8000-000000000001');
    await waitFor(() => sendMessageCalls().length > before);

    const call = sendMessageCalls().at(-1);
    expect(call?.method).toBe('POST');
    expect(call?.path).toContain('/botTEST_BOT/sendMessage');
    const body = call?.body as { chat_id: string; text: string };
    expect(body.chat_id).toBe('999');
    expect(body.text).toContain('user@example.com');
  }, 60_000);

  it('does not POST again on duplicate eventId (idempotency)', async () => {
    const sendMessageCalls = () => telegram.calls.filter((c) => c.path.endsWith('/sendMessage'));
    const eventId = '00000000-0000-4000-8000-000000000002';

    publishNotificationSend(eventId);
    await waitFor(() => sendMessageCalls().length >= 2);
    const afterFirst = sendMessageCalls().length;

    publishNotificationSend(eventId);
    await new Promise((r) => setTimeout(r, 1_500));
    expect(sendMessageCalls().length).toBe(afterFirst);
  }, 60_000);

  it('reports all three health indicators on /health/ready', async () => {
    const httpServer = app.getHttpServer() as { address: () => { port: number } | string | null };
    const address = httpServer.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;
    expect(port).toBeGreaterThan(0);

    const res = await fetch(`http://127.0.0.1:${String(port)}/health/ready`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; details: Record<string, unknown> };
    expect(body.status).toBe('ok');
    expect(body.details).toHaveProperty('rabbitmq');
    expect(body.details).toHaveProperty('redis');
    expect(body.details).toHaveProperty('telegram');
  }, 30_000);
});
