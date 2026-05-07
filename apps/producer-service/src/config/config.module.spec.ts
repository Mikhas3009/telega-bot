import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { ConfigModule } from './config.module.js';
import { PRODUCER_CONFIG, type ProducerConfig } from './config.schema.js';

describe('ConfigModule', () => {
  it('exposes parsed config under PRODUCER_CONFIG token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          source: {
            RABBITMQ_URL: 'amqp://localhost:5672',
          },
        }),
      ],
    }).compile();

    const cfg = moduleRef.get<ProducerConfig>(PRODUCER_CONFIG);
    expect(cfg.PORT).toBe(3000);
    expect(cfg.RABBITMQ_URL).toBe('amqp://localhost:5672');
    expect(cfg.PRODUCER_NAME).toBe('producer-service');
    await moduleRef.close();
  });

  it('throws on invalid config', async () => {
    await expect(
      Test.createTestingModule({
        imports: [ConfigModule.forRoot({ source: { RABBITMQ_URL: 'not-a-url' } })],
      }).compile(),
    ).rejects.toThrow(/RABBITMQ_URL/);
  });
});
