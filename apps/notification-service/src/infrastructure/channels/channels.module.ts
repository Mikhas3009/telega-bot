import { Module, type DynamicModule } from '@nestjs/common';

import { HTTP_CLIENT, type HttpClient } from '../../application/ports/http-client.port.js';
import {
  NOTIFICATION_CHANNEL_REGISTRY,
  type NotificationChannel,
  type NotificationChannelRegistry,
} from '../../application/ports/notification-channel.port.js';
import { NOTIFICATION_CONFIG, type NotificationConfig } from '../../config/config.schema.js';

import { CircuitBreakerChannel } from './circuit-breaker.channel.js';
import { TelegramChannel } from './telegram/telegram.channel.js';

class StaticChannelRegistry implements NotificationChannelRegistry {
  private readonly byKind: Map<string, NotificationChannel>;

  constructor(channels: NotificationChannel[]) {
    this.byKind = new Map(channels.map((c) => [c.kind, c]));
  }

  resolve(kind: string): NotificationChannel | undefined {
    return this.byKind.get(kind);
  }
}

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({})
export class ChannelsModule {
  /* eslint-enable @typescript-eslint/no-extraneous-class */
  static forRoot(): DynamicModule {
    return {
      module: ChannelsModule,
      providers: [
        {
          provide: NOTIFICATION_CHANNEL_REGISTRY,
          inject: [HTTP_CLIENT, NOTIFICATION_CONFIG],
          useFactory: (http: HttpClient, cfg: NotificationConfig): NotificationChannelRegistry => {
            const telegram = new TelegramChannel(http, {
              baseUrl: cfg.TELEGRAM_BASE_URL,
              botToken: cfg.TELEGRAM_BOT_TOKEN,
              timeoutMs: cfg.TELEGRAM_TIMEOUT_MS,
            });
            const wrapped = new CircuitBreakerChannel(telegram, {
              errorThresholdPercentage: cfg.TELEGRAM_BREAKER_ERROR_THRESHOLD_PCT,
              rollingCountTimeout: cfg.TELEGRAM_BREAKER_ROLLING_WINDOW_MS,
              resetTimeout: cfg.TELEGRAM_BREAKER_RESET_TIMEOUT_MS,
            });
            return new StaticChannelRegistry([wrapped]);
          },
        },
      ],
      exports: [NOTIFICATION_CHANNEL_REGISTRY],
      global: true,
    };
  }
}
