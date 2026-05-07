import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module.js';
import { HealthModule } from './health/health.module.js';
import { ChannelsModule } from './infrastructure/channels/channels.module.js';
import { HttpModule } from './infrastructure/http/http.module.js';
import { IdempotencyModule } from './infrastructure/idempotency/idempotency.module.js';
import { ConsumerModule } from './infrastructure/messaging/consumer.module.js';
import { TemplatesModule } from './infrastructure/templates/templates.module.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({ service: 'notification-service' }),
    HttpModule.forRoot(),
    TemplatesModule.forRoot(),
    ChannelsModule.forRoot(),
    IdempotencyModule.forRoot(),
    ConsumerModule.forRoot(),
    HealthModule,
  ],
})
export class AppModule {}
/* eslint-enable @typescript-eslint/no-extraneous-class */
