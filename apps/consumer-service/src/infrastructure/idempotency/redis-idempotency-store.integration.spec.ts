import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import IORedis, { type Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { RedisIdempotencyStore } from './redis-idempotency-store.js';

describe('RedisIdempotencyStore (integration)', () => {
  let container: StartedRedisContainer;
  let client: Redis;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7.4-alpine').start();
    client = new IORedis(container.getConnectionUrl(), { maxRetriesPerRequest: 3 });
  }, 60_000);

  afterAll(async () => {
    await client.quit();
    await container.stop();
  }, 60_000);

  beforeEach(async () => {
    await client.flushdb();
  });

  const buildStore = (now: () => number, graceSeconds = 60): RedisIdempotencyStore =>
    new RedisIdempotencyStore(client, { inProgressGraceSeconds: graceSeconds, now });

  it('returns CAPTURED on a fresh key', async () => {
    const store = buildStore(() => 1_000_000);
    const result = await store.capture('idem:test:1', 60);
    expect(result.status).toBe('CAPTURED');

    const raw = await client.get('idem:test:1');
    expect(raw).toBe('IN_PROGRESS:1000000');
  });

  it('returns COMPLETED on an already-completed key', async () => {
    const store = buildStore(() => 1_000_000);
    await client.set('idem:test:2', 'COMPLETED', 'EX', 60);
    const result = await store.capture('idem:test:2', 60);
    expect(result.status).toBe('COMPLETED');
  });

  it('returns IN_PROGRESS for a recent in-flight capture', async () => {
    const store = buildStore(() => 1_000_000);
    await store.capture('idem:test:3', 60);
    const result = await store.capture('idem:test:3', 60);
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('returns CAPTURED when an in-progress entry is older than the grace period', async () => {
    let now = 1_000_000;
    const store = buildStore(() => now, 60);
    await store.capture('idem:test:4', 600);
    now += 61_000;
    const result = await store.capture('idem:test:4', 600);
    expect(result.status).toBe('CAPTURED');

    const raw = await client.get('idem:test:4');
    expect(raw).toBe('IN_PROGRESS:1061000');
  });

  it('complete() writes COMPLETED with a fresh TTL', async () => {
    const store = buildStore(() => 1_000_000);
    await store.capture('idem:test:5', 600);
    await store.complete('idem:test:5', 60);

    const raw = await client.get('idem:test:5');
    expect(raw).toBe('COMPLETED');
    const ttl = await client.ttl('idem:test:5');
    expect(ttl).toBeGreaterThan(50);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it('release() deletes the key', async () => {
    const store = buildStore(() => 1_000_000);
    await store.capture('idem:test:6', 60);
    await store.release('idem:test:6');
    const raw = await client.get('idem:test:6');
    expect(raw).toBeNull();
  });

  it('respects TTL on capture', async () => {
    const store = buildStore(() => 1_000_000);
    await store.capture('idem:test:7', 5);
    const ttl = await client.ttl('idem:test:7');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(5);
  });
});
