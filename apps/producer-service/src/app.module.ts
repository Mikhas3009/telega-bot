import { LoggerModule } from '@app/logger';
import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { ConfigModule } from './config/config.module.js';
import { AsyncApiController } from './docs/asyncapi.controller.js';
import { HealthModule } from './health/health.module.js';
import { MessagingModule } from './infrastructure/messaging/messaging.module.js';
import { GlobalExceptionFilter } from './interfaces/http/filters/global-exception.filter.js';
import { HttpModule } from './interfaces/http/http.module.js';
import { CorrelationIdInterceptor } from './interfaces/http/interceptors/correlation-id.interceptor.js';

/* eslint-disable @typescript-eslint/no-extraneous-class -- NestJS module pattern */
@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({ service: 'producer-service' }),
    MessagingModule.forRoot(),
    HttpModule,
    HealthModule,
  ],
  controllers: [AsyncApiController],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
  ],
})
export class AppModule {}
/* eslint-enable @typescript-eslint/no-extraneous-class */
