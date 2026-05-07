import type { LoggerModuleAsyncParams } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';

import { CorrelationContext } from './correlation.context.js';

export interface PinoConfigInput {
  service: string;
  level?: string;
  pretty?: boolean;
}

export const buildPinoOptions = (input: PinoConfigInput): PinoHttpOptions => {
  const transport = input.pretty
    ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
    : undefined;

  return {
    level: input.level ?? 'info',
    base: { service: input.service },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.payload.email',
        '*.payload.phone',
        'TELEGRAM_BOT_TOKEN',
      ],
      censor: '[REDACTED]',
    },
    mixin: () => {
      const ctx = CorrelationContext.current();
      return ctx
        ? {
            correlationId: ctx.correlationId,
            ...(ctx.causationId !== undefined ? { causationId: ctx.causationId } : {}),
          }
        : {};
    },
    ...(transport ? { transport } : {}),
  };
};

export const buildLoggerModuleParams = (input: PinoConfigInput): LoggerModuleAsyncParams => ({
  useFactory: () => ({ pinoHttp: buildPinoOptions(input) }),
});
