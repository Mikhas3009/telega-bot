import { IDEMPOTENCY_STORE, type IdempotencyStore } from '@app/messaging';
import { Module, type DynamicModule } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { CONSUMER_CONFIG, type ConsumerConfig } from '../../config/config.schema.js';

import { RedisIdempotencyStore } from './redis-idempotency-store.js';
import { REDIS_CLIENT, RedisModule } from './redis.module.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class IdempotencyModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: IdempotencyModule,
      imports: [RedisModule.forRoot()],
      providers: [
        {
          provide: IDEMPOTENCY_STORE,
          inject: [REDIS_CLIENT, CONSUMER_CONFIG],
          useFactory: (redis: Redis, cfg: ConsumerConfig): IdempotencyStore =>
            new RedisIdempotencyStore(redis, {
              inProgressGraceSeconds: cfg.IDEMPOTENCY_IN_PROGRESS_GRACE_SECONDS,
            }),
        },
      ],
      exports: [IDEMPOTENCY_STORE],
      global: true,
    };
  }
}
