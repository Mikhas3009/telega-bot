import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { loadConfig } from './load-config.js';

const Schema = z.object({
  PORT: z.coerce.number().default(3000),
  RABBITMQ_URL: z.string().url(),
});

describe('loadConfig', () => {
  it('parses and coerces values', () => {
    const cfg = loadConfig(Schema, {
      PORT: '4000',
      RABBITMQ_URL: 'amqp://localhost:5672',
    });
    expect(cfg).toEqual({ PORT: 4000, RABBITMQ_URL: 'amqp://localhost:5672' });
  });

  it('applies defaults', () => {
    const cfg = loadConfig(Schema, { RABBITMQ_URL: 'amqp://localhost:5672' });
    expect(cfg.PORT).toBe(3000);
  });

  it('throws a readable error on validation failure', () => {
    expect(() =>
      loadConfig(Schema, { PORT: 'not-a-number', RABBITMQ_URL: 'not-a-url' }),
    ).toThrowError(/RABBITMQ_URL/);
  });
});
