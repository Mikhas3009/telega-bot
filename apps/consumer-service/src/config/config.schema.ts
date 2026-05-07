import { z } from 'zod';

export const ConsumerConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().nonnegative().default(3001),
  RABBITMQ_URL: z.string().url(),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  CONSUMER_NAME: z.string().min(1).default('consumer-service'),
  EVENTS_EXCHANGE: z.string().min(1).default('events.topic'),
  USER_REGISTERED_QUEUE: z.string().min(1).default('consumer.user-registered.q'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
  IDEMPOTENCY_IN_PROGRESS_GRACE_SECONDS: z.coerce.number().int().positive().default(60),
});

export type ConsumerConfig = z.infer<typeof ConsumerConfigSchema>;

export const CONSUMER_CONFIG = Symbol('CONSUMER_CONFIG');
