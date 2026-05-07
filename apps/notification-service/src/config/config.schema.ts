import { z } from 'zod';

export const NotificationConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().nonnegative().default(3002),
  RABBITMQ_URL: z.string().url(),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  SERVICE_NAME: z.string().min(1).default('notification-service'),
  EVENTS_EXCHANGE: z.string().min(1).default('events.topic'),
  NOTIFICATION_QUEUE: z.string().min(1).default('notification.send.q'),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
  IDEMPOTENCY_IN_PROGRESS_GRACE_SECONDS: z.coerce.number().int().positive().default(60),
  TELEGRAM_BASE_URL: z.string().url().default('https://api.telegram.org'),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_DEFAULT_CHAT_ID: z.string().min(1),
  TELEGRAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  TELEGRAM_BREAKER_ERROR_THRESHOLD_PCT: z.coerce.number().int().min(1).max(100).default(50),
  TELEGRAM_BREAKER_ROLLING_WINDOW_MS: z.coerce.number().int().positive().default(10_000),
  TELEGRAM_BREAKER_RESET_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
});

export type NotificationConfig = z.infer<typeof NotificationConfigSchema>;

export const NOTIFICATION_CONFIG = Symbol('NOTIFICATION_CONFIG');
