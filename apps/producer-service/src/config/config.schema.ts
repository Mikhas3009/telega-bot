import { z } from 'zod';

export const ProducerConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  RABBITMQ_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  PRODUCER_NAME: z.string().min(1).default('producer-service'),
  EVENTS_EXCHANGE: z.string().min(1).default('events.topic'),
  RABBITMQ_PUBLISH_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
});

export type ProducerConfig = z.infer<typeof ProducerConfigSchema>;

export const PRODUCER_CONFIG = Symbol('PRODUCER_CONFIG');
