import type { CaptureResult, IdempotencyStatus, IdempotencyStore } from '@app/messaging';
import { Inject, Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { CAPTURE_SCRIPT } from './lua-scripts.js';
import { REDIS_CLIENT } from './redis.module.js';

export interface RedisIdempotencyStoreOptions {
  inProgressGraceSeconds: number;
  /** Override Date.now() for deterministic tests. */
  now?: () => number;
}

@Injectable()
export class RedisIdempotencyStore implements IdempotencyStore {
  private readonly redis: Redis;
  private readonly inProgressGraceSeconds: number;
  private readonly now: () => number;

  constructor(
    @Inject(REDIS_CLIENT) redis: Redis,
    options: RedisIdempotencyStoreOptions = { inProgressGraceSeconds: 60 },
  ) {
    this.redis = redis;
    this.inProgressGraceSeconds = options.inProgressGraceSeconds;
    this.now = options.now ?? (() => Date.now());
  }

  async capture(key: string, ttlSeconds: number): Promise<CaptureResult> {
    const result = await this.redis.eval(
      CAPTURE_SCRIPT,
      1,
      key,
      String(ttlSeconds),
      String(this.inProgressGraceSeconds),
      String(this.now()),
    );
    return { status: result as IdempotencyStatus };
  }

  async complete(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, 'COMPLETED', 'EX', ttlSeconds);
  }

  async release(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
