import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as NestPinoLogger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { NOTIFICATION_CONFIG, type NotificationConfig } from './config/config.schema.js';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(NestPinoLogger));
  app.enableShutdownHooks();

  const cfg = app.get<NotificationConfig>(NOTIFICATION_CONFIG);
  await app.listen(cfg.PORT);

  app
    .get(NestPinoLogger)
    .log(
      `notification-service listening on http://0.0.0.0:${String(cfg.PORT)} (health only)`,
      'Bootstrap',
    );
};

void bootstrap();
