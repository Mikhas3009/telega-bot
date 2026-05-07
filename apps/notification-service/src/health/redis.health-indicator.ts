import { Inject, Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, type HealthIndicatorResult } from '@nestjs/terminus';
import type { Redis } from 'ioredis';

import { REDIS_CLIENT } from '../infrastructure/idempotency/redis.module.js';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly redis: Redis;

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    super();
    this.redis = redis;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong: string = await this.redis.ping();
      if (pong !== 'PONG') {
        throw new Error(`unexpected PING response: ${pong}`);
      }
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis not reachable',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
