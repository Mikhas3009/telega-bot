/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
// supertest .body is typed as `any` and getHttpServer() returns `any`; rules suppressed for spec.
import 'reflect-metadata';

import { Topology } from '@app/contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../../src/app.module.js';
import { setupSwagger } from '../../src/docs/swagger.bootstrap.js';

import { consumeOnce } from './helpers/consume-once.js';
import { startRabbitMQ, type StartedBroker } from './helpers/rabbitmq.testcontainer.js';

describe('producer-service e2e — happy path', () => {
  let broker: StartedBroker;
  let app: INestApplication;

  beforeAll(async () => {
    broker = await startRabbitMQ();
    process.env.RABBITMQ_URL = broker.amqpUrl;
    // PORT is not used in tests (no app.listen call); keep schema-valid value.
    process.env.PORT = '3099';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    // ValidationPipe is registered via APP_PIPE inside AppModule; no duplicate needed here.
    setupSwagger(app);
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await broker.stop();
  }, 60_000);

  it('publishes a USER_REGISTERED event to events.topic with correct envelope', async () => {
    let res: request.Response;

    const message = await consumeOnce(
      broker.amqpUrl,
      Topology.exchanges.events.name,
      'user.registered.v1',
      async () => {
        res = await request(app.getHttpServer())
          .post('/events')
          .set('x-correlation-id', '11111111-1111-4111-8111-111111111111')
          .send({
            type: 'USER_REGISTERED',
            payload: {
              userId: '00000000-0000-4000-8000-000000000000',
              email: 'user@example.com',
              registeredAt: '2026-05-04T12:00:00.000Z',
            },
          });
      },
    );

    expect(res!.status).toBe(202);
    expect(res!.body).toMatchObject({
      eventId: expect.any(String),
      publishedAt: expect.any(String),
    });

    expect(message.routingKey).toBe('user.registered.v1');
    expect(message.body).toMatchObject({
      eventId: res!.body.eventId,
      eventName: 'user.registered.v1',
      schemaVersion: 1,
      correlationId: '11111111-1111-4111-8111-111111111111',
      producer: 'producer-service',
      payload: {
        userId: '00000000-0000-4000-8000-000000000000',
        email: 'user@example.com',
        registeredAt: '2026-05-04T12:00:00.000Z',
      },
    });
    expect(message.headers['x-event-name']).toBe('user.registered.v1');
  }, 30_000);

  it('returns 400 on invalid payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .send({ type: 'USER_REGISTERED', payload: { userId: 'not-a-uuid', email: 'a@b.co' } });

    expect(res.status).toBe(400);
  });

  it('returns 200 on /health/live and /health/ready', async () => {
    const live = await request(app.getHttpServer()).get('/health/live');
    expect(live.status).toBe(200);
    const ready = await request(app.getHttpServer()).get('/health/ready');
    expect(ready.status).toBe(200);
  });

  it('exposes Swagger on /docs', async () => {
    const res = await request(app.getHttpServer()).get('/docs').redirects(2);
    expect(res.status).toBe(200);
  });

  it('exposes AsyncAPI JSON on /asyncapi/json', async () => {
    const res = await request(app.getHttpServer()).get('/asyncapi/json');
    expect(res.status).toBe(200);
    expect(res.body.asyncapi).toBe('3.0.0');
    expect(res.body.channels['user.registered.v1']).toBeDefined();
  });
});
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
