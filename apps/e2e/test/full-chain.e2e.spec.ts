import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule as ConsumerAppModule } from 'consumer-service/app.module.js';
import { AppModule as NotificationAppModule } from 'notification-service/app.module.js';
import { AppModule as ProducerAppModule } from 'producer-service/app.module.js';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startRabbitMQ, type StartedBroker } from './helpers/rabbitmq.testcontainer.js';
import { startRedis, type StartedRedis } from './helpers/redis.testcontainer.js';
import { startFakeTelegram, type FakeTelegram } from './helpers/wiremock-telegram.js';

describe('full event chain — Producer → Consumer → Notification → Telegram', () => {
  let broker: StartedBroker;
  let redis: StartedRedis;
  let telegram: FakeTelegram;
  let producer: INestApplication;
  let consumer: INestApplication;
  let notification: INestApplication;

  beforeAll(async () => {
    broker = await startRabbitMQ();
    redis = await startRedis();
    telegram = await startFakeTelegram();

    process.env.RABBITMQ_URL = broker.amqpUrl;
    process.env.REDIS_URL = redis.url;
    process.env.TELEGRAM_BASE_URL = telegram.url;
    process.env.TELEGRAM_BOT_TOKEN = 'TEST_BOT';
    process.env.TELEGRAM_DEFAULT_CHAT_ID = '999';

    const producerRef = await Test.createTestingModule({ imports: [ProducerAppModule] }).compile();
    producer = producerRef.createNestApplication({ bufferLogs: true });
    await producer.init();

    const consumerRef = await Test.createTestingModule({ imports: [ConsumerAppModule] }).compile();
    consumer = consumerRef.createNestApplication({ bufferLogs: true });
    await consumer.init();

    const notificationRef = await Test.createTestingModule({
      imports: [NotificationAppModule],
    }).compile();
    notification = notificationRef.createNestApplication({ bufferLogs: true });
    await notification.init();
  }, 180_000);

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (producer) await producer.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (consumer) await consumer.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (notification) await notification.close();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (telegram) await telegram.stop();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (broker) await broker.stop();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (redis) await redis.stop();
  }, 60_000);

  const waitFor = async (predicate: () => boolean, timeoutMs = 15_000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (predicate()) return;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('waitFor timeout');
  };

  it('POST /events → Consumer handler → Notification → Telegram POST /sendMessage', async () => {
    const sendMessageCalls = () => telegram.calls.filter((c) => c.path.endsWith('/sendMessage'));
    const before = sendMessageCalls().length;
    const correlationId = '11111111-1111-4111-8111-111111111111';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const res = await request(producer.getHttpServer())
      .post('/events')
      .set('x-correlation-id', correlationId)
      .send({
        type: 'USER_REGISTERED',
        payload: {
          userId: '00000000-0000-4000-8000-000000000000',
          email: 'user@example.com',
          registeredAt: '2026-05-04T12:00:00.000Z',
        },
      });

    expect(res.status).toBe(202);
    const accepted = res.body as { eventId: string; publishedAt: string };
    expect(accepted.eventId).toMatch(/^[0-9a-f-]{36}$/i);

    await waitFor(() => sendMessageCalls().length > before);

    const call = sendMessageCalls().at(-1);
    expect(call?.method).toBe('POST');
    expect(call?.path).toContain('/botTEST_BOT/sendMessage');
    const body = call?.body as { chat_id: string; text: string };
    expect(body.chat_id).toBe('999');
    expect(body.text).toContain('user@example.com');
  }, 60_000);

  it('reports all health-ready endpoints', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const producerHealth = await request(producer.getHttpServer()).get('/health/ready');
    expect(producerHealth.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const consumerHealth = await request(consumer.getHttpServer()).get('/health/ready');
    expect(consumerHealth.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const notificationHealth = await request(notification.getHttpServer()).get('/health/ready');
    expect(notificationHealth.status).toBe(200);
  }, 30_000);
});
