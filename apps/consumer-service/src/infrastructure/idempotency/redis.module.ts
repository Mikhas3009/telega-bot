import {
  Inject,
  Injectable,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
} from '@nestjs/common';
import IORedis, { type Redis } from 'ioredis';

import { CONSUMER_CONFIG, type ConsumerConfig } from '../../config/config.schema.js';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Injectable()
export class RedisLifecycle implements OnApplicationShutdown {
  private readonly client: Redis;

  constructor(@Inject(REDIS_CLIENT) client: Redis) {
    this.client = client;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class RedisModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [CONSUMER_CONFIG],
          useFactory: (cfg: ConsumerConfig): Redis =>
            new IORedis(cfg.REDIS_URL, {
              lazyConnect: false,
              maxRetriesPerRequest: 3,
              enableReadyCheck: true,
            }),
        },
        RedisLifecycle,
      ],
      exports: [REDIS_CLIENT],
      global: true,
    };
  }
}
